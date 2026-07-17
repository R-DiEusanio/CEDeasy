# Piano — Completamento sezione Profili (SMM + Cliente)

Piano di implementazione per rendere editabile il profilo SMM e creare da zero la sezione profilo per il Cliente. Nessuna implementazione ancora avviata: questo file è la traccia da seguire task per task.

---

## Stato attuale (audit)

- **SMM**: [app/(smm)/profile.tsx](../app/(smm)/profile.tsx) esiste già ma è sola visualizzazione — avatar a iniziali, nome, email, etichetta statica "Social Media Manager", bottone logout. Nessun campo modificabile.
- **Cliente**: nessuna schermata profilo. Layout `(client)` ha solo 3 tab (Da approvare / Approvati / Dashboard); il logout è infilato nell'header di `app/(client)/index.tsx`.
- **DB `profiles`**: `id, full_name, email, role, brand_id` — nessun campo avatar/telefono/bio.
- **DB `brands`**: `id, name, category, smm_id, owner_name, email, phone, tiktok_url, instagram_url, facebook_url, telegram_url, linkedin_url, created_at` — gestita oggi solo lato SMM tramite `CreateBrandSheet.tsx`.
- Nessuna RLS `UPDATE` documentata su `profiles` (solo `profiles_select_own`).

## Decisioni prese

- Niente upload foto reale: avatar resta a iniziali per entrambi i ruoli.
- Il profilo cliente sarà una **nuova quarta tab** "Profilo" (non un'icona/modale nell'header).
- Il cliente potrà modificare i **contatti/social del brand** (telefono, email, social url), non nome/categoria del brand — restrizione applicata lato form/applicazione, non a livello di RLS column-level.

---

## Task 1 — Profilo SMM editabile

### 1.1 Backend
- [x] Riusata `upsertProfile`/`useUpsertProfile` già esistenti (`src/lib/supabase/profiles.ts`, `src/lib/queries.ts`) — non serviva una funzione nuova, l'upsert su riga esistente aggiorna già solo `full_name`
- [ ] **Azione manuale richiesta**: eseguire nel SQL editor di Supabase la policy `profiles_update_own` + trigger anti-escalation (vedi sotto) — non ho credenziali service-role per applicarla da qui

### 1.2 UI
- [x] Campo nome in `app/(smm)/profile.tsx` reso modificabile (icona matita → modalità edit con `Input`, bottoni "Annulla"/"Salva")
- [x] Stato di loading/errore gestito da `useUpsertProfile().isPending`
- [x] Cache React Query (`["profile", "me"]`) invalidata on success → l'avatar/nome si aggiornano subito ovunque venga usato `useMyProfile`

### 1.1b — SQL eseguito manualmente (Supabase SQL editor)

- [x] Policy `profiles_update_own` — **verificata già esistente** (creata in una migrazione precedente), definizione confermata identica a quella prevista: `USING (id = auth.uid())`, `WITH CHECK (id = auth.uid())`
- [x] Trigger anti-escalation `profiles_lock_role_brand` — eseguito

```sql
-- Impedisce che una UPDATE client-side alteri role o brand_id (privilege escalation)
CREATE OR REPLACE FUNCTION prevent_role_brand_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Non è consentito modificare il ruolo del profilo';
  END IF;
  IF NEW.brand_id IS DISTINCT FROM OLD.brand_id THEN
    RAISE EXCEPTION 'Non è consentito modificare il brand collegato al profilo';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER profiles_lock_role_brand
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_role_brand_change();
```

Senza la policy `profiles_update_own`, il salvataggio del nome fallirà silenziosamente/con errore RLS: **va eseguita prima di testare**.

---

## Task 2 — Nuova tab Profilo per il Cliente

### 2.1 Navigazione
- [x] Aggiunta quarta tab "Profilo" in `app/(client)/_layout.tsx` (icona `User`, stessa struttura delle tab SMM)
- [x] Rimosso il bottone logout dall'header di `app/(client)/index.tsx`

### 2.2 Nuova schermata `app/(client)/profile.tsx`
- [x] Creato il file ricalcando la struttura di `app/(smm)/profile.tsx`
- [x] Sezione dati utente: avatar a iniziali, nome (modificabile via `useUpsertProfile`), email (sola lettura)
- [x] Sezione dati brand collegato: nome/categoria/email/telefono in **sola lettura** per ora (modifica contatti/social rimandata alla Task 3, dove verrà aggiunto anche il form di editing)
- [x] Bottone "Esci dall'account" (logout spostato qui, rimosso da `index.tsx`)

**Aggiunte non previste nel piano originale, necessarie per far funzionare 2.2:**
- `getBrandById(id)` in `src/lib/supabase/brands.ts` — non esisteva una query per leggere un singolo brand per id (solo `getBrands()`, filtrata per `smm_id = auth.uid()`, inutilizzabile dal cliente)
- `useBrand(brandId)` in `src/lib/queries.ts` — hook React Query corrispondente

**Verificato:** esiste già `brands_client_read_own` (`FOR SELECT`, `USING (id = get_my_brand_id())`) — il cliente può già leggere il proprio brand. Nessuna azione DB necessaria per la Task 2.

Policy trovate su `brands` (per riferimento futuro, utile per la Task 3):
| Policy | Comando | Using | Check |
|---|---|---|---|
| `SMM can manage their own brands` | ALL | `auth.uid() = smm_id` | — |
| `brands_client_read_own` | SELECT | `id = get_my_brand_id()` | — |
| `brands_smm_full` | ALL | `smm_id = auth.uid()` | `smm_id = auth.uid()` |

Nota: le prime e la terza sembrano ridondanti (stessa condizione, nomi diversi) — probabilmente residuo di iterazioni precedenti della migrazione, non bloccante ma da segnalare per un eventuale cleanup futuro. Manca ancora una policy `UPDATE` per il cliente sul proprio brand: sarà oggetto della Task 3.

---

## Task 3 — Modifica contatti/social brand lato Cliente

### 3.1 Backend
- [x] **Non serviva una funzione nuova**: riusata `updateBrand`/`useUpdateBrand` già esistenti (`src/lib/supabase/brands.ts`, `src/lib/queries.ts`) — accettano già un `Partial<Brand>`, il form cliente invia solo i campi contatto/social
- [ ] **Azione manuale richiesta**: eseguire nel SQL editor di Supabase la policy `brands_client_update` + trigger anti-tampering (vedi sotto)
  - Cambio rispetto al piano originale: invece di lasciare la restrizione "solo lato form" com'era stato scritto qui, ho aggiunto anche un **trigger `BEFORE UPDATE`** (stesso pattern usato per `profiles` nella Task 1) che blocca modifiche a `name`/`category`/`smm_id`/`owner_name` quando chi fa l'update non è lo SMM proprietario — coerente con l'approccio già validato in Task 1 e chiude davvero il gap di sicurezza invece di limitarsi a un vincolo "onorato" solo dalla UI

### 3.2 UI
- [x] Form di modifica contatti/social nella card "Brand collegato" di `app/(client)/profile.tsx` (icona matita → Input per email/telefono/5 social → Annulla/Salva)
- [x] Validazione base: formato email (regex), campi vuoti inviati come `undefined` (non sovrascrivono con stringa vuota)
- [x] Stato di loading/errore gestito da `useUpdateBrand().isPending`
- [x] In sola lettura, i link social ora sono anche mostrati (icona generica `Link2` — lucide non include icone di brand come Instagram/Facebook) e tappabili per aprirli

### 3.1b — SQL da eseguire manualmente (Supabase SQL editor)

```sql
-- Consente al cliente di aggiornare la riga del proprio brand
CREATE POLICY brands_client_update ON brands
FOR UPDATE
TO authenticated
USING (id = get_my_brand_id())
WITH CHECK (id = get_my_brand_id());

-- Impedisce che un cliente (non lo SMM proprietario) modifichi nome/categoria/referente/smm_id
CREATE OR REPLACE FUNCTION prevent_client_brand_field_change()
RETURNS trigger AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM OLD.smm_id THEN
    IF NEW.name IS DISTINCT FROM OLD.name THEN
      RAISE EXCEPTION 'Solo lo SMM può modificare il nome del brand';
    END IF;
    IF NEW.category IS DISTINCT FROM OLD.category THEN
      RAISE EXCEPTION 'Solo lo SMM può modificare la categoria del brand';
    END IF;
    IF NEW.owner_name IS DISTINCT FROM OLD.owner_name THEN
      RAISE EXCEPTION 'Solo lo SMM può modificare il referente del brand';
    END IF;
    IF NEW.smm_id IS DISTINCT FROM OLD.smm_id THEN
      RAISE EXCEPTION 'Non è consentito modificare lo SMM collegato al brand';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER brands_lock_owner_fields
BEFORE UPDATE ON brands
FOR EACH ROW
EXECUTE FUNCTION prevent_client_brand_field_change();
```

Senza la policy `brands_client_update`, il salvataggio dei contatti fallirà con un errore RLS: **va eseguita prima di testare**.

---

## Task 4 — Migrazioni DB

- [x] Scrivere migrazione SQL per `profiles_update_own` — policy già esistente, scritto e applicato solo il trigger `profiles_lock_role_brand` (Task 1.1)
- [x] Scrivere migrazione SQL per `brands_client_update` — policy + trigger `brands_lock_owner_fields` scritti ed eseguiti dall'utente (Task 3.1)
- [x] Documentare le nuove policy — fatto inline in questo file (sezioni 1.1b e 3.1b)
- [x] Aggiornare la memoria di progetto (`project_db_schema.md`) con le nuove policy/trigger su `profiles` e `brands`

---

## Task 5 — Verifica

- [x] Test manuale SMM: modifica nome, salva, verifica persistenza dopo reload
- [x] Test manuale Cliente: naviga alla nuova tab Profilo, modifica un contatto brand, verifica persistenza
- [x] Verifica che un cliente non possa modificare `role`, `brand_id`, o il profilo di un altro utente (test RLS)
- [x] Verifica che un cliente non possa modificare `name`/`category` del brand dall'app (limite applicativo)
- [x] Verifica su viewport mobile (come da setup abituale, emulazione iPhone 390×844)

Eseguita manualmente dall'utente (2026-07-08) — nessuna regressione riscontrata.

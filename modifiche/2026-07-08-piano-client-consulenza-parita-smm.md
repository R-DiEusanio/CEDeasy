# Piano — Il cliente in Consulenza ha la stessa schermata/poteri dello SMM in Gestione

Segue [modifiche/2026-07-07-piano-modalita-consulenza.md](2026-07-07-piano-modalita-consulenza.md) (Task 1-10, completate). Questo piano corregge l'impostazione della Task 7 di quel file: la schermata cliente "ridotta" (tab Bozze/In revisione/Approvati + sheet semplificati) viene sostituita da una **parità piena** con l'esperienza SMM in Gestione. Nessuna implementazione ancora avviata.

---

## Decisioni prese (confermate dall'utente 2026-07-08)

- Il cliente in Consulenza deve avere **la stessa schermata** che ha oggi lo SMM su un brand in Gestione ([app/(smm)/brands/[brandId].tsx](../app/(smm)/brands/[brandId].tsx)): calendario `ContentGrid`, FAB "+", lista post, dettaglio post con modifica/elimina.
- **Stessi poteri**: il cliente può creare, modificare ed **eliminare** i propri post in qualsiasi stato (non solo mentre sono `CLIENT_DRAFT`/`SMM_REVIEW` come oggi).
- Il cliente può **modificare un post anche dopo che l'SMM lo ha approvato** (`SMM_APPROVED`).
- Approccio implementativo: **ibrido**. `ContentGrid` è già neutro, riusabile senza modifiche. `CreatePostSheet`/`EditPostSheet`/`PostDetailSheet` diventano "consapevoli del ruolo" (letto da `useAppStore().role`) invece di essere duplicati — evita di mantenere due implementazioni parallele del dettaglio post, che oggi contiene già tutta la logica Consulenza lato SMM (Task 6.4 del piano precedente).
- Restano **invariati**: SMM in Gestione (nessuna regressione attesa), cliente in Gestione (tab Bozze/In revisione/Approvati + `ClientPostDetailSheet` restano come sono, questo piano riguarda solo i clienti Consulenza).

## Nota di sicurezza scoperta durante la progettazione (da applicare in Task 1)

Concedere al cliente la modifica anche dopo `SMM_APPROVED` **non deve permettere di scrivere lo status `SMM_APPROVED` partendo da uno stato diverso** — altrimenti si riapre esattamente il bypass di auto-approvazione chiuso nel piano precedente (Task 3.4): un cliente potrebbe inviare un update con `status: 'SMM_APPROVED'` direttamente da `SMM_REVIEW`, auto-approvandosi. La RLS da sola non distingue "OLD.status" da "NEW.status" nello stesso controllo (`WITH CHECK` vede solo la riga nuova) — serve il trigger, che ha accesso a entrambi:

- Se `OLD.status = 'SMM_APPROVED'`: il cliente può cambiare i campi di contenuto ma **non può cambiare lo status** (né tornare indietro a `SMM_REVIEW`/`CLIENT_DRAFT`, né altro).
- Se `OLD.status` è `CLIENT_DRAFT`/`SMM_REVIEW`: invariato rispetto a oggi, il cliente non può mai scrivere `SMM_APPROVED`.

---

## Task 1 — DB: permessi cliente estesi (DELETE + UPDATE dopo approvazione)

### 1.1 DELETE per il cliente sui propri post Consulenza
- [x] Nuova policy `posts_client_delete` — DELETE, `USING: brand_id = get_my_brand_id() AND work_mode = 'CONSULTANCY'` (nessuna restrizione di stato, parità con `posts_smm_full` che è `ALL` senza filtri)

### 1.2 UPDATE esteso a `SMM_APPROVED`
- [x] Estendere `posts_client_update_consultancy`: `USING`/`WITH CHECK` includono anche `SMM_APPROVED` nell'insieme di stati (oggi solo `CLIENT_DRAFT`/`SMM_REVIEW`) — necessario altrimenti la riga non è nemmeno selezionabile per l'update una volta approvata

### 1.3 Trigger anti-tampering aggiornato
- [x] `prevent_client_post_tampering()`: aggiungere la logica OLD/NEW descritta sopra — permette la modifica dei contenuti quando `OLD.status = 'SMM_APPROVED'` ma blocca qualunque cambio di `status` in quel caso; per gli altri stati Consulenza il comportamento resta quello del piano precedente (mai scrivibile `SMM_APPROVED` da un cliente)

### 1.4 DELETE sui commenti (dipendenza tecnica di `deletePost()`)
- [x] Nuova policy `comments_client_delete` — oggi il cliente non ha **nessun** permesso di `DELETE` su `comments`; `deletePost()` cancella prima i commenti del post (nessun `ON DELETE CASCADE` nel DB) e senza questa policy l'eliminazione del post da parte del cliente fallirebbe a metà. Ambito: solo commenti di post Consulenza del proprio brand (include anche i suggerimenti scritti dall'SMM, rimossi insieme al post che li conteneva)

### 1.5 — SQL da eseguire manualmente (Supabase SQL editor)
- [x] Eseguito dall'utente (2026-07-08) — "Success. No rows returned"

```sql
-- 1.1
CREATE POLICY posts_client_delete ON posts
FOR DELETE
TO authenticated
USING (
  brand_id = get_my_brand_id()
  AND work_mode = 'CONSULTANCY'
);

-- 1.2 (sostituisce la policy esistente con la stessa struttura + SMM_APPROVED)
DROP POLICY posts_client_update_consultancy ON posts;

CREATE POLICY posts_client_update_consultancy ON posts
FOR UPDATE
TO authenticated
USING (
  brand_id = get_my_brand_id()
  AND work_mode = 'CONSULTANCY'
  AND status IN ('CLIENT_DRAFT', 'SMM_REVIEW', 'SMM_APPROVED')
)
WITH CHECK (
  brand_id = get_my_brand_id()
  AND work_mode = 'CONSULTANCY'
  AND status IN ('CLIENT_DRAFT', 'SMM_REVIEW', 'SMM_APPROVED')
);

-- 1.3 (sostituisce la funzione esistente)
CREATE OR REPLACE FUNCTION prevent_client_post_tampering()
RETURNS trigger AS $$
DECLARE
  is_owner boolean;
BEGIN
  SELECT (b.smm_id = auth.uid()) INTO is_owner
  FROM brands b WHERE b.id = OLD.brand_id;

  IF is_owner THEN
    RETURN NEW;
  END IF;

  IF NEW.brand_id IS DISTINCT FROM OLD.brand_id THEN
    RAISE EXCEPTION 'Non è consentito spostare il post su un altro brand';
  END IF;

  IF NEW.work_mode IS DISTINCT FROM OLD.work_mode THEN
    RAISE EXCEPTION 'Non è consentito modificare il work_mode del post';
  END IF;

  IF NEW.work_mode = 'CONSULTANCY' THEN
    IF OLD.status = 'SMM_APPROVED' THEN
      -- Post già approvato: il cliente può modificare il contenuto ma non lo status
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'Il cliente non può cambiare lo stato di un post già approvato dall''SMM';
      END IF;
    ELSIF NEW.status NOT IN ('CLIENT_DRAFT', 'SMM_REVIEW') THEN
      RAISE EXCEPTION 'Solo lo SMM può approvare un post in Consulenza';
    END IF;
  END IF;

  IF NEW.work_mode = 'FULL_MANAGEMENT' AND NEW.status NOT IN ('APPROVED', 'CHANGES_REQUESTED') THEN
    RAISE EXCEPTION 'Il cliente può solo approvare o richiedere modifiche su un post in Gestione';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.4
CREATE POLICY comments_client_delete ON comments
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = comments.post_id
    AND posts.brand_id = get_my_brand_id()
    AND posts.work_mode = 'CONSULTANCY'
  )
);
```

Senza questa migrazione: eliminazione post lato cliente fallisce (nessun permesso), e la modifica dopo approvazione viene rifiutata dalla RLS — **va eseguita prima di testare la Task 3**.

---

## Task 2 — Estrarre la schermata condivisa

### 2.1 Nuovo componente `components/BrandPostsBoard.tsx`
- [x] Estratto da [app/(smm)/brands/[brandId].tsx](../app/(smm)/brands/[brandId].tsx): `ContentGrid` + `FlatList` post + FAB crea + gli sheet (`CreatePostSheet`, `PostDetailSheet`), parametrizzato su `brandId` + `workMode` (passato dal chiamante, serve per sapere se bloccare la creazione diretta) + `openPostId` opzionale
- [x] Header (nome brand, categoria, chip modalità, codice cliente) **non** estratto: resta specifico SMM in `[brandId].tsx` — il cliente non ne ha bisogno (non deve copiare il proprio codice di invito, non vede la propria modalità come chip cliccabile)
- [x] Il ruolo (SMM o cliente) letto internamente da `useAppStore().role`: usato solo per decidere se la creazione diretta è permessa qui (`canCreateHere = !(role === 'smm' && workMode === 'consulenza')`) — in Consulenza il cliente crea sempre, lo SMM mai

### 2.2 `app/(smm)/brands/[brandId].tsx`
- [x] Ridotto a thin wrapper: header (back-button, nome/categoria, chip modalità Task 6.6, codice cliente) + `<BrandPostsBoard brandId={brandId} workMode={brand?.workMode ?? 'gestione'} openPostId={openPostId} />`
- [x] Rimossi import/stati/stili ormai spostati in `BrandPostsBoard` (calendario, lista, FAB, relativi stili)

### 2.3 `app/(client)/index.tsx`
- [x] Se `brand.workMode === 'consulenza'`: renderizza `<BrandPostsBoard brandId={activeBrandId} workMode="consulenza" />` (più un titolo "Post" minimale) al posto delle tab Bozze/In revisione/Approvati
- [x] Se `gestione`: **nessuna modifica al comportamento** — stesso flusso di prima estratto in un componente `GestioneClientPosts` interno al file (tab + `ClientPostDetailSheet`), invariato

### 2.4 Ritiro componenti Task 7 ormai sostituiti
- [x] Rimosso `components/CreateClientPostSheet.tsx` (sostituito da `CreatePostSheet` reso role-aware, Task 3.1)
- [x] Rimosso `components/EditClientPostSheet.tsx` (sostituito da `EditPostSheet` reso role-aware, Task 3.2)
- [x] `components/ClientPostDetailSheet.tsx`: rimosso il ramo Consulenza aggiunto nella Task 7 (branch `isConsulenza`, `FieldSuggestions`, "Invia all'SMM") — il componente torna a occuparsi **solo** del flusso Gestione, invariato rispetto a prima della Task 7

### Verifica
- [x] `tsc --noEmit`: 10 errori, tutti la stessa tipizzazione pre-esistente `RefObject<BottomSheetModal | null>` già nota (nessuno nuovo — anzi il conteggio è sceso di 2 rispetto a subito dopo la Task 7, grazie alla rimozione dei componenti gemelli)
- [ ] **Nota**: `BrandPostsBoard` per ora usa ancora `CreatePostSheet`/`PostDetailSheet` senza distinzione di ruolo — se un cliente Consulenza prova a creare un post ora, la RLS lo rifiuta (`CreatePostSheet` chiama ancora `useCreatePost`, non permesso al cliente). Non funzionale finché non si completa la Task 3.

---

## Task 3 — Rendere condivisi gli sheet SMM (role-aware)

### 3.1 `CreatePostSheet.tsx`
- [x] Se `useAppStore().role === 'client'`: chiama `useCreateClientPost` invece di `useCreatePost` (il prop `brandId` resta accettato per compatibilità col ramo SMM ma è ignorato in quel ramo) e nasconde il campo "Note interne"
- [x] Se `role === 'smm'`: comportamento invariato

### 3.2 `EditPostSheet.tsx`
- [x] Se `role === 'client'`: nasconde "Note interne" e **non la rimanda mai in scrittura** (non solo nascosta in UI: esclusa esplicitamente dal payload di `updatePost`, altrimenti il valore stantio pre-caricato al momento dell'apertura del form avrebbe potuto sovrascrivere una nota SMM più recente — bug scoperto durante l'implementazione, non previsto nel piano originale)
- [x] Se `role === 'smm'`: comportamento invariato

### 3.3 `PostDetailSheet.tsx` — generalizzato il branch Consulenza
- [x] Aggiunta la distinzione **creatore (cliente, `isCreator`)** vs **revisore (SMM, `isReviewer`)**:
  - **Cliente (creatore)**: Modifica + Elimina sempre disponibili (`creatorCanEdit = isCreator`, nessuna condizione di stato — coerente con la Task 1.2/1.3), "Invia all'SMM" solo mentre `CLIENT_DRAFT`
  - **SMM (revisore)**: invariato rispetto al piano precedente — suggerimenti ancorati a un campo (composer), Modifica, Approva, solo mentre `SMM_REVIEW`
- [x] **Elimina non richiedeva nuovo codice**: il bottone era già renderizzato incondizionatamente (nessun controllo di ruolo/stato) — bastava la RLS `posts_client_delete` della Task 1 per farlo funzionare anche per il cliente
- [x] Portato qui `FieldSuggestions` (prima solo in `ClientPostDetailSheet.tsx`, Task 7) per il ramo cliente-creatore, in sola lettura — il composer con selettore di campo (`CommentsThread suggestionMode`) resta invece esclusivo del ramo revisore SMM
- [x] Portata anche la nota "Il tuo SMM ha modificato questo post" (`modifiedBySmm`, basata su `post.lastUpdatedBy`) per il ramo creatore
- [x] Verificato con `tsc --noEmit`: 10 errori, stesse categorie pre-esistenti (`RefObject<BottomSheetModal>`, `Input.tsx`, `last_updated_by` mancante in `postToDbInsert`), nessuna regressione

---

## Task 4 — Verifica

- [ ] Cliente Consulenza: vede `ContentGrid`, crea un post da tap su un giorno, lo modifica, lo elimina, lo invia all'SMM
- [ ] Cliente Consulenza: può modificare (non eliminare stato, solo contenuto) un post anche dopo `SMM_APPROVED`; verificare che non possa comunque scrivere `status` direttamente
- [ ] SMM in Consulenza: continua a vedere solo suggerimenti/modifica/approva durante `SMM_REVIEW`, nessuna regressione dal branch "creatore" aggiunto per il cliente
- [ ] Cliente Gestione: nessuna regressione — tab Bozze non compare, `ClientPostDetailSheet` invariato
- [ ] SMM Gestione: nessuna regressione dopo l'estrazione di `BrandPostsBoard`
- [ ] RLS: un cliente non può eliminare/modificare un post di un brand che non è il suo, né un post Gestione, né scrivere `status = 'SMM_APPROVED'` partendo da un altro stato
- [ ] Verifica su viewport mobile (emulazione iPhone 390×844, come da setup abituale)

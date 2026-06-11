# Sessione di fix — 11 Giugno 2026

Audit completo e correzione bug post-migrazione da backend Java + `api.ts` a React + Supabase.

---

## Audit iniziale

Prima di qualsiasi modifica è stato eseguito un audit in sola lettura dell'intera codebase. I bug identificati sono stati classificati per priorità:

| # | Priorità | Problema |
|---|----------|---------|
| 1 | 🔴 | `hasChangesRequested` sempre `false` — semaforo rotto |
| 2 | 🔴 | `ClientMobileTabBar` mai montata nel layout cliente |
| 3 | 🔴 | MobileTabBar SMM: link Calendario con `brandId: null` |
| 4 | 🔴 | `deleteBrand` senza pulizia post/commenti *(ignorato — ON DELETE CASCADE già presente nel DB)* |
| 5 | 🟡 | Activity feed con dati mock hardcoded *(rinviato)* |
| 6 | 🟡 | `CreatePostDialog` non resetta il form alla chiusura manuale |
| 7 | 🟡 | Contatore "Modifiche richieste" conta solo i 6 post recenti |
| 8 | 🟡 | `RoleSwitch` non redirige alla route corretta |
| 9 | 🟡 | Meta tag Lovable nel root dell'app |
| 10 | 🟡 | Link "Password dimenticata?" circolare |
| 11–17 | 🟢 | Dipendenze inutilizzate, dead code, nomi fuorvianti |

---

## Fix 1 — Semaforo: `hasChangesRequested` sempre false

**File:** `src/lib/supabase/posts.ts`

Il mapping `DB_TO_FRONTEND` aveva `hasChangesRequested: false` per tutti gli stati, incluso `REVISION_REQUESTED`. Il flag non era mai `true`, quindi:
- Il badge con l'icona matita su `PostCard` non appariva mai
- Il contatore "Modifiche richieste" nella dashboard SMM era sempre 0
- Il bordo allerta su `PostClientCard` non scattava mai

**Correzione:** `REVISION_REQUESTED` riportato a `false` (semanticamente corretto: il cliente non ha ancora risposto). Il `true` viene assegnato al nuovo stato `CHANGES_REQUESTED` introdotto successivamente.

---

## Fix 2 — `ClientMobileTabBar` mai montata

**File:** `src/routes/client.tsx`

Il componente `ClientMobileTabBar` era definito in `MobileTabBar.tsx` ma non veniva mai importato né renderizzato nel layout cliente. Gli utenti su mobile nell'area cliente non avevano una barra di navigazione inferiore.

**Correzione:** importazione di `ClientMobileTabBar` e montaggio alla fine del layout. Aggiunto `pb-24` al `<main>` su mobile per evitare che i contenuti finissero sotto la barra (`lg:pb-8` su desktop).

---

## Fix 3 — MobileTabBar SMM: link Calendario rotto con `brandId: null`

**File:** `src/components/MobileTabBar.tsx`

Il tab "Calendario" usava `params: { brandId: activeBrandId }`. All'avvio della sessione `activeBrandId` è `null` (valore iniziale dell'AppStore), causando un tentativo di navigazione verso `/smm/brand/null`.

**Correzione:** il tab Calendario è ora condizionale:
- Se `activeBrandId` non è null → `<Link>` verso la route del brand
- Se `activeBrandId` è null → `<span>` opaco con `cursor-not-allowed` e tooltip "Seleziona prima un brand"

Rimosso anche il cast `as any` non necessario sull'array `items`.

---

## Fix 4 — `CreatePostDialog`: form non resettato alla chiusura manuale

**File:** `src/components/CreatePostDialog.tsx`

`title` e `caption` venivano resettati solo in caso di creazione riuscita. Se l'utente apriva il dialog, compilava dei campi, poi lo chiudeva senza creare il post e lo riapreva, trovava ancora i dati precedenti. `type` e `date` non venivano mai resettati nemmeno on success.

**Correzione:** aggiunto un `useEffect` su `open` che resetta tutti e quattro i campi (`title`, `caption`, `type`, `date`) ogni volta che il dialog si chiude, coprendo sia la chiusura manuale che quella post-creazione.

---

## Fix 5 — `RoleSwitch`: cambio ruolo senza redirect

**File:** `src/components/RoleSwitch.tsx`

Il componente aggiornava solo lo store locale (`setRole`) senza navigare alla route corrispondente. Cliccando "Cliente" mentre si era su `/smm`, l'utente restava sulla route SMM ma con la UI che mostrava i pulsanti cliente.

**Correzione:** aggiunto `useNavigate`. Il click su "SMM" esegue `navigate({ to: "/smm" })`, il click su "Cliente" esegue `navigate({ to: "/client" })`.

---

## Fix 6 — Flusso "Richiedi modifiche": stato CHANGES_REQUESTED

Questo fix è stato sviluppato in più iterazioni dopo aver identificato un problema di UX nel flusso di rifiuto da parte del cliente.

### Problema

Quando il cliente richiedeva modifiche, il post tornava allo stato `PENDING` nel DB (identico a una normale bozza privata). L'SMM non aveva modo di distinguere visivamente una bozza mai inviata da un post rifiutato dal cliente con feedback in attesa.

### Soluzione — Nuovo stato `CHANGES_REQUESTED`

**File:** `src/lib/supabase/posts.ts`

Aggiunto `CHANGES_REQUESTED` come nuovo stato DB semanticamente distinto:

| DB status | Frontend status | `hasChangesRequested` | Significato |
|-----------|----------------|----------------------|-------------|
| `PENDING` | `draft` | `false` | Bozza privata mai inviata |
| `DRAFT` | `draft` | `false` | Bozza privata |
| `REVISION_REQUESTED` | `pending` | `false` | Inviato al cliente, in attesa |
| `CHANGES_REQUESTED` | `draft` | `true` | ⚠ Cliente ha richiesto modifiche |
| `APPROVED` | `approved` | `false` | Approvato |
| `PUBLISHED` | `approved` | `false` | Pubblicato |

L'azione "Richiedi modifiche" del cliente ora scrive `CHANGES_REQUESTED` invece di `PENDING`.

**File:** `src/components/StatusBadge.tsx`

Aggiunto un ramo dedicato: quando `hasChanges && status === "draft"`, il badge mostra "⚠ Modifica richiesta" con stile arancio-rosso (OKLch hue 25) e icona `AlertTriangle` invece del normale "Bozza privata".

**File:** `src/components/PostCard.tsx`

Quando `hasChangesRequested` è `true`:
- Bordo rosso `border-2` con colore `oklch(0.68 0.2 25)`
- Header con gradient monocromatico warm invece del colore del tipo di post
- Icona `AlertTriangle` al posto di `Pencil`
- `hasChanges` passato al `StatusBadge` per mostrare il badge corretto

---

## Fix 7 — Database: policy e vincoli Supabase

Tre interventi SQL eseguiti direttamente su Supabase durante il debug del flusso "Richiedi modifiche".

### 7a — Aggiornamento `posts_client_read`

Aggiunto `CHANGES_REQUESTED` alla blacklist della policy SELECT del cliente, in modo che i post rifiutati tornino invisibili al cliente (come le bozze private).

```sql
-- già presente nella policy, aggiunto 'CHANGES_REQUESTED':
AND status NOT IN ('PENDING', 'DRAFT', 'CHANGES_REQUESTED')
```

### 7b — Nuova policy `posts_client_update`

Non esisteva nessuna policy UPDATE per i clienti. Ogni mutazione client-side (approvazione o richiesta modifiche) veniva silenziosamente bloccata da Supabase RLS.

```sql
CREATE POLICY posts_client_update ON posts
FOR UPDATE
TO authenticated
USING (
  brand_id = get_my_brand_id()
  AND status = 'REVISION_REQUESTED'
)
WITH CHECK (
  brand_id = get_my_brand_id()
  AND status IN ('APPROVED', 'CHANGES_REQUESTED')
);
```

- `USING`: il cliente può modificare solo post del suo brand in stato `REVISION_REQUESTED`
- `WITH CHECK`: il nuovo stato può essere solo `APPROVED` o `CHANGES_REQUESTED`

### 7c — Aggiornamento CHECK constraint `posts_status_check`

Il CHECK constraint generato da Hibernate non includeva `CHANGES_REQUESTED`. Qualsiasi tentativo di scrivere il nuovo valore produceva un errore 400 Bad Request.

```sql
ALTER TABLE posts DROP CONSTRAINT posts_status_check;

ALTER TABLE posts ADD CONSTRAINT posts_status_check
  CHECK (status IN (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REVISION_REQUESTED',
    'PUBLISHED',
    'CHANGES_REQUESTED'
  ));
```

---

## Note aperte

- **Activity Feed** (`RecentActivityFeed.tsx`): mostra ancora dati mock hardcoded. Da collegare a Supabase in una sessione futura.
- **Policy "Enable read access for all users"**: policy SELECT con `qual: true` che rende tutti i post leggibili da chiunque, override della `posts_client_read`. Da rivedere per la sicurezza.
- **Dipendenze inutilizzate** in `package.json`: `@supabase/ssr`, `react-hook-form`, `@hookform/resolvers`, `date-fns`, e altri package shadcn/ui non usati nell'UI attuale.

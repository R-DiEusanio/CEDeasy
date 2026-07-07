# Piano — Consulenza come flusso invertito (cliente crea, SMM revisiona/approva)

Piano di implementazione per trasformare la sezione "Consulenza" della dashboard SMM: oggi è solo un'etichetta UI senza effetto, deve diventare un flusso reale in cui il **cliente crea il post**, l'**SMM suggerisce/modifica/approva**, e lo switch Gestione/Consulenza filtra davvero la lista clienti mostrata. Nessuna implementazione ancora avviata: questo file è la traccia da seguire task per task.

---

## Stato attuale (audit)

- **Dashboard SMM** ([app/(smm)/index.tsx](../app/(smm)/index.tsx)): switch Gestione/Consulenza esiste ma è solo `smmMode` in `AppStoreProvider` ([src/lib/app-store.tsx](../src/lib/app-store.tsx)), persistito in AsyncStorage — **non filtra nessuna lista**, è un residuo/placeholder.
- **`brands`**: nessun campo che distingua Gestione da Consulenza. La modalità è una proprietà del rapporto SMM↔cliente, va aggiunta qui.
- **`posts.work_mode`**: colonna già esistente in DB con CHECK `posts_work_mode_check` (`CONSULTANCY` | `FULL_MANAGEMENT`), ma **hardcoded a `FULL_MANAGEMENT`** in `postToDbInsert` ([src/lib/supabase/posts.ts:92](../src/lib/supabase/posts.ts#L92)) — terreno predisposto, mai collegato a niente.
- **Creazione post**: oggi solo lato SMM tramite `CreatePostSheet.tsx`, usato solo in [app/(smm)/brands/[brandId].tsx](../app/(smm)/brands/[brandId].tsx). Nessuna via di creazione lato cliente, nessuna policy RLS `INSERT` per il cliente su `posts` (solo `posts_smm_full`, ALL, per lo SMM proprietario del brand).
- **Stati post** (`posts_status_check`): `DRAFT`, `PENDING`, `APPROVED`, `REVISION_REQUESTED`, `PUBLISHED`, `CHANGES_REQUESTED` — semantica attuale legata alla direzione "SMM→cliente" (vedi mapping semaforo in `posts.ts`). Andrà rivista per il verso opposto.
- **`comments`**: tabella già esistente con RLS (`comments_client_read`, e una policy insert cliente limitata a quando il post è `REVISION_REQUESTED`) — base già pronta per i "suggerimenti", ma oggi pensata solo per commenti del cliente, non dell'SMM sul post del cliente.
- **Lista clienti SMM**: [app/(smm)/brands/index.tsx](../app/(smm)/brands/index.tsx) mostra tutti i brand dello SMM (`getBrands()`, RLS `brands_smm_full`), nessun filtro per modalità.
- **Creazione cliente**: `CreateBrandSheet.tsx` non ha alcun campo di modalità.

## Decisioni prese (dal brainstorm precedente)

- In **Consulenza**: il cliente crea il post, l'SMM dà suggerimenti, può modificare direttamente il contenuto, e **approva lui** (l'ultima parola in Consulenza è dell'SMM, non del cliente — inverso rispetto a Gestione).
- In **Gestione**: resta tutto com'è oggi (SMM crea, cliente approva).
- Lo switch Gestione/Consulenza in dashboard deve **filtrare davvero** la lista clienti in base alla modalità del brand, non essere solo cosmetico.
- **(Q1 risolta, 2026-07-07)** La modalità di un cliente **non è fissa alla creazione**: lo SMM può farlo passare da Gestione a Consulenza o viceversa in qualsiasi momento, da una schermata di modifica del brand. Il cambio è **una scelta esclusiva dello SMM**, il cliente non può modificarla. Il passaggio di modalità **non tocca i post già esistenti** (restano nel loro stato/flusso originale) — vale solo per i post creati dopo il cambio. Vedi Task 1.2 e 6.6.
- **(Q2 risolta, 2026-07-07)** Il cliente vede solo il **risultato finale** quando l'SMM modifica il suo post, non un diff/prima-dopo strutturato — accompagnato da un'eventuale nota/commento dell'SMM che spiega la modifica.
- **(Q4 risolta, 2026-07-07)** Nessun sistema di notifiche nuovo: si riusa il meccanismo "Attività recenti" già esistente in dashboard (`getRecentActivities`), estendendone i tipi di evento per coprire "cliente ha proposto un post" e "SMM ha approvato in Consulenza".

- **(Q3 risolta, 2026-07-07)** I suggerimenti dell'SMM sono **ancorati a un campo specifico** del post (es. titolo/caption/media/data), non semplici commenti testuali liberi. Vedi Task 4 per il modello dati.

## Decisioni storiche (mantenute per riferimento, nel caso si voglia rivedere una scelta già presa)

- **Q3** (risolta il 2026-07-07 come sopra): l'alternativa scartata era il riuso di `comments` con un campo `kind` (`comment`/`suggestion`) senza ancoraggio per-campo — più semplice da implementare ma meno preciso. Tenuta qui per poterla reintrodurre facilmente se l'ancoraggio per-campo si rivelasse troppo rigido in pratica.

---

## Task 1 — DB: modalità per cliente (`brands.work_mode`)

### 1.1 Migrazione
- [x] SQL scritto (vedi 1.1b sotto)
- [x] Eseguito dall'utente nel SQL editor di Supabase (2026-07-07) — "Success. No rows returned"
- [x] Comportamento invariato per i clienti esistenti: la colonna ha `DEFAULT 'FULL_MANAGEMENT'`, quindi tutti i brand già presenti risultano automaticamente in Gestione

### 1.1b — SQL da eseguire manualmente (Supabase SQL editor)

```sql
-- Aggiunge la modalità di lavoro al brand (cliente): FULL_MANAGEMENT (default, invariato per i clienti esistenti) o CONSULTANCY
ALTER TABLE brands
  ADD COLUMN work_mode text NOT NULL DEFAULT 'FULL_MANAGEMENT';

ALTER TABLE brands
  ADD CONSTRAINT brands_work_mode_check CHECK (work_mode IN ('CONSULTANCY', 'FULL_MANAGEMENT'));
```

Nessuna nuova policy RLS necessaria per l'`UPDATE` di questa colonna: `brands_smm_full` (`ALL`, `USING/WITH CHECK: smm_id = auth.uid()`) copre già la scrittura, essendo `ALL` senza restrizione per-colonna. Va solo verificato che nessun trigger esistente su `brands` blocchi la colonna (il trigger `brands_lock_owner_fields` blocca solo `name`/`category`/`owner_name`/`smm_id` — `work_mode` non è nella lista, quindi resta libero).

### 1.2 Modifica cliente esistente
- [x] Confermato: `work_mode` è aggiornabile in qualsiasi momento dallo SMM tramite una semplice `UPDATE`, coperta dalla policy `brands_smm_full` esistente — nessuna policy/trigger nuovo necessario per questo (vedi 1.1b)
- [x] Confermato: il cambio modalità **non richiede alcuna migrazione/aggiornamento dei post già esistenti** sul brand — i post creati prima del cambio restano legati al `work_mode` con cui sono stati creati (campo `posts.work_mode`, già per-post, impostato all'inserimento e mai derivato dinamicamente dal brand), quindi continuano il loro flusso originale (Gestione o Consulenza) fino a conclusione

---

## Task 2 — DB: stati del post per il flusso Consulenza

### 2.1 Scelta del modello di stati
- [x] **Deciso (2026-07-07)**: 3 nuovi valori dedicati, non riuso di quelli esistenti (per non sovraccaricare semanticamente stati come `PENDING`/`DRAFT` che oggi significano "bozza privata mai vista dal cliente" — incompatibile col significato opposto "bozza proposta dal cliente"):
  - `CLIENT_DRAFT` — il cliente sta scrivendo il post, non ancora inviato all'SMM
  - `SMM_REVIEW` — il cliente ha inviato, l'SMM valuta: aggiunge suggerimenti e/o modifica direttamente
  - `SMM_APPROVED` — l'SMM ha approvato, stato finale pubblicabile
- [x] **Deciso**: il cliente può modificare il proprio post sia in `CLIENT_DRAFT` sia in `SMM_REVIEW` (non solo nello stato iniziale) — per poter recepire un suggerimento dell'SMM senza bisogno di un ulteriore stato "rimandato al cliente". Dopo `SMM_APPROVED` il post è di sola lettura per il cliente. Riflesso in Task 3.2.

### 2.2 Migrazione CHECK constraint
- [x] SQL scritto (vedi 2.2b sotto)
- [x] Eseguito dall'utente nel SQL editor di Supabase (2026-07-07) — "Success. No rows returned"

### 2.2b — SQL da eseguire manualmente (Supabase SQL editor)

```sql
-- Aggiunge i 3 stati dedicati al flusso Consulenza, mantenendo tutti quelli esistenti per la Gestione
ALTER TABLE posts DROP CONSTRAINT posts_status_check;

ALTER TABLE posts ADD CONSTRAINT posts_status_check CHECK (
  status IN (
    'DRAFT', 'PENDING', 'APPROVED', 'REVISION_REQUESTED', 'PUBLISHED', 'CHANGES_REQUESTED', -- Gestione (invariati)
    'CLIENT_DRAFT', 'SMM_REVIEW', 'SMM_APPROVED'                                              -- Consulenza (nuovi)
  )
);
```

Sicura da eseguire: le righe esistenti hanno solo valori già presenti nella vecchia lista, quindi il `DROP`+`ADD` non lascia mai la tabella senza vincolo attivo in modo incoerente (la finestra fra i due comandi è nella stessa transazione implicita dello statement batch).

### 2.3 Mapping frontend
- [x] Estesa `DB_TO_FRONTEND` in [posts.ts](../src/lib/supabase/posts.ts) con i 3 nuovi stati e il semaforo corrispondente (`CLIENT_DRAFT`→draft, `SMM_REVIEW`→pending, `SMM_APPROVED`→approved)
- [x] Aggiunto `workMode` al tipo `Post` ([mock-data.ts](../src/lib/mock-data.ts)) e ai converter `DB_TO_FRONTEND_WORK_MODE`/`FRONTEND_TO_DB_WORK_MODE`, popolato in `toPost()` — ogni post ora sa se appartiene al flusso Gestione o Consulenza
- [x] DTO di creazione (`postToDbInsert`, `createPost`, `useCreatePost`) escludono per ora `workMode` dall'Omit — resta scritto hardcoded `FULL_MANAGEMENT` come oggi, la derivazione dal brand è esplicitamente Task 5.2 (nessuna via di creazione lato cliente esiste ancora)
- [x] `FRONTEND_STATUS_TO_DB` **non ancora esteso**: resta solo il mapping Gestione, commentato per chiarire che le transizioni Consulenza (azioni su `CLIENT_DRAFT`/`SMM_REVIEW`/`SMM_APPROVED`) arrivano in Task 5 quando `updatePostStatus` diventa work_mode-aware
- [x] Verificato con `tsc --noEmit`: nessuna nuova regressione (11 errori pre-esistenti invariati, nessuno introdotto da queste modifiche)
- [ ] Promemoria per la Task 6/7 (UI): il codice dovrà discriminare il semaforo/etichette in base al `work_mode` del post, non solo allo `status` — oggi `statusLabel` in `mock-data.ts` (es. "Bozza privata") è generico e fuorviante per un post in Consulenza

---

## Task 3 — RLS: permessi di scrittura per il flusso invertito

### 3.1 Creazione post da parte del cliente
- [x] SQL scritto (vedi 3.5b sotto): policy `posts_client_insert`

### 3.2 Modifica del proprio post da parte del cliente
- [x] Confermato: il cliente può modificare il post sia in `CLIENT_DRAFT` sia in `SMM_REVIEW` (per recepire suggerimenti, come deciso in Task 2.1)
- [x] SQL scritto (vedi 3.5b sotto): policy `posts_client_update_consultancy`, **distinta** dalla `posts_client_update` esistente per Gestione (non la sostituisce, coesistono)

### 3.3 Verifica permessi SMM
- [x] Confermato: `posts_smm_full` (ALL, `brands.smm_id = auth.uid()`) copre già senza modifiche la scrittura/modifica/approvazione SMM sui post in Consulenza — nessuna policy nuova necessaria

### 3.4 Rischio scoperto: bypass via OR fra policy permissive
- [x] **Analisi**: la policy `posts_client_update` esistente (Gestione) ha `WITH CHECK: status IN ('APPROVED','CHANGES_REQUESTED')` **senza filtro su `work_mode`**. In Postgres, più policy permissive sullo stesso comando combinano i loro `WITH CHECK` in OR indipendentemente dalla policy che ha soddisfatto lo `USING`. Risultato: un cliente potrebbe soddisfare lo `USING` della nuova policy Consulenza (post in `CLIENT_DRAFT`) e poi il `WITH CHECK` della vecchia policy Gestione (scrivendo `status = 'APPROVED'`), **auto-approvandosi un post in Consulenza** — cosa che deve restare prerogativa esclusiva dell'SMM.
- [x] **Mitigazione**: la sola RLS non basta, serve un trigger `BEFORE UPDATE` (stesso pattern già in uso per `brands`/`profiles`) che, per ogni update fatto da un non-proprietario del brand (cliente), vincoli lo `status` scrivibile in base al `work_mode` della riga, indipendentemente da quale policy ha tecnicamente permesso l'update. Vedi Task 3.5.

### 3.5 Anti-tampering (trigger)
- [x] SQL scritto (vedi 3.5b sotto): funzione `prevent_client_post_tampering` + trigger `posts_lock_fields_for_client` — blocca il cliente da: cambiare `brand_id` o `work_mode` del post, e scrivere uno `status` fuori dall'insieme consentito per il `work_mode` corrente della riga (chiude il bypass di 3.4). Lo SMM proprietario del brand non ha restrizioni aggiuntive (già coperto da `posts_smm_full`).

### 3.6 — SQL da eseguire manualmente (Supabase SQL editor)
- [x] Eseguito dall'utente (2026-07-07) — confermato

```sql
-- 3.1 — il cliente può creare un post SOLO su un brand in Consulenza, sempre in stato iniziale CLIENT_DRAFT
CREATE POLICY posts_client_insert ON posts
FOR INSERT
TO authenticated
WITH CHECK (
  brand_id = get_my_brand_id()
  AND status = 'CLIENT_DRAFT'
  AND work_mode = 'CONSULTANCY'
  AND EXISTS (
    SELECT 1 FROM brands b
    WHERE b.id = posts.brand_id AND b.work_mode = 'CONSULTANCY'
  )
);

-- 3.2 — il cliente può modificare il proprio post finché resta in CLIENT_DRAFT o SMM_REVIEW
-- (policy distinta e aggiuntiva rispetto a posts_client_update, già esistente per la Gestione)
CREATE POLICY posts_client_update_consultancy ON posts
FOR UPDATE
TO authenticated
USING (
  brand_id = get_my_brand_id()
  AND work_mode = 'CONSULTANCY'
  AND status IN ('CLIENT_DRAFT', 'SMM_REVIEW')
)
WITH CHECK (
  brand_id = get_my_brand_id()
  AND work_mode = 'CONSULTANCY'
  AND status IN ('CLIENT_DRAFT', 'SMM_REVIEW')
);

-- 3.5 — chiude il bypass descritto in 3.4: un cliente non può mai auto-approvarsi un post,
-- né spostarlo su un altro brand, né cambiargli work_mode — indipendentemente da quale
-- policy RLS ha tecnicamente permesso l'update
CREATE OR REPLACE FUNCTION prevent_client_post_tampering()
RETURNS trigger AS $$
DECLARE
  is_owner boolean;
BEGIN
  SELECT (b.smm_id = auth.uid()) INTO is_owner
  FROM brands b WHERE b.id = OLD.brand_id;

  IF is_owner THEN
    RETURN NEW; -- lo SMM proprietario del brand non ha restrizioni aggiuntive qui
  END IF;

  IF NEW.brand_id IS DISTINCT FROM OLD.brand_id THEN
    RAISE EXCEPTION 'Non è consentito spostare il post su un altro brand';
  END IF;

  IF NEW.work_mode IS DISTINCT FROM OLD.work_mode THEN
    RAISE EXCEPTION 'Non è consentito modificare il work_mode del post';
  END IF;

  IF NEW.work_mode = 'CONSULTANCY' AND NEW.status NOT IN ('CLIENT_DRAFT', 'SMM_REVIEW') THEN
    RAISE EXCEPTION 'Solo lo SMM può approvare o cambiare stato a un post in Consulenza';
  END IF;

  IF NEW.work_mode = 'FULL_MANAGEMENT' AND NEW.status NOT IN ('APPROVED', 'CHANGES_REQUESTED') THEN
    RAISE EXCEPTION 'Il cliente può solo approvare o richiedere modifiche su un post in Gestione';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER posts_lock_fields_for_client
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION prevent_client_post_tampering();
```

**Nota su 3.6, ultimo blocco (`FULL_MANAGEMENT`)**: non introduce nessuna restrizione nuova rispetto ad oggi — la RLS `posts_client_update` già esistente richiede `status IN ('APPROVED','CHANGES_REQUESTED')` nel suo `WITH CHECK`, quindi qualunque update client su un post in Gestione che arriva fin qui ha già quello stato. È presente solo come difesa in profondità simmetrica, non cambia comportamento osservabile.

Senza queste policy/trigger: la creazione post lato cliente fallirà con errore RLS, e resta aperto il bypass di auto-approvazione descritto in 3.4 finché il trigger non è attivo — **va eseguito tutto insieme prima di testare**.

---

## Task 4 — Estensione `comments` per suggerimenti SMM ancorati a un campo

### 4.2 RLS — verificato con query reale su `pg_policies` (2026-07-07), nessuna modifica necessaria
- [x] `comments_smm_full` (ALL, `EXISTS post+brand WHERE brands.smm_id = auth.uid()`, **nessun filtro su status**) copre già l'inserimento di un suggerimento SMM su un post del cliente in `SMM_REVIEW` — nessuna policy nuova
- [x] `comments_client_read` (SELECT, esclude solo i literal `'PENDING'`/`'DRAFT'`) copre già la lettura dei suggerimenti da parte del cliente sui propri post Consulenza (`CLIENT_DRAFT`/`SMM_REVIEW`/`SMM_APPROVED` sono stringhe diverse da quelle escluse) — nessuna policy nuova
- [x] `comments_client_insert` richiede `status = 'REVISION_REQUESTED'` (valore esclusivo Gestione, mai presente su un post Consulenza) → il cliente non può e non potrà inserire commenti sui propri post Consulenza tramite questa policy — coerente con "i suggerimenti sono solo dell'SMM, il cliente non commenta"; nessuna azione richiesta

### 4.1 Modello dati
- [x] SQL scritto (vedi 4.1b sotto): colonna `comments.target_field` (nullable — `NULL` = commento generico esistente lato Gestione, valorizzato = suggerimento ancorato lato Consulenza)
- [x] Deciso: nessun vincolo DB su suggerimenti multipli sullo stesso campo — gestito in UI mostrando la cronologia per campo (Task 7.2)

### 4.1b — SQL da eseguire manualmente (Supabase SQL editor)

```sql
-- NULL = commento generico (comportamento Gestione invariato), valorizzato = suggerimento ancorato a un campo (Consulenza)
ALTER TABLE comments ADD COLUMN target_field text;

ALTER TABLE comments ADD CONSTRAINT comments_target_field_check
  CHECK (target_field IS NULL OR target_field IN ('title', 'caption', 'platform', 'media_link', 'scheduled_date'));
```

Nessuna migrazione dei dati esistenti necessaria: la colonna è nullable e i commenti già presenti restano `NULL` (commenti generici), comportamento identico a oggi.

- [x] Confermato eseguito (2026-07-07) — verificato con query su `information_schema.columns`/`pg_constraint`: colonna e CHECK constraint presenti con la definizione esatta prevista (`comments_target_field_check`, stessi 5 valori ammessi)

### 4.3 Backend
- [x] `comments.ts`: aggiunto tipo `CommentTargetField`, esteso `Comment`/`DbComment`/`toComment` con `targetField` (opzionale, `undefined` = commento generico), `addComment` accetta il parametro opzionale (`target_field: targetField ?? null` nell'insert)
- [x] `queries.ts`: `useAddComment` propaga `targetField` opzionale nella mutation; verificato che l'unico call site esistente (`CommentsThread.tsx`, `{ postId, body: text }`) resta compatibile essendo il campo opzionale
- [x] Verificato con `tsc --noEmit`: nessuna nuova regressione (11 errori pre-esistenti invariati)
- [ ] UI SMM (Task 6.4): quando si aggiunge un suggerimento, selezionare a quale campo del post si riferisce (titolo/caption/media/data)
- [ ] UI Cliente (Task 7.2): mostrare il suggerimento vicino al campo pertinente nella vista del post, non in un thread generico separato

---

## Task 5 — Backend (`src/lib/supabase`, `src/lib/queries.ts`)

### 5.1 `brands.ts`
- [x] Aggiunto `work_mode`/`workMode` a `DbBrand`/`Brand` ([mock-data.ts](../src/lib/mock-data.ts)), converter `DB_TO_FRONTEND_WORK_MODE`/`FRONTEND_TO_DB_WORK_MODE` locali a `brands.ts`, `toBrand` popola `workMode`
- [x] `createBrand`/`toDbInsert`: `workMode` escluso per ora dal DTO di creazione (nessuna UI di scelta modalità ancora, Task 6.3) — ogni nuovo cliente nasce `FULL_MANAGEMENT` come oggi, comportamento invariato
- [x] `updateBrand`: `workMode` esposto come campo aggiornabile in qualsiasi momento (`patch.work_mode` scritto se `dto.workMode !== undefined`) — nessuna azione manuale SQL richiesta, coperto da `brands_smm_full` già esistente (Task 1)

### 5.2 `posts.ts`
- [x] `createPost` ora fa una `SELECT work_mode` sul brand target prima dell'insert e lo passa a `postToDbInsert` — non più hardcodato `FULL_MANAGEMENT`. **Edge case noto e volutamente non gestito qui**: se uno SMM crea un post (via `CreatePostSheet`, percorso esistente) su un brand già in Consulenza, il post erediterebbe `work_mode = CONSULTANCY` ma `status = 'PENDING'` (valore Gestione) — combinazione anomala ma non pericolosa (nessun vincolo DB la vieta, la RLS `posts_smm_full` copre comunque lo SMM). Va chiuso lato UI in Task 6 impedendo la creazione SMM diretta su brand Consulenza, non lato backend.
- [x] Nuova funzione `createClientPost(dto: CreateClientPostDto)`: `brand_id` derivato dal profilo del chiamante (mai passato dal client, stesso pattern di `getClientPosts`), sempre `status: 'CLIENT_DRAFT'` / `work_mode: 'CONSULTANCY'` — la RLS `posts_client_insert` (Task 3) rifiuta comunque ogni combinazione non valida
- [x] Estratta utility `splitDateTime()` condivisa tra `postToDbInsert` e `createClientPost` (stessa logica di split data/ora, prima duplicata)
- [x] `updatePostStatus` ora legge prima il `work_mode` del post (query aggiuntiva) e sceglie tra due mapping distinti: `FRONTEND_STATUS_TO_DB_GESTIONE` (invariato) e la nuova `FRONTEND_STATUS_TO_DB_CONSULTANCY` (`pending`→`SMM_REVIEW`, `approved`→`SMM_APPROVED`, `draft`→`CLIENT_DRAFT`); lancia un errore esplicito se l'azione richiesta non esiste per quel work_mode, invece del fallback silenzioso `.toUpperCase()` di prima (che avrebbe scritto valori DB inventati/errati)

### 5.3 `queries.ts`
- [x] Nuovo hook `useCreateClientPost` (invalida `["client","posts"]` e `["client","stats"]` al successo)
- [x] **Non aggiunto** `useBrandsByWorkMode`: `useBrands` esistente restituisce già ogni brand con `workMode` popolato, un filtro `.filter(b => b.workMode === ...)` lato Task 6.2 è sufficiente — un hook dedicato sarebbe stata un'astrazione prematura per un filtro di 3 righe
- [x] Verificato con `tsc --noEmit`: nessuna nuova regressione (11 errori pre-esistenti invariati)

---

## Task 6 — UI lato SMM

### 6.1 Dashboard
- [x] `Activity` ([posts.ts](../src/lib/supabase/posts.ts)) esteso con `workMode`; `getRecentActivities()` esclude ora `CLIENT_DRAFT` (il cliente non ha ancora inviato, niente su cui lo SMM debba agire — evita rumore)
- [x] `toActivity()`: **bug corretto in passata** — il messaggio "Hai caricato/modificato" era sempre attribuito allo SMM anche quando l'azione più recente era del cliente (`actionByMe`, già calcolato ma non usato per il ramo `new_post`); ora attribuisce correttamente. Aggiunti i rami `SMM_APPROVED` (→ `approved`) e `SMM_REVIEW` (→ nuovo tipo `client_proposed`, "Il cliente ha proposto ... da rivedere")
- [x] `ActivityCard.tsx`: aggiunta icona/colore per il nuovo tipo `client_proposed` (altrimenti crash su un'attività Consulenza, `ICON_MAP[type]` sarebbe stato `undefined`)
- [x] [app/(smm)/index.tsx](../app/(smm)/index.tsx): `Attività recenti`/`Post recenti` ora filtrati con `.filter(x => x.workMode === smmMode)` — uso reale dello switch, non più solo cosmetico

### 6.2 Lista brand ([app/(smm)/brands/index.tsx](../app/(smm)/brands/index.tsx))
- [x] Lista filtrata con `brands.filter(b => b.workMode === smmMode)`; empty state con testo diverso per la tab Consulenza vuota

### 6.3 Creazione cliente (`CreateBrandSheet.tsx`)
- [x] Aggiunto selettore Gestione/Consulenza in cima al form, con hint testuale per modalità; default = tab dashboard attiva al momento dell'apertura (`smmMode` dello store)
- [x] `workMode` reintrodotto nel DTO di `createBrand`/`toDbInsert` (era escluso in Task 5.1 "fino a Task 6.3" — ora c'è la UI che lo fornisce)

### 6.4 Vista dettaglio post in Consulenza (`PostDetailSheet.tsx`)
- [x] Branch completo su `post.workMode`: se non ancora inviato (`CLIENT_DRAFT`) mostra un box informativo invece delle azioni; se in revisione (`SMM_REVIEW`) mostra "Modifica post" (riuso `EditPostSheet` esistente, invariato), il thread suggerimenti, e "Approva"; se già approvato, sola lettura come in Gestione
- [x] `CommentsThread.tsx` esteso con prop `suggestionMode`: mostra un selettore di campo (Titolo/Caption/Tipo/Media/Data) sopra l'input e un tag colorato sul suggerimento se ancorato a un campo — **corretto anche un bug pre-esistente** (`styles.theirBubble` non esisteva, causava errore TS; ora usa correttamente `styles.bubble` per i messaggi altrui)
- [x] "Approva" chiama `updateStatus({status:'approved'})`, che grazie alla Task 5.2 risolve correttamente a `SMM_APPROVED` (non `APPROVED`) perché work_mode-aware

### 6.5 Indicatori
- [x] `PostCard.tsx`: chip "Proposto dal cliente · da rivedere" quando `workMode === 'consulenza' && visualStatus === 'pending'` (SMM_REVIEW) — compare sia nella lista post del brand sia nella dashboard "Post recenti"
- [x] Attività "Il cliente ha proposto ... da rivedere" già coperta da 6.1 (nuovo tipo `client_proposed`)

### 6.6 Cambio modalità su cliente esistente ([app/(smm)/brands/[brandId].tsx](../app/(smm)/brands/[brandId].tsx))
- [x] Chip modalità nell'header del dettaglio brand (icona `Repeat` + label), tap → conferma (`Alert.alert` su nativo, `window.confirm` su web) con messaggio esplicito: "i post già esistenti restano invariati: la nuova modalità vale solo per i post futuri" → `useUpdateBrand({workMode})`
- [x] Il brand si sposta automaticamente nella tab/lista corretta al refetch (già coperto da 6.2, nessun codice aggiuntivo necessario: il filtro è sempre dal vivo su `brands` invalidato da `useUpdateBrand`)
- [x] **Chiuso l'edge case aperto in Task 5.2**: il FAB "Nuovo post" e il tap su un giorno del calendario (`ContentGrid.onDayPress`) sono ora disabilitati per i brand in Consulenza (mostra un Toast informativo "In Consulenza è il cliente a creare i post" invece di aprire `CreatePostSheet`) — impedisce che uno SMM crei per errore un post con combinazione status/work_mode incoerente
- [x] Verificato con `tsc --noEmit`: 10 errori (uno in meno di prima, grazie al fix del bug in `CommentsThread.tsx`), nessuna nuova regressione

---

## Task 7 — UI lato Cliente

### 7.1 Creazione post
- [x] Nuovo componente `CreateClientPostSheet.tsx` (adattamento di `CreatePostSheet`): tipo/titolo/caption/data/media, **senza** "Note interne" (campo privato SMM) e senza scelta di brand (derivato server-side da `createClientPost`, Task 5.2)
- [x] [app/(client)/index.tsx](../app/(client)/index.tsx): FAB "Crea post" visibile solo se `brand?.workMode === 'consulenza'` (letto con `useBrand(activeBrandId)`, nuovo utilizzo dell'hook esistente)
- [x] Aggiunta tab **"Bozze"** ai filtri cliente (`CONSULENZA_FILTERS`, solo se Consulenza) — senza questa i post `CLIENT_DRAFT` non sarebbero mai raggiungibili dal cliente stesso, dato che i filtri esistenti erano solo `pending`/`approved`
- [x] Tab "In revisione" invece di "Da approvare" per la modalità Consulenza (in Consulenza approva l'SMM, non il cliente — l'etichetta Gestione sarebbe stata fuorviante)

### 7.2 Vista post (`ClientPostDetailSheet.tsx`)
- [x] Branch completo su `post.workMode`: bozza non ancora inviata → box informativo + "Modifica"/"Invia all'SMM"; in revisione (`SMM_REVIEW`) → suggerimenti + "Modifica" (il cliente può ancora editare, Task 3.2), **nessun bottone Approva/Richiedi modifica** (prerogativa SMM in Consulenza); approvato → sola lettura, come Gestione
- [x] Suggerimenti SMM mostrati **vicino al campo pertinente** (titolo/caption/media/tipo/data), non in un thread — nuovo componente inline `FieldSuggestions`, che filtra `useComments(postId)` per `targetField`; eventuali suggerimenti non ancorati restano in un blocco "generico" a parte
- [x] Nuovo componente `EditClientPostSheet.tsx` (non riuso diretto di `EditPostSheet`): quest'ultimo espone "Note interne" pre-compilato con `post.internalNotes` (il testo privato dello SMM) — riusarlo avrebbe **mostrato e reso modificabile dal cliente un campo privato dello SMM**, quindi ho creato una versione dedicata senza quel campo
- [x] **Fix necessario non previsto nel piano originale**: `updatePost()` ([posts.ts](../src/lib/supabase/posts.ts)) non impostava mai `last_updated_by` (lo faceva solo `updatePostStatus`) — senza questo, non c'era alcun modo di sapere se l'ultima modifica al *contenuto* fosse dell'SMM o del cliente. Aggiunto `last_updated_by` anche qui, più il campo `lastUpdatedBy` sul tipo `Post` (mai esposto prima), per poter mostrare la nota "Il tuo SMM ha modificato questo post" richiesta da Q2

### 7.3 Dashboard/statistiche cliente
- [x] **Verificato e corretto** (non restavano valide): `getClientStats`, `getClientKPIs`, `getClientComparison` contavano solo gli status Gestione (`REVISION_REQUESTED`, `APPROVED`/`PUBLISHED`) — per un cliente Consulenza le card avrebbero mostrato **sempre zero** indipendentemente dall'attività reale. Aggiunto `SMM_REVIEW` al conteggio "pending" e `SMM_APPROVED` al conteggio "approved" in tutte e tre le funzioni
- [x] `changesRequested`/`feedbackRate` lasciati invariati: nessun equivalente Consulenza (Task 2.1, l'SMM non rimanda mai il post al cliente) — per un cliente Consulenza questi indicatori restano semplicemente sempre a 0, non è un bug ma l'assenza di quel concetto in questo flusso

### Verifica
- [x] `tsc --noEmit`: 12 errori totali — i 10 pre-esistenti invariati, i 2 nuovi sono lo stesso mismatch di tipo pre-esistente `RefObject<BottomSheetModal | null>` vs `RefObject<BottomSheetModal>` (già presente su ogni altro componente Sheet del progetto prima di questo lavoro), replicato sui due nuovi ref (`createSheetRef` in `app/(client)/index.tsx`, `editSheetRef` in `ClientPostDetailSheet.tsx`) seguendo la stessa convenzione già in uso ovunque — non un nuovo tipo di problema, e la causa radice (nel tipo dei prop `sheetRef` di ogni componente Sheet) è pre-esistente e fuori scope per questo piano

---

## Task 8 — Migrazioni SQL da eseguire manualmente

- [x] Fatto man mano — SQL di Task 1.1b, 2.2b, 3.6, 4.1b eseguite dall'utente nel SQL editor di Supabase durante le rispettive task (non serviva una raccolta finale separata)

---

## Task 9 — Aggiornamento memoria di progetto

- [x] Aggiornato `project_db_schema.md`: `brands.work_mode`, nuovi valori stato post, policy RLS su `posts` (incluso il bypass OR-permissive scoperto e il trigger che lo chiude) e su `comments` (verificate via query reale, zero nuove policy necessarie)
- [x] Registrate in `project_consulenza_flow.md` tutte le decisioni Q1–Q4 e lo stato finale di implementazione

---

## Task 10 — Verifica

- [ ] Test manuale: SMM crea cliente in Consulenza, cliente crea un post, appare nella lista SMM filtrata su Consulenza
- [ ] Test manuale: SMM aggiunge un suggerimento, cliente lo vede
- [ ] Test manuale: SMM modifica direttamente il post e approva, cliente vede il risultato
- [ ] Verifica RLS: un cliente non può creare post su un brand in Gestione, né su un brand che non è il proprio
- [ ] Verifica RLS: un cliente non può auto-approvarsi un post in Consulenza
- [ ] Verifica che lo switch dashboard filtri correttamente e che un brand in Gestione non compaia mai sotto Consulenza e viceversa
- [ ] Verifica su viewport mobile (emulazione iPhone 390×844, come da setup abituale)

**Nota:** Task 10 lasciata volutamente all'utente — verifica manuale in app, non eseguibile da qui in autonomia.

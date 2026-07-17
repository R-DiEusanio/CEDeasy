# Piano — Fix tecnici e debito accumulato

Nessuna funzionalità nuova in questo piano: solo i fix identificati durante una revisione dello stato del progetto (2026-07-08). Ordine dei task = priorità consigliata (sicurezza prima, poi verifiche pendenti, poi debito TS/dati). Nessuna implementazione ancora avviata.

---

## Task 1 — RLS `posts`: rimuovere la policy troppo permissiva

La policy `Enable read access for all users` (SELECT, `qual: true`) su `posts` bypassa `posts_client_read`/`posts_smm_full` e lascia leggere **tutte** le righe a chiunque sia autenticato — incluse bozze private di altri brand. Le policy legittime esistono già, quindi la rimozione non dovrebbe togliere accesso a nessun caso d'uso reale.

### 1.1 Conferma che `posts_client_read` + `posts_smm_full` coprano tutti i casi SELECT legittimi
- [x] Verificato via grep/lettura codice (nessun accesso diretto al DB disponibile in questo progetto — niente service key/MCP Supabase, solo anon key in `.env`): `getPosts`/`getClientPosts`/`getClientStats`/`getClientKPIs`/`getClientComparison` filtrano già esplicitamente per `brand_id`. `getRecentPosts`/`getRecentActivities` non filtrano `brand_id` nella query e si affidano alla RLS, ma sono usate solo lato SMM ([app/(smm)/index.tsx:38](app/(smm)/index.tsx#L38)) — coperte da `posts_smm_full`. Nessun codice dipende dalla policy permissiva.

### 1.2 Drop della policy
- [x] Eseguito dall'utente (2026-07-08)
- [ ] SQL da eseguire manualmente (Supabase SQL editor):

```sql
DROP POLICY "Enable read access for all users" ON posts;
```

### Verifica
- [x] Cliente: vede ancora il calendario/post del proprio brand come prima
- [x] SMM: vede ancora tutti i post dei propri brand come prima
- [x] Cliente: isolamento confermato dall'utente (2026-07-08)

---

## Task 2 — Chiudere le verifiche manuali pendenti (nessun codice nuovo)

Due piani precedenti hanno codice e migrazioni già applicati ma la task di verifica finale non è mai stata spuntata. Prima di costruire altro sopra, vale la pena chiuderle.

### 2.1 Task 4 di [2026-07-08-piano-client-consulenza-parita-smm.md](2026-07-08-piano-client-consulenza-parita-smm.md)
- [x] Verificata manualmente dall'utente (2026-07-08) — nessuna regressione, checklist spuntata in quel file

### 2.2 Task 5 di [2026-07-03-piano-sezione-profili.md](2026-07-03-piano-sezione-profili.md)
- [x] Verificata manualmente dall'utente (2026-07-08) — nessuna regressione, checklist spuntata in quel file

---

## Task 3 — Fix errori TypeScript pre-esistenti (10 errori, `tsc --noEmit`)

### 3.1 `RefObject<BottomSheetModal | null>` non assegnabile a `RefObject<BottomSheetModal>` (7 occorrenze)
- [x] Causa reale (diversa dall'ipotesi iniziale): `BottomSheetModal` **non** è la libreria `@gorhom/bottom-sheet` ma un'interfaccia locale definita in [components/ui/BottomSheet.tsx:19](components/ui/BottomSheet.tsx#L19) (`{ present, dismiss }`). 7 componenti dichiaravano il prop `sheetRef` come `React.RefObject<BottomSheetModal>` (non nullable), mentre `useRef<BottomSheetModal>(null)` produce sempre `RefObject<BottomSheetModal | null>` in React 19 — mismatch strutturale, non un problema di tipi di libreria
- [x] Corretto in tutti e 7 i file (`sheetRef: React.RefObject<BottomSheetModal | null>`): [components/ClientPostDetailSheet.tsx](components/ClientPostDetailSheet.tsx), [components/CreatePostSheet.tsx](components/CreatePostSheet.tsx), [components/CreateBrandSheet.tsx](components/CreateBrandSheet.tsx), [components/EditPostSheet.tsx](components/EditPostSheet.tsx), [components/HistorySheet.tsx](components/HistorySheet.tsx), [components/PostDetailSheet.tsx](components/PostDetailSheet.tsx), [components/ReportSheet.tsx](components/ReportSheet.tsx)

### 3.2 `components/ui/Input.tsx` — `outlineStyle` non tipizzato (righe 31 e 48)
- [x] Rimosso il `@ts-ignore` inefficace, sostituito con cast `as unknown as TextStyle` sull'oggetto `input` in [components/ui/Input.tsx](components/ui/Input.tsx) (il cast diretto `as TextStyle` non bastava: TS segnalava overlap insufficiente per `outlineStyle`, serviva il doppio cast passando per `unknown`)

### 3.3 `last_updated_by` mancante in `postToDbInsert`
- [x] [src/lib/supabase/posts.ts](src/lib/supabase/posts.ts): `postToDbInsert()` ora accetta un parametro `createdBy: string | null` e lo scrive in `last_updated_by`; `createPost()` recupera l'utente corrente via `supabase.auth.getUser()` e lo passa (unica chiamante della funzione — non usata da `createClientPost`, che già impostava i campi a mano)

### Verifica
- [x] `npx tsc --noEmit` → 0 errori
- [ ] Nessuna regressione visiva sui form che usano `Input` (login, registrazione, edit profilo/brand) — da verificare manualmente in app

---

## Task 4 — Riparare i profili creati prima della fix di `register.tsx`

Prima della fix del 2026-07-08 (vedi [[project_db_schema]]), ogni registrazione — client o SMM — creava un profilo con `role='CLIENT'` e `brand_id=NULL` a causa del trigger `handle_new_user`. Questi profili non vengono corretti retroattivamente da `upsertProfile()`.

### 4.1 Individuare i profili sospetti
- [ ] SQL diagnostico (Supabase SQL editor, sola lettura):

```sql
SELECT id, full_name, role, brand_id, created_at
FROM profiles
WHERE created_at < '2026-07-08'
ORDER BY created_at;
```
- [ ] Per ciascuna riga, confrontare con l'account atteso (SMM che sa di essersi registrato come SMM, cliente che sa a quale brand appartiene) — non è automatizzabile perché `role`/`brand_id` corretti non sono derivabili dai dati esistenti

### 4.2 Correggere manualmente le righe confermate
- [ ] Per ogni profilo confermato come sbagliato: `UPDATE profiles SET role = '...', brand_id = '...' WHERE id = '...';` (uno per uno, non in blocco — righe diverse hanno correzioni diverse)

### Verifica
- [ ] Gli account corretti vedono ora la dashboard/i dati giusti per il loro ruolo effettivo

---

## Task 5 — Cleanup RLS ridondante su `brands`

Le policy `SMM can manage their own brands` e `brands_smm_full` sono entrambe `ALL USING (smm_id = auth.uid())` — stessa condizione, due nomi diversi. Basso rischio ma rischiano di andare out-of-sync se una viene modificata e l'altra no.

### 5.1 Consolidare in un'unica policy
- [ ] Confermare che nessun altro punto del codice/migrazioni faccia riferimento al nome specifico di una delle due (es. in commenti di migrazioni precedenti) prima di rimuoverne una
- [ ] SQL da eseguire manualmente:

```sql
DROP POLICY "SMM can manage their own brands" ON brands;
-- brands_smm_full resta, stessa condizione
```

### Verifica
- [ ] SMM: nessuna regressione su creazione/modifica/eliminazione brand

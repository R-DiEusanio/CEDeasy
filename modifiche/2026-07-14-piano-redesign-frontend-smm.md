# Piano — Redesign frontend lato SMM (da 22 foto di riferimento)

## Contesto

L'utente ha fornito 22 foto/mockup che mostrano il design target esatto per il lato SMM dell'app (tema cream/pillole, navigazione a 5 tab, kanban a stati, scheda cliente con strategia, sistema di inviti, anteprima IG/FB, onboarding a 4 slide). Un piano scritto precedente basato solo su un brief testuale (`piano-redesign-ui.md`) è stato cancellato dall'utente e **non va usato come riferimento** — questo piano riparte da zero, confrontando le foto pixel per pixel con lo stato attuale del codice (esplorato in questa stessa sessione).

Decisioni vincolanti prese con l'utente prima di scrivere questo piano (non ridiscutere):
1. **Font**: Fredoka (titoli/UI) + Luckiest Guy (accenti pop puntuali), sostituti gratuiti dei font a pagamento del brief originale (Balgin/DK Lemon Yellow Sun).
2. **Stato post unificato a 8 valori**: sostituisce sia il semaforo di approvazione attuale (draft/pending/changes_requested/approved) sia la colonna dormiente `posts.planning_status` (mai usata nel frontend). Nuovo enum: `da_fare`, `bozza_privata`, `da_revisionare`, `da_modificare`, `approvato`, `programmato`, `pubblicato`, `rimandato`.
3. **Nuovo campo `posts.channel`**: `'instagram'|'facebook'`, separato dal campo esistente `platform` (che resta il formato: Post/Reel/Storia — "Carosello" sparisce dalle opzioni UI ma i valori storici in DB non vengono toccati).
4. **Vincolo di progetto invariato**: mai dati mockati — ogni nuova feature usa query reali contro Supabase, anche a costo di liste vuote finché l'utente non crea clienti/post veri.

Ordine dei task = fondamenta (font/tema/stato unificato) → navigazione → schermate principali → feature nuove (strategia/inviti) → rifiniture (anteprima, onboarding). Nessuna implementazione ancora avviata.

---

## Task 0 — Font: Fredoka + Luckiest Guy

### 0.1 Installazione
- [ ] `npx expo install @expo-google-fonts/fredoka @expo-google-fonts/luckiest-guy expo-font`
- [ ] [app/_layout.tsx](app/_layout.tsx): caricare i font con `useFonts()` prima di `SplashScreen.hideAsync()` (blocco del render finché non sono pronti)

### 0.2 Nuovi token in `constants/typography.ts`
- [ ] `displayHeading` (Fredoka 700) per h1/h2/titoli di schermata (Dashboard, Calendario, Griglia, Clienti, Report, titoli sheet)
- [ ] `displayAccent` (Luckiest Guy) solo per accenti puntuali: numeri grandi nelle card statistiche, badge "Pubblicato! 🎉" — mai su body text o testo denso
- [ ] `body/small/caption/label` restano invariati (system font)

### Verifica
- [ ] App si apre senza flash di font non caricato, titoli principali usano Fredoka

---

## Task 1 — Tema colori e forme (cream/beige, pillole ovunque)

### 1.1 `constants/colors.ts`
- [ ] Sostituire `background: '#ffffff'` con un tono cream/beige (rif. foto: sfondo crema uniforme, card bianche sopra con ombra morbida e colorata, es. `0 2px 8px rgba(50,25,60,.06)` per le card, ombre più marcate/colorate sui bottoni primari es. `0 8px 18px rgba(255,77,141,.3)`)
- [ ] Valutare se il viola primario attuale (`#7c3aed`) resta come accent secondario (usato nelle foto per "Programmato"/pillole cliente non-selezionate) mentre il **rosa/magenta** (rif. foto: pillole attive, CTA principali, logo "CEDeasy") diventa il nuovo primary — le foto non danno hex esatti, scegliere un rosa/magenta vivo coerente con badge "Bozza privata" e validare a video con l'utente
- [ ] Nessun bordo grigio dedicato: dove serve un bordo, 2-3px colorato coerente con lo stato/contesto (non `#e2e8f0` neutro)

### 1.2 `constants/spacing.ts`
- [ ] Alzare `radius.md`/`radius.lg` verso il generoso mostrato nelle foto (14-22px su card), `radius.full` (pillola) resta 9999 ma va applicato a molti più elementi che oggi usano `radius.md` (Button, Input, chip/pill dei filtri)

### 1.3 Componenti base da aggiornare per la nuova forma pillola
- [ ] `components/ui/Button.tsx`: radius pieno (pillola) invece di `radius.md`, ombra colorata sulla variante primary
- [ ] `components/ui/Input.tsx` / `Textarea`: bordo arrotondato più generoso, bordo evidenziato colorato (non grigio) in stato focus — rif. foto "Testo del post" con bordo rosa acceso da focus
- [ ] `components/ui/Card.tsx`: sfondo bianco su pagina cream, ombra morbida colorata invece di `shadowOpacity 0.06` grigia
- [ ] `components/ui/Sheet` (bottom sheet custom): già slide-dal-basso con grabber — coerente con le foto, aggiungere solo animazione "bouncy" (`cubic-bezier` overshoot) se non già presente

### Verifica
- [ ] Le schermate esistenti (senza ancora nessuna feature nuova) hanno già look cream/pillola coerente con le foto, prima di aggiungere le feature vere e proprie

---

## Task 2 — Migrazione stato post unificato a 8 valori (DB + RLS + backend + frontend)

Il cambiamento più rischioso del piano: tocca dati esistenti, RLS, trigger, e tutta la logica Gestione/Consulenza. Farlo con calma, a mente fresca, testando bene prima di procedere ai task successivi che ne dipendono (kanban, sposta-stato, badge ovunque).

### 2.1 Migrazione DB (manuale, Supabase SQL Editor)
- [ ] Aggiungere una colonna temporanea o rimappare direttamente `posts.status` ai nuovi 8 valori. Mapping proposto dai 9 valori attuali:
  - `PENDING`, `DRAFT`, `CLIENT_DRAFT` → `bozza_privata`
  - `REVISION_REQUESTED`, `SMM_REVIEW` → `da_revisionare`
  - `CHANGES_REQUESTED` → `da_modificare`
  - `APPROVED`, `SMM_APPROVED` → `approvato`
  - `PUBLISHED` → `pubblicato`
  - (nessun valore storico mappa su `da_fare`/`programmato`/`rimandato` — sono stati nuovi, raggiungibili solo da azioni future)
- [ ] Drop del vecchio `posts_status_check`, nuovo CHECK con `da_fare|bozza_privata|da_revisionare|da_modificare|approvato|programmato|pubblicato|rimandato`
- [ ] Rivedere `posts_client_read`/`posts_client_update`/`posts_client_update_consultancy` (oggi filtrano su valori come `'REVISION_REQUESTED'`/`'CLIENT_DRAFT'`) per usare i nuovi valori — principio da conservare: il cliente non si auto-approva/pubblica/programma mai da solo; in Gestione può solo portare un post da `da_revisionare` a `approvato` o `da_modificare`; in Consulenza può creare/modificare finché `bozza_privata`/`da_revisionare`, poi solo lo SMM decide
- [ ] Aggiornare il trigger `posts_lock_fields_for_client` (`prevent_client_post_tampering`) con la nuova lista di stati scrivibili dal cliente per `work_mode`
- [ ] `posts.planning_status`: rimuovere la colonna (non più necessaria, sostituita dal nuovo `status`) — `DROP COLUMN planning_status`

**SQL pronto da eseguire manualmente in Supabase SQL Editor** — verificato contro le policy/trigger REALI del DB (letti via `pg_policies`/`pg_get_functiondef` il 2026-07-14), non una ricostruzione: ogni stringa di stato è tradotta 1:1, la logica resta identica. Nota anche una policy scoperta in questa verifica non documentata prima, `posts_client_delete` (il cliente in Consulenza elimina i propri post senza vincoli di stato) — non referenzia `status`, quindi non richiede modifiche.

```sql
-- 0. Disabilita temporaneamente il trigger anti-tampering per la durata della
-- migrazione: in SQL Editor auth.uid() è NULL (nessun utente autenticato in
-- quel contesto), quindi il trigger tratterebbe questi UPDATE come se fossero
-- di un cliente non autorizzato e li bloccherebbe.
alter table public.posts disable trigger posts_lock_fields_for_client;

-- 1. Migra i valori esistenti di posts.status al nuovo enum unificato a 8 stati
alter table public.posts drop constraint if exists posts_status_check;

update public.posts set status = 'bozza_privata' where status in ('PENDING', 'DRAFT', 'CLIENT_DRAFT');
update public.posts set status = 'da_revisionare' where status in ('REVISION_REQUESTED', 'SMM_REVIEW');
update public.posts set status = 'da_modificare' where status = 'CHANGES_REQUESTED';
update public.posts set status = 'approvato' where status in ('APPROVED', 'SMM_APPROVED');
update public.posts set status = 'pubblicato' where status = 'PUBLISHED';

alter table public.posts add constraint posts_status_check
  check (status in ('da_fare','bozza_privata','da_revisionare','da_modificare','approvato','programmato','pubblicato','rimandato'));

alter table public.posts alter column status set default 'bozza_privata';

-- 2. planning_status non serve più (assorbito nel nuovo status)
alter table public.posts drop column if exists planning_status;

-- 3. RLS: il cliente legge solo gli stati "condivisi" (mai bozza privata SMM, mai richiesta di modifica in corso)
drop policy if exists "posts_client_read" on public.posts;
create policy "posts_client_read" on public.posts
  for select
  using (
    brand_id = get_my_brand_id()
    and status not in ('da_fare', 'bozza_privata', 'da_modificare')
  );

-- 4. RLS: Gestione — il cliente approva o chiede modifiche solo mentre è "da_revisionare"
drop policy if exists "posts_client_update" on public.posts;
create policy "posts_client_update" on public.posts
  for update
  using (brand_id = get_my_brand_id() and status = 'da_revisionare')
  with check (brand_id = get_my_brand_id() and status in ('approvato', 'da_modificare'));

-- 5. RLS: Consulenza — il cliente crea sempre come bozza privata
drop policy if exists "posts_client_insert" on public.posts;
create policy "posts_client_insert" on public.posts
  for insert
  with check (
    brand_id = get_my_brand_id()
    and status = 'bozza_privata'
    and work_mode = 'CONSULTANCY'
    and exists (select 1 from brands b where b.id = posts.brand_id and b.work_mode = 'CONSULTANCY')
  );

-- 6. RLS: Consulenza — il cliente modifica/invia finché non è in revisione, e continua a
-- modificare il contenuto anche dopo l'approvazione SMM (parità di poteri, il trigger
-- sotto impedisce comunque che tocchi lo status una volta approvato)
drop policy if exists "posts_client_update_consultancy" on public.posts;
create policy "posts_client_update_consultancy" on public.posts
  for update
  using (brand_id = get_my_brand_id() and work_mode = 'CONSULTANCY' and status in ('bozza_privata', 'da_revisionare', 'approvato'))
  with check (brand_id = get_my_brand_id() and work_mode = 'CONSULTANCY' and status in ('bozza_privata', 'da_revisionare', 'approvato'));

-- 7. Trigger anti-tampering — traduzione 1:1 del trigger reale esistente (letto da
-- pg_get_functiondef il 2026-07-14), stessa identica logica, solo stringhe di stato
-- rinominate. La RLS sopra fa OR tra USING/WITH CHECK di TUTTE le policy (non a coppie
-- dentro la stessa policy) — questo trigger è ciò che davvero impedisce che il cliente
-- combini la USING di una policy con la WITH CHECK di un'altra per auto-approvarsi.
CREATE OR REPLACE FUNCTION public.prevent_client_post_tampering()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    IF OLD.status = 'approvato' THEN
      IF NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'Il cliente non può cambiare lo stato di un post già approvato dall''SMM';
      END IF;
    ELSIF NEW.status NOT IN ('bozza_privata', 'da_revisionare') THEN
      RAISE EXCEPTION 'Solo lo SMM può approvare un post in Consulenza';
    END IF;
  END IF;

  IF NEW.work_mode = 'FULL_MANAGEMENT' AND NEW.status NOT IN ('approvato', 'da_modificare') THEN
    RAISE EXCEPTION 'Il cliente può solo approvare o richiedere modifiche su un post in Gestione';
  END IF;

  RETURN NEW;
END;
$function$;

-- Il trigger posts_lock_fields_for_client è già agganciato a questa funzione
-- (CREATE OR REPLACE la aggiorna in place, non serve ricreare il trigger).

-- 8. Riabilita il trigger, ora con la funzione aggiornata
alter table public.posts enable trigger posts_lock_fields_for_client;
```

### 2.2 Backend — `src/lib/supabase/posts.ts` ✅ implementato
- [x] Rimossi `FRONTEND_STATUS_TO_DB_GESTIONE`/`_CONSULTANCY` e il mapping DB→frontend: DB e frontend usano ora la stessa stringa (`PostStatus`, 8 valori), nessuna traduzione — `hasChangesRequested` rimosso da `Post`, assorbito in `da_modificare`
- [x] `updatePostStatus(id, status)` semplificato a una scrittura diretta dello status (RLS/trigger fanno da guardia sui permessi)
- [x] `getClientStats`/`getClientKPIs`/`getClientComparison`/`getRecentActivities` aggiornati sul nuovo enum (bucket `APPROVED_LIKE = ['approvato','programmato','pubblicato']`)

### 2.3 Frontend — `src/lib/status-config.ts` e tipi ✅ implementato
- [x] Riscritto `VisualStatus`/`STATUS_CONFIG` con 8 voci (alias `VisualStatus = PostStatus`, nessuna collassatura), colori dalle foto: `da_fare` grigio, `bozza_privata` rosso/rosa, `da_revisionare` giallo/ambra, `da_modificare` arancione, `approvato` verde chiaro, `programmato` blu, `pubblicato` verde scuro, `rimandato` viola
- [x] `src/lib/mock-data.ts`: `PostStatus` è il nuovo enum a 8 valori, `hasChangesRequested` rimosso da `Post`
- [x] Aggiornati tutti gli usi di `getVisualStatus`/`hasChangesRequested` in `components/` (`PostCard`, `PostDetailSheet`, `ClientPostDetailSheet`, `ContentGrid`, `CreatePostSheet`, `HistorySheet`, `ReportSheet`) e in `app/(client)/index.tsx` — verificato con ricerca testuale su tutto il repo, zero residui
- [x] `colors.status` in `constants/colors.ts` lasciato invariato: è una palette generica a 4 toni riusata altrove (KPI qualità, box suggerimenti/feedback, icone attività) non legata 1:1 al nuovo enum a 8 stati — nessuna di quelle usate necessitava modifica

### Verifica
- [ ] Post esistenti (pre-migrazione) mostrano uno stato sensato dopo il mapping, nessun post "orfano" con status non valido — **richiede di eseguire prima l'SQL sopra**
- [ ] Cliente Gestione: può ancora approvare/richiedere modifiche solo quando il post è nello stato corretto, non può auto-approvarsi
- [ ] Cliente Consulenza: può creare/modificare finché non in revisione, non può auto-approvarsi/pubblicarsi
- [x] `npx tsc --noEmit` pulito dopo il refactor dei tipi (verificato)

---

## Task 3 — Nuovo campo `posts.channel` (Instagram/Facebook) ✅ implementato (manca solo l'SQL da eseguire)

### 3.1 Migrazione DB — SQL pronto da eseguire manualmente in Supabase SQL Editor
- [ ] Da eseguire (nessun trigger da disabilitare qui: è un `ADD COLUMN`, non un `UPDATE` su righe esistenti che passano da un trigger BEFORE UPDATE):

```sql
alter table public.posts
  add column channel text not null default 'instagram'
  check (channel in ('instagram', 'facebook'));
```

Nota: default `'instagram'` per tutti i post esistenti (nessun dato storico distingueva già un canale) — se preferisci un default diverso o vuoi impostare `channel` manualmente per i post già pubblicati, fammelo sapere prima di eseguire.

### 3.2 Backend/tipi ✅ implementato
- [x] `src/lib/supabase/posts.ts`: `channel` aggiunto a `DbPost`/`toPost()`/`postToDbInsert()`/`createClientPost()`/`updatePost()` (patch)
- [x] `src/lib/mock-data.ts`: nuovo tipo `Channel = "instagram"|"facebook"`, campo `channel: Channel` su `Post`
- [x] `platform`/`type` resta il formato: opzioni UI ridotte a `Post|Reel|Story` in `CreatePostSheet`/`EditPostSheet` — i post storici con `Carosello` non vengono toccati, e `EditPostSheet` lo riaggiunge dinamicamente come opzione extra solo se il post in modifica lo usa già (`typeOptions`), così non sparisce dal form se lo stai modificando

### 3.3 UI ✅ implementato
- [x] `components/CreatePostSheet.tsx`/`EditPostSheet.tsx`: due righe di pillole affiancate "Canale" (Instagram/Facebook) e "Formato" (Post/Reel/Story)

### Verifica
- [ ] Eseguire l'SQL sopra, poi creare un post, scegliere canale+formato, verificare che entrambi persistano e si vedano correttamente in lista/dettaglio
- [x] `npx tsc --noEmit` pulito dopo l'aggiunta del campo

---

## Task 4 — Navigazione: header globale + selettore cliente + 5 tab ✅ implementato

Sostituisce l'attuale `app/(smm)/_layout.tsx` (3 tab: Feed/Clienti/Profilo).

### 4.1 Header globale ✅ implementato
- [x] Nuovo componente `components/SmmHeader.tsx`: logo "CEDeasy" (Fredoka), toggle a due pillole "Gestione"/"Consulenza" (riusa `smmMode`/`setSmmMode` di `src/lib/app-store.tsx`), pulsante "Novità" (pillola con pallino se ci sono attività, apre un bottom sheet con `getRecentActivities()` + `ActivityCard`, nessuna nuova query), icona profilo che apre `/(smm)/profile` (vedi 4.3)
- [x] Sotto l'header: riga orizzontale scrollabile di pillole cliente (pallino colorato + nome, pillola "Tutti" come prima opzione, pillola tratteggiata "+ Nuovo" che apre `CreateBrandSheet`) — riusa `useBrands()`, filtrata per `smmMode` (stesso principio già in uso in `brands/index.tsx`)
- [x] Nuovo stato condiviso `selectedBrandId`/`setSelectedBrandId` in `src/lib/app-store.tsx` (persiste il cliente selezionato tra le 5 tab; si resetta a "Tutti" quando cambi modalità Gestione/Consulenza, dato che il cliente selezionato potrebbe non esistere nell'altra modalità)

### 4.2 Bottom tab bar a 5 voci ✅ implementato
- [x] `app/(smm)/_layout.tsx` riscritto: tab `Dashboard` (`index.tsx`), `Calendario` (nuovo `calendario.tsx`), `Griglia` (nuovo `griglia.tsx`), `Clienti` (`brands/`), `Report` (nuovo `report.tsx`) — icone lucide, tab attiva in rosa/magenta
- [x] `Calendario`/`Griglia`/`Report`: creati come placeholder con `SmmHeader` + `EmptyState` ("in arrivo") — contenuto reale nei Task 6/7 rispettivamente; `Report` non ha un task numerato dedicato nel piano (richiede prima query SMM-side parametrizzate per brandId, dato che `getClientStats`/`getClientKPIs` oggi risolvono sempre il brand dell'utente loggato) — **da pianificare quando si arriva a quella tab**
- [x] `app/(smm)/index.tsx` (Dashboard): rimosso lo switch Gestione/Consulenza locale (ora nell'header globale), aggiunto `SmmHeader`; contenuto (Attività recenti/Post recenti) invariato, sarà sostituito dal kanban nel Task 5
- [x] `app/(smm)/brands/index.tsx` (Clienti): aggiunto `SmmHeader`, rimosso il padding-top locale ora gestito dall'header

### 4.3 Tab "Profilo" — risolto (conferma utente)
Icona profilo nell'header globale (non più una tab): `Tabs.Screen name="profile" options={{ href: null }}` la nasconde dalla tab bar senza rimuovere la rotta, `SmmHeader` ci naviga con `router.push('/(smm)/profile')`.

### Verifica
- [ ] Cambiare cliente/modalità nell'header aggiorna coerentemente tutte e 5 le tab senza reset imprevisti
- [ ] Nessuna regressione di navigazione (deep link, back button, stato ripristinato al cambio tab)
- [x] `npx tsc --noEmit` pulito

---

## Task 5 — Dashboard tab: vista kanban ✅ implementato (parziale, vedi 5.2)

### 5.1 Layout ✅ implementato
- [x] `app/(smm)/index.tsx` riscritto: board a 8 colonne (una per `STATUS_ORDER`), scroll orizzontale, contatore colorato in header di ogni colonna, card (riusa `PostCard`) cliccabile → `PostDetailSheet`
- [x] Filtro "Tutti i clienti" (`selectedBrandId === null`) → `useAllPosts()` (nuova query, vedi sotto) invece di `usePosts(brandId)`; filtro `smmMode` applicato in entrambi i casi (stesso principio già in uso prima del redesign)
- [x] Nuova funzione `getAllPosts()` in `src/lib/supabase/posts.ts` + hook `useAllPosts()` in `queries.ts` (RLS `posts_smm_full` fa già il filtro per proprietario, nessun brandId da passare) — `createPost`/`updatePost`/`deletePost`/`updatePostStatus` ora invalidano anche la query key `["posts","all"]`
- [x] Sostituita la ScrollView verticale Attività+Post: le "Attività recenti" sono ora nel bottom sheet "Novità" dell'header (Task 4.1), qui resta solo la board

### 5.2 Spostamento tra colonne — solo parzialmente disponibile
- [ ] Tap su una card apre `PostDetailSheet`, che oggi permette di cambiare stato solo tramite i pulsanti esistenti (Invia al cliente/Approva/Reimposta a bozza — sottoinsieme dei 4 stati Gestione/Consulenza pre-redesign, rinominati nel Task 2). **Il vero "sposta liberamente tra tutti e 8 gli stati" arriva con il Task 11** (chip "Sposta in un altro stato" nello sheet dettaglio) — fino ad allora `da_fare`/`programmato`/`pubblicato`/`rimandato` non sono raggiungibili dalla UI, solo scrivibili a mano in DB
- [ ] Nessun drag&drop reale tra colonne (confermato: nessuna libreria installata) — il piano resta quello del Task 11 (azione "sposta" via chip nello sheet, non drag reale)

### Verifica
- [ ] Il post creato/spostato tramite le azioni esistenti compare nella colonna giusta e persiste dopo reload
- [x] `npx tsc --noEmit` pulito

---

## Task 6 — Calendario tab

### 6.1
- [x] Calendario mensile (L-D), puntino colorato per giorno con contenuti (colore = stato se cliente specifico, colore cliente via `getBrandHue` se filtro "Tutti"), giorno selezionato evidenziato pieno, legenda 8 pillole sotto (riusa `Badge` + `STATUS_ORDER`, scrollabile)
- [x] Sotto la legenda: lista contenuti del giorno selezionato (riusa `PostCard`), o `EmptyState` "Nessun contenuto in questo giorno" se vuoto
- [x] FAB "+" in basso a destra → `CreatePostSheet` con `defaultDate` precompilata al giorno selezionato e `defaultBrandId` dal filtro cliente attivo
- [x] **Nota**: `react-native-calendars` è installato in `package.json` ma non ha mai avuto nessun utilizzo reale nel codice (verificato via ricerca su tutto il repo) — il pattern esistente e già collaudato è la griglia mensile fatta a mano di `ContentGrid.tsx`. Ho seguito quello stesso approccio (calcolo `firstWeekday`/`daysInMonth`) invece di introdurre l'uso reale della libreria, per coerenza con l'unico precedente concreto in questa codebase

### Verifica
- [ ] Selezionare un giorno filtra correttamente la lista sotto, coerente con i post reali del brand/filtro attivo
- [x] `npx tsc --noEmit` pulito

---

## Task 7 — Griglia tab ✅ implementato

### 7.1
- [x] "Griglia del mese": lista testuale (`app/(smm)/griglia.tsx`) di tutti i contenuti del mese corrente, riga = data (numero+giorno abbreviato) + barra verticale colorata (colore stato) + titolo/cliente/canale/formato + badge stato, ordinata per data
- [x] Filtrabile per cliente tramite le pillole dell'header globale (`selectedBrandId`/`smmMode` condivisi)
- [x] Pulsante tratteggiato "+ Aggiungi contenuto" in fondo lista (`ListFooterComponent`) + FAB "+" fisso, entrambi aprono `CreatePostSheet` col nuovo picker "Cliente"

### Verifica
- [ ] Filtrare per mese/cliente mostra solo i post pertinenti, coerente con calendario e dashboard
- [x] `npx tsc --noEmit` pulito

---

## Nota trasversale Task 5-7 — `CreatePostSheet` esteso con picker "Cliente"

Le foto mostrano un selettore "Cliente" dentro lo sheet "Nuovo post" che prima non esisteva: il componente richiedeva un `brandId` obbligatorio dal chiamante. Necessario per il FAB di Calendario/Griglia quando il filtro è su "Tutti" (nessun brand specifico pre-selezionato).
- [x] `components/CreatePostSheet.tsx`: prop rinominata `brandId` → `defaultBrandId?` (opzionale, resta il default/pre-selezione), nuova riga "Cliente" (pillole scrollabili, solo per SMM — il cliente in Consulenza crea sempre per il proprio unico brand via `createClientPost`, invariato), validazione blocca il submit se nessun cliente è selezionato
- [x] Unico altro chiamante, `components/BrandPostsBoard.tsx`, aggiornato (`brandId` → `defaultBrandId`)

---

## Task 8 — Clienti tab + scheda cliente dettagliata ✅ implementato (con placeholder Strategia/Invita, vedi note)

Decisione utente: il selettore Colore **affianca** la Categoria esistente (non la sostituisce) — nuovo campo `brands.color`.

### 8.0 Nuovo campo `brands.color` — SQL da eseguire manualmente
```sql
alter table public.brands
  add column color text not null default 'orange'
  check (color in ('orange', 'violet', 'blue', 'green'));
```
Nota: `color` non è ancora incluso nel trigger `prevent_client_brand_field_change` (che blocca il cliente dal modificare `name`/`category`/`owner_name`) — nessuna UI cliente scrive oggi su `color`, quindi non c'è un rischio concreto, ma per coerenza con gli altri campi "di branding decisi dallo SMM" si potrebbe aggiungerlo a quella lista bloccata in futuro. Se vuoi che lo faccia, dammi l'output di `select pg_get_functiondef(oid) from pg_proc where proname = 'prevent_client_brand_field_change'` come fatto per il trigger dei post, così lo modifico sul codice reale invece di ricostruirlo.
- [x] `src/lib/mock-data.ts`: `BrandColor` (`orange|violet|blue|green`) + `BRAND_COLOR_HEX` + campo `color` su `Brand`
- [x] `src/lib/supabase/brands.ts`: `color` aggiunto a `DbBrand`/`toBrand()`/`toDbInsert()`/`updateBrand()`
- [x] `components/ui/Avatar.tsx`: nuovo prop opzionale `color` (hex) che sovrascrive il colore hash-based esistente quando presente
- [x] `components/CreateBrandSheet.tsx`: selettore Colore (4 pallini) tra "Nome brand" e "Categoria"

### 8.1 Lista clienti (`app/(smm)/brands/index.tsx`) ✅ implementato
- [x] Card cliente (`BrandCard.tsx` riscritto): avatar col colore reale del brand, nome, contatore "N contenuti · N da inviare · N in revisione" (calcolato da `useAllPosts()`, raggruppato per `brandId`), chip ToV/Obiettivo/Target/Posizionamento con placeholder "Da definire" (Task 9 li popolerà)
- [x] Pulsante "Crea cliente" in alto a destra (sostituisce il FAB), apre `CreateBrandSheet`
- [x] La tab Clienti mostra sempre il roster completo filtrato solo per `smmMode`, **non** dal `selectedBrandId` dell'header — è la lista/selettore stesso, non ha senso che si autofiltri su un solo cliente

### 8.2 Scheda cliente dettagliata (`app/(smm)/brands/[brandId].tsx`) ✅ implementato, riscritto da zero
- [x] Header: back, avatar (colore reale), nome, "Referente: X"; chip strategia placeholder; due pulsanti "Strategia" (pieno) e "Invita cliente" (outline)
- [x] Toggle Gestione/Consulenza per singolo brand: mantenuto ma ricollocato/deenfatizzato (piccola pillola grigia in alto a destra, non più accento colorato primario)
- [x] Tre contatori colorati (Da inviare/In revisione/Pubblicati) calcolati da `usePosts(brandId)`
- [x] Lista "I contenuti" (nuova, sostituisce `BrandPostsBoard`/`ContentGrid` **solo qui**): titolo, canale, formato, data, badge stato, icona matita se `da_modificare` — niente più calendario visuale ridondante in questa pagina, ora che la Calendario tab globale (Task 6) copre quella funzione
- [x] **Importante**: `BrandPostsBoard.tsx`/`ContentGrid.tsx` NON sono stati toccati — restano usati identici da `app/(client)/index.tsx` (board Consulenza lato cliente), fuori scope per questo redesign SMM-only
- [x] Sheet "Strategia" e "Invita cliente" sono per ora **placeholder**: "Strategia" mostra un messaggio "arriva a breve" (Task 9 costruirà il form reale); "Invita cliente" mostra un messaggio + la funzionalità "Copia codice cliente" già esistente come soluzione ponte, così non si perde la capacità di onboardare un cliente prima che il Task 10 costruisca il sistema di inviti vero

### Verifica
- [ ] Aprire una scheda cliente reale mostra dati coerenti con i post reali di quel brand
- [ ] Eseguire l'SQL sopra, poi creare un cliente scegliendo un colore, verificare che persista e appaia in card/avatar/pillole header
- [x] `npx tsc --noEmit` pulito

---

## Task 9 — Scheda "Strategia" del cliente (richiede nuove colonne DB) ✅ implementato

Decisione utente: i campi Strategia devono essere SMM-only, stesso principio di `name`/`category`/`owner_name` già bloccati per il cliente.

### 9.1 Migrazione DB
- [x] Colonne aggiunte (eseguito dall'utente, versione idempotente con `IF NOT EXISTS` dopo un primo tentativo parzialmente già applicato)
```sql
alter table public.brands
  add column tone_of_voice text,
  add column obiettivo text,
  add column target text,
  add column posizionamento text,
  add column frequenza_pubblicazione text,
  add column canali_attivi text[],
  add column hashtag_ricorrenti text,
  add column link_utili text;
```
- [x] Aggiornamento del trigger `prevent_client_brand_field_change` eseguito (SQL sotto, traduzione 1:1 del trigger reale con l'aggiunta degli 8 campi Strategia + `color`):

```sql
CREATE OR REPLACE FUNCTION public.prevent_client_brand_field_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    IF NEW.color IS DISTINCT FROM OLD.color THEN
      RAISE EXCEPTION 'Solo lo SMM può modificare il colore del brand';
    END IF;
    IF NEW.tone_of_voice IS DISTINCT FROM OLD.tone_of_voice THEN
      RAISE EXCEPTION 'Solo lo SMM può modificare il tone of voice';
    END IF;
    IF NEW.obiettivo IS DISTINCT FROM OLD.obiettivo THEN
      RAISE EXCEPTION 'Solo lo SMM può modificare l''obiettivo';
    END IF;
    IF NEW.target IS DISTINCT FROM OLD.target THEN
      RAISE EXCEPTION 'Solo lo SMM può modificare il target';
    END IF;
    IF NEW.posizionamento IS DISTINCT FROM OLD.posizionamento THEN
      RAISE EXCEPTION 'Solo lo SMM può modificare il posizionamento';
    END IF;
    IF NEW.frequenza_pubblicazione IS DISTINCT FROM OLD.frequenza_pubblicazione THEN
      RAISE EXCEPTION 'Solo lo SMM può modificare la frequenza di pubblicazione';
    END IF;
    IF NEW.canali_attivi IS DISTINCT FROM OLD.canali_attivi THEN
      RAISE EXCEPTION 'Solo lo SMM può modificare i canali attivi';
    END IF;
    IF NEW.hashtag_ricorrenti IS DISTINCT FROM OLD.hashtag_ricorrenti THEN
      RAISE EXCEPTION 'Solo lo SMM può modificare gli hashtag ricorrenti';
    END IF;
    IF NEW.link_utili IS DISTINCT FROM OLD.link_utili THEN
      RAISE EXCEPTION 'Solo lo SMM può modificare i link utili';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Il trigger brands_lock_owner_fields è già agganciato a questa funzione
-- (CREATE OR REPLACE la aggiorna in place, non serve ricreare il trigger).
```

### 9.2 Backend ✅ implementato
- [x] `src/lib/supabase/brands.ts`: `DbBrand`/`toBrand()`/`toDbInsert()`/`updateBrand()` estesi con gli 8 campi
- [x] `src/lib/mock-data.ts`: `Brand` esteso (`toneOfVoice`, `obiettivo`, `target`, `posizionamento`, `frequenzaPubblicazione`, `canaliAttivi: Channel[]`, `hashtagRicorrenti`, `linkUtili`)

### 9.3 UI ✅ implementato
- [x] Nuovo `components/StrategiaSheet.tsx`: campi Tone of voice, Obiettivo, Target, Posizionamento, Frequenza di pubblicazione, Canali attivi (pillole multi-select Instagram/Facebook), Hashtag ricorrenti, Link utili, pulsante "Salva strategia" — collegato al posto del placeholder in `app/(smm)/brands/[brandId].tsx`
- [x] Chip colorati (ToV/Obiettivo/Target/Posizionamento) in `BrandCard.tsx` e `[brandId].tsx` ora mostrano il valore reale quando compilato, "Da definire" altrimenti

### Verifica
- [ ] Eseguire entrambi gli SQL sopra (nuove colonne + trigger aggiornato), poi compilare la strategia di un cliente reale, ricaricare l'app, i dati persistono e compaiono come chip
- [ ] Il cliente non può modificare i campi strategia (né il colore)
- [x] `npx tsc --noEmit` pulito

---

## Task 10 — Sistema di inviti cliente (nuova tabella DB) ✅ implementato

Deviazioni dal piano originale, decise durante l'implementazione:
- **Due funzioni invece di una**: `validate_invite` (sola lettura, non consuma il codice — usata per precompilare il form prima della registrazione) e `accept_invite` (consuma il codice, chiamata solo DOPO che `signUp()` è andato a buon fine). La versione originale con una sola funzione avrebbe bruciato il codice anche se la registrazione falliva dopo la validazione.
- **Link Magico reale**: l'app ha uno `scheme` configurato (`cedeasy`, in `app.json`) ma nessun dominio web proprio — niente `cedeasy.app/i/<code>` (non esisterebbe davvero). Il link è `cedeasy://join/<code>`, un vero deep link Expo Router verso la nuova rotta `app/(auth)/join/[code].tsx`.
- **Un solo codice, tre presentazioni**: invece di generare record/valori diversi per Link/Codice/Email, un solo invito PENDING per brand viene riusato (`getOrCreateInvite`) e mostrato in tutti e 3 i blocchi dello sheet — stesso valore sia nel link che nel codice digitabile a mano.

### 10.1 Migrazione DB ✅ eseguito
```sql
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  smm_id uuid not null references public.profiles(id) on delete cascade,
  method text not null check (method in ('LINK', 'CODE', 'EMAIL')),
  code text unique,
  email text,
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'EXPIRED')),
  created_at timestamptz default now(),
  accepted_at timestamptz
);

alter table public.invites enable row level security;

create policy "invites_smm_full" on public.invites
  for all
  using (smm_id = auth.uid())
  with check (smm_id = auth.uid());

-- Sola lettura, non consuma il codice — usata per precompilare il form di
-- registrazione (nome brand) PRIMA che il cliente crei l'account.
create or replace function public.validate_invite(invite_code text)
returns table(brand_id uuid, brand_name text)
language plpgsql
security definer
as $$
begin
  return query
    select i.brand_id, b.name
    from public.invites i
    join public.brands b on b.id = i.brand_id
    where i.code = invite_code and i.status = 'PENDING';

  if not found then
    raise exception 'Codice invito non valido o già utilizzato';
  end if;
end;
$$;

-- Consuma il codice (status → ACCEPTED) — chiamata solo dopo signUp() riuscito.
create or replace function public.accept_invite(invite_code text)
returns uuid
language plpgsql
security definer
as $$
declare
  result_brand_id uuid;
begin
  select brand_id into result_brand_id
  from public.invites
  where code = invite_code and status = 'PENDING';

  if result_brand_id is null then
    raise exception 'Codice invito non valido o già utilizzato';
  end if;

  update public.invites set status = 'ACCEPTED', accepted_at = now() where code = invite_code;

  return result_brand_id;
end;
$$;

-- Le funzioni devono essere chiamabili anche da utenti non autenticati (il
-- cliente non ha ancora un account nel momento in cui valida/accetta l'invito).
grant execute on function public.validate_invite(text) to anon, authenticated;
grant execute on function public.accept_invite(text) to anon, authenticated;
```

### 10.2 UI lato SMM ✅ implementato
- [x] Nuovo `components/InviteClientSheet.tsx`, collegato in `app/(smm)/brands/[brandId].tsx` al posto del vecchio "Copia codice cliente": 3 blocchi **Link Magico** (badge CONSIGLIATO, `cedeasy://join/<code>`, Copia), **Codice Invito** (`SMM-NOME-123`, Copia), **Invito via Email** (campo email + `mailto:` con link e codice nel corpo)
- [x] Installato `expo-clipboard` per il copia-negli-appunti cross-platform (la vecchia implementazione funzionava solo su web)

### 10.3 UI lato cliente ✅ implementato
- [x] `app/(auth)/register.tsx`: rimossa selezione ruolo e campo "Codice Cliente" — registrazione libera crea sempre `role: 'SMM'`; aggiunto link "Ho un codice" (per chi ha un Codice Invito testuale, non un link tappabile)
- [x] `app/(auth)/join/[code].tsx`: valida il codice via `validate_invite()`, mostra il nome del brand, form di registrazione cliente (nome/email/password, nessun campo codice/brand manuale); consuma il codice via `accept_invite()` solo dopo `signUp()` riuscito
- [x] `app/(auth)/join/index.tsx`: schermata "Ho un codice" per l'inserimento manuale, spinge su `join/[code]` con il codice digitato
- [x] Link "Ho un codice" aggiunto anche in `login.tsx`

### Verifica
- [ ] Eseguire l'SQL sopra, poi generare un invito da un cliente reale, copiare il Codice Invito, testare la registrazione da `app/(auth)/join` inserendolo a mano
- [ ] Un codice scaduto/già usato (status non PENDING) viene rifiutato con messaggio chiaro
- [ ] **Il deep link reale (`cedeasy://join/<code>` tappato da un'app esterna tipo WhatsApp) non è stato testato in questa sessione** — richiede un device/simulatore, verificalo tu
- [x] `npx tsc --noEmit` pulito (ha richiesto una rigenerazione dei tipi di route di Expo Router — `.expo/types/router.d.ts` era stale dal 2026-07-08, l'ho rigenerato avviando brevemente `expo start`)

---

## Task 11 — Post detail sheet: badge 8 stati + "Sposta in un altro stato" ✅ implementato

### 11.1 ✅ implementato
- [x] `components/PostDetailSheet.tsx`: badge stato in alto (invariato, già sul nuovo enum dal Task 2); note dinamiche "Diventerà '[stato]'..." sotto i pulsanti "Invia al cliente"/"Invia all'SMM" esistenti
- [x] Riga "Anteprima IG/FB" (apre uno sheet placeholder — il mockup reale è il Task 12) + "Rimanda" (→ `rimandato`, solo SMM: azione di ripianificazione, non ha senso lato cliente)
- [x] Sezione "SPOSTA IN UN ALTRO STATO": 8 chip (`STATUS_ORDER`), quello corrente evidenziato pieno, gli altri abilitati solo se raggiungibili da `getAllowedTargets(role, isConsulenza, statoAttuale)` — nuova funzione che rispecchia **esattamente** la logica del trigger `prevent_client_post_tampering` (Task 2): SMM libero su tutti gli 8 (è sempre owner del brand, garantito da RLS), cliente Gestione solo `da_revisionare → {approvato, da_modificare}`, cliente Consulenza solo `bozza_privata → {bozza_privata, da_revisionare}` (mai da `approvato` in poi). Le chip non permesse sono disabilitate (opacità ridotta, non cliccabili), non semplicemente silenziose se il tap fallisse
- [x] Sheet allargato da `45%` a `85%` di snap point per fare spazio alle nuove sezioni (resta scrollabile)

### Verifica
- [ ] Spostare stato da questo sheet aggiorna coerentemente kanban/calendario/griglia dopo chiusura sheet
- [ ] Da cliente: verificare che le chip non permesse siano davvero disabilitate (non solo esteticamente) in entrambe le modalità
- [x] `npx tsc --noEmit` pulito

---

## Task 12 — Anteprima post IG/FB ✅ implementato

### 12.1 ✅ implementato
- [x] Nuovo `components/PostPreview.tsx` (toggle Instagram/Facebook, layout distinto per piattaforma: FB = caption sopra immagine + barra "Mi piace/Commenta/Condividi"; IG = immagine + riga icone cuore/commento/invio/salva + caption sotto). Usa dati reali: `useBrand(post.brandId)` per nome/colore avatar, `post.mediaLink` renderizzato come immagine reale (`Image` con `onError` di fallback), nessuna didascalia/foto/conteggio like inventato
- [x] Nota fissa in fondo: "Così apparirà nel feed — CedEasy non pubblica al posto tuo"
- [x] Collegato in `PostDetailSheet.tsx` al posto del placeholder del Task 11

### Verifica
- [ ] Aprire l'anteprima su un post con immagine reale (URL diretto) e uno senza — nessun crash, placeholder sensato in entrambi i casi limite (nessun link, link non caricabile)
- [x] `npx tsc --noEmit` pulito

---

## Task 13 — Onboarding: 4 slide (da 5 attuali) ✅ implementato

### 13.1 ✅ implementato
- [x] `components/OnboardingModal.tsx` riscritto da 5 a 4 schermate: "Tutti i tuoi clienti in un posto solo" (illustrazione due cerchi P/F sovrapposti), "Ogni stato ha il suo colore" (4 `Badge` reali: bozza_privata/da_revisionare/approvato/pubblicato), "Invia al cliente con un tap" (due riquadri colorati + freccia), "Il cliente approva in due tap" (documento + spunta verde)
- [x] Swipe reale tra le schermate: `ScrollView` orizzontale `pagingEnabled` + `onMomentumScrollEnd` per sincronizzare i pallini, sostituendo la precedente animazione `Animated.timing` manuale — nessuna nuova libreria di carousel
- [x] "Salta" sempre visibile (anche sull'ultima schermata, non solo su le prime 3 come nella versione precedente), pallini anche tappabili per saltare a una schermata specifica, bottone pieno in basso (Avanti/Inizia! sull'ultima)
- [x] Persistenza invariata: stessa chiave `ONBOARDING_KEY` in AsyncStorage, stesso punto di innesco in `app/(smm)/index.tsx`

### Verifica
- [ ] Prima apertura (storage pulito): onboarding compare con swipe funzionante, "Salta" funziona, non ricompare al riavvio
- [x] `npx tsc --noEmit` pulito

---

## Note finali

- I task 2 (stato unificato) e 3 (canale) sono propedeutici a quasi tutto il resto (badge, kanban, sposta-stato, sheet nuovo post) — vanno completati e verificati per bene prima di procedere.
- Il Task 4.3 (collocazione tab Profilo) resta una domanda aperta esplicita per l'utente, da risolvere prima di toccare la navigazione.
- Nessun dato mockato in nessun task: tutte le nuove schermate/feature usano sempre query reali contro Supabase, anche se inizialmente vuote.

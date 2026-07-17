# CedEasy (social-planner) — Riassunto tecnico completo

> Documento generato il 2026-07-08 leggendo direttamente il codice del repository.

## 1. Cos'è il progetto

App mobile/web (Expo, quindi cross-platform iOS/Android/Web da un'unica codebase) per la
pianificazione di contenuti social tra un **SMM** (Social Media Manager, agenzia) e i suoi
**Clienti** (ogni cliente è legato a un unico "brand"). Nome interno del pacchetto: `cedeasy`.

Due ruoli:
- **SMM**: gestisce più brand/clienti, crea o revisiona i post, li pubblica sul calendario.
- **Cliente**: legato a un solo brand, vede/approva i post (o li crea lui stesso, a seconda della modalità — vedi sotto).

Due **modalità di lavoro per brand** (`work_mode`), impostabile dallo SMM in qualsiasi momento:
- **Gestione** (`FULL_MANAGEMENT`): lo SMM crea il post → il cliente approva o richiede modifiche.
- **Consulenza** (`CONSULTANCY`): il cliente crea il post → lo SMM dà suggerimenti/modifica direttamente → lo SMM approva (ultima parola all'SMM, non al cliente — flusso invertito rispetto a Gestione).

Il `work_mode` è impostato per singolo post al momento della creazione (eredita quello del brand in quel momento) e **non cambia più retroattivamente** se lo SMM cambia modalità al brand in seguito.

---

## 2. Stack tecnologico

| Livello | Tecnologia |
|---|---|
| Framework app | **Expo SDK 54** + **React Native 0.81** + **React 19** |
| Routing | **expo-router 6** (file-based, route groups) |
| Linguaggio | **TypeScript 5.9** |
| Backend / DB | **Supabase** (Postgres + Auth + RLS), client `@supabase/supabase-js` |
| Data fetching / cache | **TanStack Query (react-query) v5** |
| Form | **react-hook-form** + **zod** (validazione schema) + `@hookform/resolvers` |
| Date | **date-fns** |
| Calendario | **react-native-calendars** |
| Icone | **lucide-react-native** |
| Storage locale | `@react-native-async-storage/async-storage` |
| UI feedback | `react-native-toast-message` |
| Stile | `StyleSheet.create` nativo (nessuna libreria CSS/Tailwind) — design system custom (vedi §4) |
| Web | `react-native-web` (l'app gira anche in browser) |

Non ci sono file `.sql` versionati nel repo: **lo schema Supabase è gestito solo lato dashboard**, non c'è cartella `supabase/migrations`. Questo è importante da sapere: lo schema "vivo" è quello che risulta interrogando Supabase, non il codice.

---

## 3. Architettura dell'app

### Routing (Expo Router, cartella `app/`)

```
app/
  _layout.tsx          ← root layout: providers globali + AuthGuard (redirect in base a ruolo/login)
  (auth)/
    login.tsx
    register.tsx
  (smm)/                ← gruppo di rotte per lo SMM
    index.tsx            dashboard SMM (statistiche, attività recenti)
    profile.tsx           profilo SMM (editabile: solo nome)
    brands/
      index.tsx           elenco brand/clienti dello SMM
      [brandId].tsx        board dei post di un brand (calendario/lista + azioni)
  (client)/              ← gruppo di rotte per il Cliente (4 tab)
    index.tsx             dashboard cliente
    dashboard.tsx          statistiche/KPI cliente
    account.tsx             profilo cliente + dati brand
```

### Autenticazione e stato globale — `src/lib/app-store.tsx`

Context React (`AppStoreProvider`/`useAppStore`) che espone:
- `role`: `'smm' | 'client'` — risolto leggendo `profiles.role` da Supabase dopo il login.
- `smmMode`: preferenza locale persistita in AsyncStorage (non è la work_mode del brand, è solo lo stato dell'ultimo filtro usato in UI).
- `activeBrandId`: per il cliente, il suo `brand_id`.
- `userId`, `isReady`.

`AuthGuard` (in `app/_layout.tsx`) fa redirect automatico:
- utente non loggato fuori da `(auth)` → redirect a `/login`
- utente loggato dentro `(auth)` → redirect al gruppo giusto in base al ruolo
- mismatch tra path montato e ruolo risolto (può succedere su reload web) → redirect forzato

### Data layer

- `src/lib/supabase.ts` — inizializza il client Supabase.
- `src/lib/supabase/{posts,brands,profiles,comments}.ts` — un modulo per tabella, ciascuno con:
  - tipo `Db*` che rispecchia le colonne Postgres (snake_case)
  - funzione `to*()` che converte riga DB → tipo frontend (camelCase)
  - query (`get*`) e mutation (`create*`/`update*`/`delete*`)
- `src/lib/queries.ts` — hook React Query (`useBrands`, `usePosts`, `useCreatePost`, ecc.) che avvolgono le funzioni sopra con cache/invalidation.
- `src/lib/mock-data.ts` — **nonostante il nome**, contiene le definizioni dei **tipi di dominio condivisi** (`Post`, `Brand`, `ProfileDTO`) e utility pure (calcolo iniziali, colore hue deterministico da id, emoji per tipo post). I commenti nel codice specificano che questi tipi "rispecchiano esattamente i DTO del backend Java" — indizio che esisteva/esiste un backend Java parallelo o precedente.

---

## 4. Design system (utile per portarlo su un'altra piattaforma)

Tutto vive in `constants/` + `components/ui/`. Nessuna libreria di UI esterna: componenti custom con `StyleSheet.create`.

### 4.1 Colori — `constants/colors.ts`

```js
primary:            #7c3aed   // viola
primaryLight:        #ede9fe
primaryForeground:   #ffffff

background:          #ffffff
card:                #f8fafc
border:               #e2e8f0
input:                #f1f5f9

text.primary:         #0f172a
text.secondary:       #64748b
text.muted:           #94a3b8
text.inverse:         #ffffff

destructive:          #ef4444
destructiveLight:     #fef2f2
destructiveForeground:#ffffff

success:              #10b981
successLight:         #ecfdf5

overlay:               rgba(0,0,0,0.4)
```

**Colori di stato (semaforo)** — usati per badge/dot sullo stato dei post:

| Stato visivo | dot | bg | text |
|---|---|---|---|
| draft (bozza) | `#94a3b8` | `#f1f5f9` | `#475569` |
| pending (in approvazione) | `#f59e0b` | `#fffbeb` | `#b45309` |
| changes_requested (modifiche richieste) | `#f43f5e` | `#fff1f2` | `#be123c` |
| approved (approvato) | `#10b981` | `#ecfdf5` | `#047857` |

Nota: la palette usa la scala **Tailwind/slate** standard (slate-50…900, amber, rose, emerald, violet) — utile saperlo se si vuole rigenerare la palette su un altro design system basato su token simili (es. Tailwind, Radix).

### 4.2 Tipografia — `constants/typography.ts`

| Token | size | weight | line-height |
|---|---|---|---|
| h1 | 28 | 700 | 36 |
| h2 | 22 | 700 | 30 |
| h3 | 18 | 600 | 26 |
| body | 15 | 400 | 22 |
| bodyMedium | 15 | 500 | 22 |
| small | 13 | 400 | 18 |
| smallMedium | 13 | 500 | 18 |
| caption | 11 | 400 | 16 |
| label | 13 | 600 | 18 |

Nessun font custom dichiarato esplicitamente nei file letti (usa il default di sistema via `expo-font`, verificare `assets/fonts` se serve il nome esatto).

### 4.3 Spacing & Radius — `constants/spacing.ts`

```
spacing: xs=4  sm=8  md=12  lg=16  xl=20  2xl=24  3xl=32
radius:  sm=6  md=10  lg=14  xl=18  full=9999
```

### 4.4 Componenti UI base — `components/ui/`

- **Button** — varianti `primary | secondary | ghost | destructive`, altezza fissa 46px, radius `md`, stato `loading` (spinner) e `disabled` (opacity 0.5), `fullWidth` opzionale. Pressed → opacity 0.75.
- **Badge** — pill (radius `full`) con dot colorato + testo, guidato da `STATUS_CONFIG` (vedi §5.2).
- **Card** — contenitore con bg bianco, border 1px `colors.border`, radius `lg`, ombra leggera (shadowOpacity 0.06).
- **BottomSheet (`Sheet`)** — modale custom che replica l'API di `@gorhom/bottom-sheet` (`present()`/`dismiss()` via ref), animazione spring dal basso, snap points configurabili (default `['50%','90%']`), overlay `rgba(0,0,0,0.45)`, handle bar in cima, header con titolo + bottone chiudi (icona X, lucide), contenuto scrollabile opzionale.
- **Avatar, EmptyState, SkeletonLoader, Textarea, Input** — altri primitivi UI (non ancora ispezionati in dettaglio, ma seguono lo stesso pattern token-based).

### 4.5 Componenti di dominio (in `components/`, non `ui/`)

- `BrandCard` — card riassuntiva di un brand nell'elenco SMM.
- `ContentGrid` — griglia/lista dei post (riusata sia lato SMM che, dopo il rework Consulenza, lato cliente).
- `PostCard` — card singolo post nel grid.
- `ActivityCard` — riga del feed "Attività recenti".
- `BrandPostsBoard` — board calendario/lista dei post di un brand (usato in `(smm)/brands/[brandId].tsx`).
- `CreatePostSheet` / `EditPostSheet` / `PostDetailSheet` — sheet SMM per creare/modificare/vedere dettaglio post (resi "role-aware" nel rework Consulenza, invece di duplicare varianti cliente).
- `ClientPostDetailSheet` — dettaglio post lato cliente, include i suggerimenti SMM ancorati a campo (`FieldSuggestions`, sotto-componente).
- `CommentsThread` — thread commenti/suggerimenti su un post.
- `CreateBrandSheet` — creazione/modifica brand lato SMM.
- `HistorySheet` — storico/confronto periodi (MoM/QoQ) lato cliente.
- `ReportSheet` — report esportabile (probabile riepilogo KPI).
- `OnboardingModal` — modale di onboarding alla prima apertura.
- `OfflineBanner` — banner persistente quando manca connessione (usa `@react-native-community/netinfo`).

---

## 5. Modello dati (tipi frontend)

Definiti in `src/lib/mock-data.ts` + `src/lib/supabase/comments.ts`.

### 5.1 `Post`
```ts
interface Post {
  id: string
  brandId: string
  brandName?: string
  title: string
  caption: string
  type: "Post" | "Reel" | "Carosello" | "Story"
  date: string              // ISO "YYYY-MM-DDThh:mm:ss"
  status: "draft" | "pending" | "approved"
  hasChangesRequested: boolean
  workMode: "gestione" | "consulenza"
  feedback?: string
  mediaLink?: string
  internalNotes?: string
  lastUpdatedBy?: string    // id profilo di chi ha fatto l'ultima modifica contenuto
}
```

### 5.2 Semaforo di stato — mapping DB → frontend

Il DB ha **9 valori di status** diversi (per tenere separati i due flussi), ma il frontend li riduce sempre a 3 stati visivi + 1 flag:

| Status DB | Flusso | Stato frontend | hasChangesRequested |
|---|---|---|---|
| `PENDING`, `DRAFT` | Gestione | draft | false |
| `REVISION_REQUESTED` | Gestione | pending | false |
| `CHANGES_REQUESTED` | Gestione | draft | **true** (⚠) |
| `APPROVED`, `PUBLISHED` | Gestione | approved | false |
| `CLIENT_DRAFT` | Consulenza | draft | false |
| `SMM_REVIEW` | Consulenza | pending | false |
| `SMM_APPROVED` | Consulenza | approved | false |

`getVisualStatus()` (in `src/lib/status-config.ts`) trasforma `(status, hasChangesRequested)` in un 4° stato visivo: `changes_requested` (rosso/rombo ⚠, distinto dal draft neutro).

**Azioni utente → nuovo status DB** dipendono dal `work_mode` del post (stessa azione generica, colonna DB diversa scritta):

| Azione (frontend) | Gestione → DB | Consulenza → DB |
|---|---|---|
| invia per revisione | `REVISION_REQUESTED` | `SMM_REVIEW` |
| approva | `APPROVED` | `SMM_APPROVED` |
| richiedi modifiche (solo cliente Gestione) | `CHANGES_REQUESTED` | *(non esiste — l'SMM modifica direttamente)* |
| reset a bozza | `PENDING` | `CLIENT_DRAFT` |

### 5.3 `Brand`
```ts
interface Brand {
  id: string
  name: string
  category?: string
  smmId: string
  ownerName?: string
  email?: string
  phone?: string
  tiktokUrl?: string
  instagramUrl?: string
  facebookUrl?: string
  telegramUrl?: string
  linkedinUrl?: string
  workMode: "gestione" | "consulenza"
}
```

### 5.4 `ProfileDTO`
```ts
interface ProfileDTO {
  id: string
  fullName: string
  email: string
  role: "SMM" | "CLIENT"
}
```

### 5.5 `Comment` (suggerimenti/commenti)
```ts
interface Comment {
  id: string
  postId: string
  authorId: string
  body: string
  createdAt: string
  targetField?: "title" | "caption" | "platform" | "media_link" | "scheduled_date"
}
```
`targetField` è valorizzato solo lato SMM in Consulenza (suggerimento ancorato a un campo specifico del post, non un thread generico).

### 5.6 KPI e report cliente (`ClientStats`, `ClientKPIs`, `ClientComparison`)

Calcolati **lato frontend** aggregando le righe di `posts` (non ci sono view/RPC SQL dedicate):
- `ClientStats`: totale post, pending, changesRequested, approved, mese corrente.
- `ClientKPIs`: tempo medio di approvazione in giorni, `firstPassRate` (% approvati senza feedback), `feedbackRate` (% post con feedback → indicatore qualità: verde ≤20%, giallo ≤40%, rosso oltre), grafico ultimi 6 mesi.
- `ClientComparison`: confronto mese-su-mese (MoM) e trimestre-su-trimestre (QoQ), storico 6 mesi.

### 5.7 Activity feed

`getRecentActivities()` interroga `posts` (ultimi 7 giorni, esclude `CLIENT_DRAFT`) e genera messaggi umani tipo *"Hai approvato…"* / *"Il cliente ha modificato…"* confrontando `last_updated_by` con l'utente corrente. Tipi: `new_post | approved | revision_requested | client_proposed`.

---

## 6. Schema database (Supabase/Postgres)

*(Verificato l'8/7/2026 con una query diretta su `information_schema.columns` e `pg_constraint` — questa sezione riflette lo stato reale del DB, non solo il codice. Non versionato nel repo: nessuna cartella `supabase/migrations`.)*

### Tabella `posts`
| Colonna | Tipo | Nullable | Default | Note |
|---|---|---|---|---|
| id | uuid PK | NO | `gen_random_uuid()` | generato lato DB (il frontend passa comunque un `crypto.randomUUID()` esplicito in insert) |
| brand_id | uuid FK → brands, **ON DELETE CASCADE** | NO | | se il brand viene cancellato, tutti i suoi post vengono cancellati automaticamente |
| title | varchar | NO | | |
| content | text | YES | | = "caption" nel frontend |
| platform | varchar | NO | | = "type" nel frontend (`Post/Reel/Carosello/Story`) |
| media_link | varchar | YES | | |
| scheduled_date | date | NO | | |
| scheduled_time | varchar | YES | | (non `time`, come si poteva pensare — è testo libero tipo `"14:30:00"`) |
| status | varchar, CHECK `posts_status_check` | YES | ⚠ `'''PENDING'''` (vedi nota sotto) | 9 valori, vedi §5.2 |
| work_mode | varchar, CHECK `posts_work_mode_check` | YES | `'FULL_MANAGEMENT'` | `CONSULTANCY` / `FULL_MANAGEMENT` |
| internal_notes | text | YES | | solo SMM |
| feedback | text | YES | | |
| created_at / updated_at | timestamptz | YES | `now()` | |
| **planning_status** | text | YES | `'da_fare'` | ⚠ **colonna non usata da nessuna parte nel frontend attuale** (nessun riferimento in `src/`, `components/`, `app/`) — probabile residuo di una feature precedente/pianificata (kanban "da fare/in corso/fatto"?) mai collegata alla UI |
| last_updated_by | uuid FK → auth.users | YES | | id profilo ultimo editor contenuto |

⚠ **Anomalia nel default di `status`**: il valore riportato da Postgres è letteralmente `'''PENDING'''::character varying`, cioè la stringa `'PENDING'` **con gli apici inclusi nel dato**, non il default pulito `PENDING`. Questo suggerisce che il default sia stato impostato con un errore di escaping (es. `DEFAULT '''PENDING'''` invece di `DEFAULT 'PENDING'`). In pratica non è un problema perché il codice (`postToDbInsert` in `posts.ts`) passa sempre `status` esplicitamente in insert, quindi il default DB non viene mai effettivamente usato — ma vale la pena ripulirlo (`ALTER COLUMN status SET DEFAULT 'PENDING'`) per evitare sorprese in futuro se qualcuno inserisce righe senza passare da `createPost`.

✅ **Correzione rispetto alla versione precedente di questo documento**: esiste `ON DELETE CASCADE` tra `comments.post_id` → `posts.id` (constraint `comments_post_id_fkey`). Il codice (`deletePost`) cancella comunque i commenti manualmente prima del post — ridondante ma non sbagliato, probabilmente scritto prima che il cascade fosse aggiunto al DB.

### Tabella `brands`
| Colonna | Tipo | Nullable | Default | Note |
|---|---|---|---|---|
| id | uuid PK | NO | `gen_random_uuid()` | |
| name | varchar | NO | | |
| smm_id | uuid FK → profiles, **ON DELETE CASCADE** | NO | | se il profilo SMM viene cancellato, i suoi brand vengono cancellati (e a cascata i loro post) |
| **client_id** | uuid FK → profiles | YES | | ⚠ **colonna non usata nel frontend attuale** — nessun riferimento in `src/`. Sembra un modo alternativo/legacy di collegare cliente↔brand rispetto a `profiles.brand_id` (quello effettivamente usato ovunque nel codice). Le due relazioni non sono tenute sincronizzate da nessun trigger noto: se un giorno si popola `client_id` senza aggiornare anche `profiles.brand_id` (o viceversa), i due riferimenti possono divergere silenziosamente |
| owner_name, email, phone, tiktok_url, instagram_url, facebook_url, telegram_url, linkedin_url, category | varchar | YES | | campi di contatto, editabili anche dal cliente (tranne owner_name/category, solo SMM) |
| work_mode | text, CHECK `brands_work_mode_check` | NO | `'FULL_MANAGEMENT'` | `CONSULTANCY` / `FULL_MANAGEMENT` |
| created_at | timestamptz | YES | `now()` | |

### Tabella `profiles`
| Colonna | Tipo | Nullable | Default | Note |
|---|---|---|---|---|
| id | uuid PK, FK → auth.users, **ON DELETE CASCADE** | NO | | = `auth.uid()`; se l'utente auth viene cancellato, il profilo lo segue |
| full_name | varchar | YES | | |
| email | varchar | YES | | |
| role | varchar, CHECK `profiles_role_check` | YES | `'SMM'` | `SMM` / `CLIENT` — **single-table inheritance** tra i due ruoli sulla stessa tabella |
| brand_id | uuid FK → brands, **ON DELETE SET NULL** | YES | | solo per i CLIENT; se il brand collegato viene cancellato, il cliente resta orfano (`brand_id` = null) invece di essere cancellato lui stesso |
| created_at | timestamptz | YES | `now()` | |

Trigger `on_auth_user_created` (`AFTER INSERT ON auth.users`) auto-crea la riga `profiles` leggendo `raw_user_meta_data` passato a `signUp()`.

### Tabella `comments`
| Colonna | Tipo | Nullable | Default | Note |
|---|---|---|---|---|
| id | uuid PK | NO | | generato client-side |
| post_id | uuid FK → posts, **ON DELETE CASCADE** | NO | | |
| author_id | uuid | YES | | |
| body | text | NO | | |
| created_at | timestamptz | YES | | |
| target_field | text, CHECK `comments_target_field_check` | YES | | `title\|caption\|platform\|media_link\|scheduled_date\|NULL` |

### Foreign key e comportamento a cascata — riepilogo
```
auth.users ──CASCADE──> profiles ──CASCADE──> brands ──CASCADE──> posts ──CASCADE──> comments
                            ↑                     │
                            └────SET NULL──────────┘  (brands.client_id → profiles, e profiles.brand_id → brands, SET NULL)
```
Cancellare un utente auth innesca quindi una cascata "a valanga": profilo → tutti i suoi brand (se SMM) → tutti i post di quei brand → tutti i commenti di quei post. Da tenere presente per qualsiasi funzione di "elimina account".

### RLS (Row Level Security) — solo i punti salienti
*(Nota: la query eseguita finora ha verificato colonne e constraint, non le policy `pg_policies` — i punti sotto restano quelli verificati in sessioni precedenti; se serve la lista esatta delle policy attive oggi, lancia `select * from pg_policies where schemaname = 'public';` e incollami il risultato.)*
- Tutte le tabelle hanno RLS attiva; lo SMM vede/gestisce tutto ciò che possiede (`smm_id = auth.uid()` sui brand, a cascata sui post), il cliente solo il proprio `brand_id` (via helper `get_my_brand_id()`).
- **Trigger anti-tampering** oltre alla RLS pura (perché Postgres RLS non fa restrizioni a livello di singola colonna):
  - `profiles_lock_role_brand` — un cliente non può cambiarsi da solo `role`/`brand_id`.
  - `brands_lock_owner_fields` — un cliente non può cambiare `name`/`category`/`owner_name`/`smm_id` del proprio brand (solo i campi di contatto).
  - `posts_lock_fields_for_client` — un cliente non può cambiare `brand_id`/`work_mode` di un post, e gli status scrivibili sono ristretti in base al `work_mode` della riga (impedisce l'auto-approvazione).
- Nota tecnica di sicurezza rilevante: con più policy RLS permissive sullo stesso comando, Postgres fa OR separatamente su `USING` e su `WITH CHECK` **tra tutte le policy**, non in coppia dentro la stessa policy — quindi RLS "pura" non basta a impedire scenari come "il cliente approva da solo un post Consulenza", da qui la necessità dei trigger sopra.
- Una policy nota è **troppo permissiva** e segnalata per revisione: `Enable read access for all users` su `posts` (`qual: true`, legge tutte le righe per chiunque sia autenticato).

---

## 7. Punti di attenzione / debito tecnico noto

1. Policy RLS `posts`: `Enable read access for all users` troppo permissiva, da restringere.
2. Policy ridondante su `brands`: `SMM can manage their own brands` sembra duplicare `brands_smm_full`.
3. `brands.client_id` e `posts.planning_status`: colonne presenti nel DB ma **non referenziate da nessuna parte nel frontend** (verificato con grep su tutto `src/`, `components/`, `app/`) — probabile debito da una feature precedente/abbandonata. Se non servono, valutare di rimuoverle; se servono per un uso futuro (es. `planning_status` per una vista kanban "da fare"), documentarne l'intento prima che qualcuno le riusi in modo incoerente con `status`/`profiles.brand_id`.
4. Default anomalo `posts.status = '''PENDING'''` (apici doppi inclusi nel valore di default) — innocuo perché il codice passa sempre `status` esplicitamente, ma da ripulire con `ALTER TABLE posts ALTER COLUMN status SET DEFAULT 'PENDING'`.
3. Bug di registrazione risolto l'8/7/2026: `register.tsx` non passava `role`/`brand_id` a `signUp()`, quindi nessuna registrazione cliente collegava correttamente un brand — corretto, ma i profili creati **prima** del fix restano da sistemare manualmente.
4. Rework in corso: la UI cliente in Consulenza sta passando da una vista "ridotta" a piena parità con lo SMM (stessi poteri di crea/modifica/elimina) — vedi `modifiche/2026-07-08-piano-client-consulenza-parita-smm.md` per lo stato.

---

## 8. Cosa serve per un design system su un'altra piattaforma

Riepilogo dei "token" pronti da riportare 1:1:
- **Palette colori** completa in §4.1 (base Tailwind/slate + viola primario `#7c3aed`).
- **Scala tipografica** in §4.2 (9 stili, size/weight/line-height).
- **Scala spaziatura** (7 step, 4→32px) e **raggi** (5 step, 6→9999px) in §4.3.
- **Componenti primitivi** da ricreare: Button (4 varianti), Badge (pill con dot di stato), Card (bordo + ombra leggera), BottomSheet/modale con handle e snap points, Avatar, EmptyState, SkeletonLoader, Input/Textarea.
- **Sistema di stato a 4 colori** (draft/pending/changes_requested/approved) riusato ovunque per badge, dot, bordi — è il concetto visivo centrale dell'app (il "semaforo").

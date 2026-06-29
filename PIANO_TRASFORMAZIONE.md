# Piano di Trasformazione — Web App → React Native + Expo
**Cartella di lavoro:** `d:\social-planner` (trasformazione in-place)

---

## Cosa si tiene, cosa si elimina, cosa si riscrive

| File/Cartella | Azione | Motivo |
|---|---|---|
| `src/lib/supabase/brands.ts` | **Tieni** | Funziona identico in RN |
| `src/lib/supabase/posts.ts` | **Tieni** | Funziona identico in RN |
| `src/lib/supabase/profiles.ts` | **Tieni** | Funziona identico in RN |
| `src/lib/supabase/comments.ts` | **Tieni** | Funziona identico in RN |
| `src/lib/queries.ts` | **Tieni** | TanStack Query è compatibile RN |
| `src/lib/mock-data.ts` | **Tieni** | Contiene i tipi TypeScript che servono |
| `src/lib/supabase.ts` | **Modifica** | `import.meta.env` → `expo-constants` + `AsyncStorage` |
| `src/lib/app-store.tsx` | **Modifica** | Aggiungere persistenza con `AsyncStorage` |
| `src/lib/status-config.ts` | **Modifica** | `lucide-react` → `lucide-react-native`, classi CSS → colori hex |
| `src/lib/utils.ts` | **Modifica** | Rimuovere `tailwind-merge` (non serve in RN) |
| `src/components/` | **Elimina** | Tutti i componenti web (HTML/Tailwind) non funzionano in RN |
| `src/routes/` | **Elimina** | Sostituita da `app/` (Expo Router) |
| `src/hooks/use-mobile.tsx` | **Elimina** | Non ha senso in un'app solo mobile |
| `src/server.ts` | **Elimina** | Web server SSR, non esiste in RN |
| `src/start.ts` | **Elimina** | Entry point web |
| `src/styles.css` | **Elimina** | Tailwind web, non serve in RN |
| `src/router.tsx` | **Elimina** | TanStack Router web |
| `src/routeTree.gen.ts` | **Elimina** | Auto-generato da TanStack Router |
| `src/lib/error-capture.ts` | **Elimina** | SSR-specific |
| `src/lib/error-page.ts` | **Elimina** | SSR-specific |
| `vite.config.ts` | **Elimina** | Sostituito da `metro.config.js` |
| `wrangler.jsonc` | **Elimina** | Cloudflare Workers, non serve |
| `scripts/` | **Elimina** | Script build Vercel |
| `.vercel/` | **Elimina** | Config deploy web |
| `package.json` | **Sostituisci** | Dipendenze web → dipendenze Expo |
| `tsconfig.json` | **Sostituisci** | Config TypeScript web → Expo |

---

## TASK 1 — Pulizia: eliminare il codice web
> Prima di aggiungere qualcosa, si rimuove tutto quello che non serve.

- [ ] **1.1 Eliminare file di configurazione web dalla root**
  - [ ] Eliminare `vite.config.ts`
  - [ ] Eliminare `wrangler.jsonc`
  - [ ] Eliminare `index.html`
  - [ ] Eliminare cartella `scripts/`
  - [ ] Eliminare cartella `.vercel/` (se presente)
  - [ ] Eliminare cartella `.wrangler/` (se presente)
  - [ ] Eliminare cartella `.lovable/` (se presente)

- [ ] **1.2 Eliminare file sorgente web**
  - [ ] Eliminare `src/routes/` (intera cartella — 9 file)
  - [ ] Eliminare `src/components/` (intera cartella — tutti i componenti web)
  - [ ] Eliminare `src/server.ts`
  - [ ] Eliminare `src/start.ts`
  - [ ] Eliminare `src/styles.css`
  - [ ] Eliminare `src/router.tsx`
  - [ ] Eliminare `src/routeTree.gen.ts`
  - [ ] Eliminare `src/hooks/use-mobile.tsx`
  - [ ] Eliminare `src/lib/error-capture.ts`
  - [ ] Eliminare `src/lib/error-page.ts`

---

## TASK 2 — Setup Expo nella cartella esistente
> Configurare il progetto come app Expo senza creare una nuova cartella.

- [ ] **2.1 Sostituire `package.json`**
  - [ ] Rimuovere tutte le dipendenze web (Vite, TanStack Start, TanStack Router, Radix UI, Tailwind, shadcn, ecc.)
  - [ ] Aggiungere dipendenze Expo:
    ```json
    "expo": "~56.0.0",
    "expo-router": "~56.2.0",
    "expo-constants": "~17.0.0",
    "expo-font": "~13.0.0",
    "expo-image": "~2.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-status-bar": "~2.2.0",
    "expo-haptics": "~14.0.0",
    "expo-notifications": "~0.31.0",
    "react-native": "0.76.9",
    "react-native-safe-area-context": "^4.14.0",
    "react-native-screens": "^4.4.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.21.0",
    "@gorhom/bottom-sheet": "^5.1.0",
    "@react-native-async-storage/async-storage": "^2.1.0",
    "react-native-url-polyfill": "^2.0.0",
    "@supabase/supabase-js": "^2.105.4",
    "@tanstack/react-query": "^5.83.0",
    "react-hook-form": "^7.71.2",
    "zod": "^3.24.2",
    "@hookform/resolvers": "^5.2.2",
    "date-fns": "^4.1.0",
    "lucide-react-native": "^0.475.0",
    "react-native-calendars": "^1.1310.0",
    "react-native-toast-message": "^2.2.0",
    "@react-native-community/netinfo": "^11.4.0",
    "@react-native-community/datetimepicker": "^8.4.0"
    ```
  - [ ] Aggiornare gli script:
    ```json
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios"
    ```

- [ ] **2.2 Creare `app.json`**
  ```json
  {
    "expo": {
      "name": "CedEasy",
      "slug": "cedeasy",
      "version": "1.0.0",
      "scheme": "cedeasy",
      "platforms": ["ios", "android"],
      "ios": { "supportsTablet": false, "bundleIdentifier": "com.cedeasy.app" },
      "android": { "package": "com.cedeasy.app", "adaptiveIcon": { "backgroundColor": "#ffffff" } },
      "plugins": ["expo-router", "expo-font"]
    }
  }
  ```

- [ ] **2.3 Creare `babel.config.js`**
  ```js
  module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: ['react-native-reanimated/plugin'],
    };
  };
  ```

- [ ] **2.4 Creare `metro.config.js`**
  ```js
  const { getDefaultConfig } = require('expo/metro-config');
  module.exports = getDefaultConfig(__dirname);
  ```

- [ ] **2.5 Sostituire `tsconfig.json`**
  ```json
  {
    "extends": "expo/tsconfig.base",
    "compilerOptions": {
      "strict": true,
      "paths": { "@/*": ["./*"] }
    }
  }
  ```

- [ ] **2.6 Aggiornare `.env`**
  - [ ] Rinominare `VITE_SUPABASE_URL` → `EXPO_PUBLIC_SUPABASE_URL`
  - [ ] Rinominare `VITE_SUPABASE_ANON_KEY` → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

- [ ] **2.7 Installare le dipendenze**
  ```bash
  npm install
  ```

---

## TASK 3 — Migrazione della libreria esistente
> Adattare i file `src/lib/` che si tengono ma richiedono modifiche.

- [ ] **3.1 Modificare `src/lib/supabase.ts`**
  - [ ] Sostituire `import.meta.env.VITE_*` con `process.env.EXPO_PUBLIC_*`
  - [ ] Aggiungere import di `AsyncStorage` e `react-native-url-polyfill`
  - [ ] Aggiungere opzione `auth: { storage: AsyncStorage, autoRefreshToken: true, detectSessionInUrl: false }`
  - Risultato:
    ```ts
    import 'react-native-url-polyfill/auto'
    import AsyncStorage from '@react-native-async-storage/async-storage'
    import { createClient } from '@supabase/supabase-js'

    export const supabase = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { storage: AsyncStorage, autoRefreshToken: true, detectSessionInUrl: false } }
    )
    ```

- [ ] **3.2 Modificare `src/lib/app-store.tsx`**
  - [ ] Nessuna modifica necessaria alla logica esistente — funziona già in React Native
  - [ ] Aggiungere persistenza del `role` su `AsyncStorage` (opzionale, per non perdere il ruolo al riavvio)

- [ ] **3.3 Modificare `src/lib/status-config.ts`**
  - [ ] Sostituire `import ... from "lucide-react"` con `import ... from "lucide-react-native"`
  - [ ] Rimuovere `dotClass` e `badgeClass` (classi CSS Tailwind — non funzionano in RN)
  - [ ] Aggiungere `dotColor` (hex string) e `badgeColor` / `badgeTextColor` (hex strings)
  - Risultato dei nuovi campi:
    ```ts
    draft:             { dotColor: '#94a3b8', badgeColor: '#f1f5f9', badgeTextColor: '#475569' }
    pending:           { dotColor: '#f59e0b', badgeColor: '#fffbeb', badgeTextColor: '#b45309' }
    changes_requested: { dotColor: '#f43f5e', badgeColor: '#fff1f2', badgeTextColor: '#be123c' }
    approved:          { dotColor: '#10b981', badgeColor: '#ecfdf5', badgeTextColor: '#047857' }
    ```

- [ ] **3.4 Modificare `src/lib/utils.ts`**
  - [ ] Rimuovere `tailwind-merge` e `clsx` (web-only)
  - [ ] Mantenere eventuali utility pure (funzioni che non dipendono dal DOM/CSS)

- [ ] **3.5 `src/lib/queries.ts` — nessuna modifica**
  - [ ] Verificare che tutti gli import da `mock-data.ts` (tipi) siano ancora validi
  - [ ] File funziona identico in React Native ✓

- [ ] **3.6 `src/lib/supabase/` (4 file) — nessuna modifica**
  - [ ] `brands.ts` ✓
  - [ ] `posts.ts` ✓
  - [ ] `profiles.ts` ✓
  - [ ] `comments.ts` ✓

---

## TASK 4 — Struttura navigazione con Expo Router
> Creare la cartella `app/` con il sistema di routing file-based.

- [ ] **4.1 Creare `app/_layout.tsx` (Root Layout)**
  - [ ] Caricare font Inter con `expo-font`
  - [ ] Gestire splash screen con `expo-splash-screen`
  - [ ] Avvolgere con `QueryClientProvider` (TanStack Query)
  - [ ] Avvolgere con `AppStoreProvider`
  - [ ] Avvolgere con `GestureHandlerRootView` (obbligatorio per @gorhom/bottom-sheet)
  - [ ] Avvolgere con `BottomSheetModalProvider`
  - [ ] Controllare sessione Supabase al mount → redirect automatico
  - [ ] Registrare `Toast` component di react-native-toast-message

- [ ] **4.2 Creare `app/(auth)/_layout.tsx`**
  - [ ] Stack navigator senza header visibile
  - [ ] Accessibile solo se non autenticati

- [ ] **4.3 Creare `app/(auth)/login.tsx`** (schermata vuota per ora — riempita in Task 6)

- [ ] **4.4 Creare `app/(auth)/register.tsx`** (schermata vuota per ora)

- [ ] **4.5 Creare `app/(smm)/_layout.tsx`**
  - [ ] Tab Navigator con 3 tab: Feed, Clienti, Profilo
  - [ ] Icone tab con `lucide-react-native`
  - [ ] Accessibile solo se autenticati e `role === 'smm'`

- [ ] **4.6 Creare `app/(smm)/index.tsx`** (schermata vuota per ora)

- [ ] **4.7 Creare `app/(smm)/brands/index.tsx`** (schermata vuota per ora)

- [ ] **4.8 Creare `app/(smm)/brands/[brandId].tsx`** (schermata vuota per ora)

- [ ] **4.9 Creare `app/(client)/_layout.tsx`**
  - [ ] Tab Navigator con 2 tab: Da Approvare, Approvati
  - [ ] Accessibile solo se autenticati e `role === 'client'`

- [ ] **4.10 Creare `app/(client)/index.tsx`** (schermata vuota per ora)

- [ ] **4.11 Creare `app/(client)/approved.tsx`** (schermata vuota per ora)

- [ ] **4.12 Verificare che `expo start` avvii senza errori**
  - [ ] App si apre su Expo Go (Android fisico o emulatore)
  - [ ] Navigazione tra tab funziona
  - [ ] Nessun crash al mount

---

## TASK 5 — Componenti UI base
> Design system in React Native. Costruire prima questi, poi usarli nelle schermate.

- [ ] **5.1 Setup tema colori**
  - [ ] Creare `constants/colors.ts` con la palette completa (stessi valori del CSS del web, convertiti in hex)
    ```ts
    export const colors = {
      primary: '#7c3aed',
      background: '#ffffff',
      card: '#f8fafc',
      border: '#e2e8f0',
      text: { primary: '#0f172a', secondary: '#64748b', muted: '#94a3b8' },
      status: {
        draft:    { dot: '#94a3b8', bg: '#f1f5f9', text: '#475569' },
        pending:  { dot: '#f59e0b', bg: '#fffbeb', text: '#b45309' },
        changes:  { dot: '#f43f5e', bg: '#fff1f2', text: '#be123c' },
        approved: { dot: '#10b981', bg: '#ecfdf5', text: '#047857' },
      }
    }
    ```
  - [ ] Creare `constants/typography.ts` (font sizes e weights)
  - [ ] Creare `constants/spacing.ts` (spacing scale)

- [ ] **5.2 `components/ui/Button.tsx`**
  - [ ] Varianti: `primary`, `secondary`, `ghost`, `destructive`
  - [ ] Stato `loading` (spinner al posto del testo)
  - [ ] Stato `disabled`
  - [ ] Pressable con feedback visivo (`activeOpacity`)

- [ ] **5.3 `components/ui/Input.tsx`**
  - [ ] Prop `label` sopra il campo
  - [ ] Prop `error` per messaggio di errore in rosso sotto
  - [ ] Prop `secureTextEntry` con toggle visibilità password
  - [ ] Stile coerente con il tema

- [ ] **5.4 `components/ui/Textarea.tsx`**
  - [ ] Multiline con `numberOfLines` e altezza minima
  - [ ] Stessa API di `Input.tsx`

- [ ] **5.5 `components/ui/Card.tsx`**
  - [ ] Contenitore con `borderRadius`, `shadow` e `backgroundColor`

- [ ] **5.6 `components/ui/Badge.tsx`**
  - [ ] Accetta `status: VisualStatus` da `status-config.ts`
  - [ ] Mostra pallino colorato + etichetta
  - [ ] Usa i colori da `constants/colors.ts`

- [ ] **5.7 `components/ui/Avatar.tsx`**
  - [ ] Cerchio colorato con le iniziali del nome

- [ ] **5.8 `components/ui/EmptyState.tsx`**
  - [ ] Icona + titolo + testo descrittivo
  - [ ] Usato quando una lista è vuota

- [ ] **5.9 `components/ui/SkeletonLoader.tsx`**
  - [ ] Rettangolo grigio animato (fade in/out con `Animated`)
  - [ ] Usato come placeholder durante il caricamento

- [ ] **5.10 `components/ui/BottomSheet.tsx`**
  - [ ] Wrapper di `@gorhom/bottom-sheet`
  - [ ] Prop `snapPoints`, `onClose`
  - [ ] Usato per tutti i form e i dettagli

---

## TASK 6 — Autenticazione
> Login, registrazione, gestione sessione, redirect automatici.

- [ ] **6.1 `app/(auth)/login.tsx`**
  - [ ] Logo / titolo app in cima
  - [ ] Campo email (`keyboardType="email-address"`)
  - [ ] Campo password con toggle visibilità
  - [ ] Bottone "Accedi" → `supabase.auth.signInWithPassword()`
  - [ ] Validazione con Zod (copiare schema da `src/routes/login.tsx`)
  - [ ] Toast di errore su credenziali errate
  - [ ] Redirect a `/(smm)` o `/(client)` in base al ruolo (leggere `profiles` dopo login)
  - [ ] Link "Non hai un account? Registrati" → `/(auth)/register`

- [ ] **6.2 `app/(auth)/register.tsx`**
  - [ ] Selezione ruolo (SMM / Cliente) come primo step — due card selezionabili
  - [ ] Campi: nome completo, email, password, conferma password
  - [ ] Se Cliente: campo Brand ID (fornito dall'SMM)
  - [ ] Validazione Zod (copiare schema da `src/routes/register.tsx`)
  - [ ] Chiamata `supabase.auth.signUp()` + `upsertProfile()`
  - [ ] Toast di conferma → redirect a login

- [ ] **6.3 Gestione sessione in `app/_layout.tsx`**
  - [ ] Al mount: `supabase.auth.getSession()` → redirect alla schermata giusta
  - [ ] Listener `onAuthStateChange` → aggiorna `userId` in AppStore
  - [ ] Redirect automatico a `/(auth)/login` se sessione assente
  - [ ] Redirect automatico a dashboard se sessione già presente

- [ ] **6.4 Logout**
  - [ ] Funzione `logout`: `supabase.auth.signOut()` + pulire AsyncStorage + redirect a login
  - [ ] Bottone logout nella tab Profilo (SMM)

---

## TASK 7 — Area SMM: Dashboard e Brand

- [ ] **7.1 `components/ActivityCard.tsx`**
  - [ ] Card compatta con: icona piattaforma, nome brand, titolo post, Badge status, data relativa
  - [ ] `onPress` → apre dettaglio post

- [ ] **7.2 `app/(smm)/index.tsx` — Dashboard**
  - [ ] Header con nome utente e avatar
  - [ ] Sezione contatori: card Draft / In approvazione / Approvati (3 box in riga)
  - [ ] Lista `useRecentActivities()` → `ActivityCard` per ogni item
  - [ ] Pull-to-refresh (`RefreshControl` su `ScrollView`)
  - [ ] `SkeletonLoader` durante il primo caricamento
  - [ ] `EmptyState` se nessuna attività recente

- [ ] **7.3 `components/BrandCard.tsx`**
  - [ ] Card con: nome brand, categoria, nome cliente
  - [ ] Contatore post in attesa (badge rosso)
  - [ ] `onPress` → naviga a `/(smm)/brands/[brandId]`

- [ ] **7.4 `app/(smm)/brands/index.tsx` — Lista Brand**
  - [ ] `TextInput` search bar in cima
  - [ ] `FlatList` di `BrandCard` usando `useBrands()`
  - [ ] Filtro per nome in locale (no query aggiuntiva)
  - [ ] FAB "+" in basso a destra → apre bottom sheet "Crea Brand"
  - [ ] Pull-to-refresh
  - [ ] `EmptyState` se nessun brand

- [ ] **7.5 `components/CreateBrandSheet.tsx`** (bottom sheet)
  - [ ] Campi: nome, categoria, nome cliente, email, telefono
  - [ ] Sezione social collassabile: Instagram, TikTok, Facebook, LinkedIn, Telegram
  - [ ] Validazione Zod
  - [ ] `useCreateBrand()` al submit
  - [ ] Chiude il bottom sheet e aggiorna la lista

- [ ] **7.6 `components/PostCard.tsx`** (React Native)
  - [ ] Titolo, piattaforma (icona), data programmata, `Badge` status
  - [ ] `onPress` → apre `PostDetailSheet`

- [ ] **7.7 `app/(smm)/brands/[brandId].tsx` — Dettaglio Brand**
  - [ ] Header con nome brand + bottone modifica
  - [ ] Toggle Vista Calendario / Vista Lista
  - [ ] **Vista Lista:** `FlatList` di `PostCard` usando `usePosts(brandId)`
    - [ ] Chip filtro status scorrevoli orizzontalmente
  - [ ] **Vista Calendario:** `react-native-calendars` con `markedDates`
    - [ ] Puntini colorati sui giorni con post programmati (colore = status)
    - [ ] Tap su giorno → filtra la lista sotto
  - [ ] FAB "+" → apre `CreatePostSheet`
  - [ ] Pull-to-refresh

---

## TASK 8 — Area SMM: Gestione Post

- [ ] **8.1 `components/CreatePostSheet.tsx`** (bottom sheet)
  - [ ] Campi: titolo, caption/contenuto, piattaforma (Post/Reel/Carosello/Story — segmented control)
  - [ ] Date picker per data: `@react-native-community/datetimepicker`
  - [ ] Time picker per ora
  - [ ] Campo note interne (opzionale)
  - [ ] Campo link media (URL testuale)
  - [ ] Due bottoni: "Salva bozza" (status DRAFT) e "Invia per approvazione" (status REVISION_REQUESTED)
  - [ ] Validazione Zod
  - [ ] `useCreatePost()` al submit

- [ ] **8.2 `components/PostDetailSheet.tsx`** (bottom sheet — vista SMM)
  - [ ] Header con titolo e `Badge` status
  - [ ] Caption completa (scrollabile)
  - [ ] Piattaforma, data programmata
  - [ ] Note interne (solo SMM)
  - [ ] Se `CHANGES_REQUESTED`: riquadro arancio con il feedback del cliente
  - [ ] Sezione commenti (Task 10)
  - [ ] Azioni in fondo:
    - [ ] "Modifica" → apre `CreatePostSheet` pre-compilato
    - [ ] "Elimina" → alert di conferma → `useDeletePost()`
    - [ ] "Invia per approvazione" (se in bozza) → `useUpdatePostStatus()`

---

## TASK 9 — Area Client

- [ ] **9.1 `components/PostClientCard.tsx`** (React Native)
  - [ ] Titolo, piattaforma, data programmata, anteprima caption (max 2 righe)
  - [ ] `Badge` status
  - [ ] `onPress` → apre `PostClientDetailSheet`

- [ ] **9.2 `app/(client)/index.tsx` — Post da approvare**
  - [ ] Header con nome brand del cliente
  - [ ] Lista `useClientPosts()` filtrata su status `REVISION_REQUESTED`
  - [ ] `PostClientCard` per ogni post
  - [ ] `EmptyState`: "Nessun post in attesa di approvazione"
  - [ ] Pull-to-refresh

- [ ] **9.3 `app/(client)/approved.tsx` — Post approvati**
  - [ ] Lista post con status `APPROVED` / `PUBLISHED`
  - [ ] Filtro per mese (chip scorrevoli orizzontalmente)
  - [ ] `PostClientCard` in modalità read-only
  - [ ] `EmptyState`: "Nessun post approvato"
  - [ ] Pull-to-refresh

- [ ] **9.4 `components/PostClientDetailSheet.tsx`** (bottom sheet — vista Client)
  - [ ] Titolo, piattaforma, data programmata
  - [ ] Caption completa scrollabile
  - [ ] Link media → bottone "Vedi media" che apre il browser (`Linking.openURL`)
  - [ ] Sezione commenti (Task 10)
  - [ ] Due bottoni azione (solo se status `REVISION_REQUESTED`):
    - [ ] **"Approva"** (verde) → alert di conferma → `useUpdatePostStatus(APPROVED)`
    - [ ] **"Richiedi modifiche"** (rosso) → apre `TextInput` per il feedback → `useUpdatePostStatus(CHANGES_REQUESTED, feedback)`
  - [ ] Haptic feedback su approvazione: `expo-haptics`

---

## TASK 10 — Commenti

- [ ] **10.1 `components/CommentThread.tsx`**
  - [ ] `FlatList` di bubble commenti
  - [ ] Bubble SMM allineata a destra (bg primario), Cliente a sinistra (bg grigio)
  - [ ] Testo + timestamp per ogni commento
  - [ ] Autoscroll all'ultimo commento al mount e su nuovo messaggio
  - [ ] Usa `useComments(postId)`

- [ ] **10.2 `components/CommentInput.tsx`**
  - [ ] `TextInput` fisso in basso
  - [ ] `KeyboardAvoidingView` per spostarlo sopra la tastiera
  - [ ] Bottone "Invia"
  - [ ] Ottimistic update: aggiunge il commento subito nella lista prima della risposta server
  - [ ] Usa `useAddComment()`

- [ ] **10.3 Integrare i commenti nei bottom sheet**
  - [ ] Aggiungere `CommentThread` + `CommentInput` in `PostDetailSheet`
  - [ ] Aggiungere `CommentThread` + `CommentInput` in `PostClientDetailSheet`

---

## TASK 11 — Schermata Profilo e Logout

- [ ] **11.1 `app/(smm)/profile.tsx`**
  - [ ] Avatar con iniziali + nome completo + email
  - [ ] Bottone "Esci" → chiama `logout()` (Task 6.4)

---

## TASK 12 — Ottimizzazioni finali

- [ ] **12.1 Offline handling**
  - [ ] Installare `@react-native-community/netinfo`
  - [ ] Banner "Sei offline" in cima quando non c'è connessione

- [ ] **12.2 `QueryClient` ottimizzato per React Native**
  - [ ] Aggiungere `focusManager.setEventListener` con `AppState` listener
    ```ts
    focusManager.setEventListener(onFocus => {
      const sub = AppState.addEventListener('change', state => {
        onFocus(state === 'active')
      })
      return () => sub.remove()
    })
    ```

- [ ] **12.3 Assets minimi per avviare**
  - [ ] Icona placeholder in `assets/icon.png` (1024x1024px)
  - [ ] Splash screen placeholder in `assets/splash.png`

---

## Riepilogo Timeline

| Task | Descrizione | Tempo stimato |
|------|-------------|---------------|
| 1 | Pulizia file web | 30 min |
| 2 | Setup Expo (config, package.json, tsconfig) | 1-2 ore |
| 3 | Migrazione lib esistente | 1 ora |
| 4 | Struttura navigazione + verifica avvio | 2-3 ore |
| 5 | Componenti UI base | 1 giorno |
| 6 | Autenticazione completa | 1 giorno |
| 7 | Area SMM — Dashboard e Brand | 2 giorni |
| 8 | Area SMM — Gestione Post | 2 giorni |
| 9 | Area Client | 1 giorno |
| 10 | Commenti | 4 ore |
| 11 | Profilo e Logout | 1 ora |
| 12 | Ottimizzazioni | 2 ore |
| **Totale** | | **~8-9 giorni lavorativi** |

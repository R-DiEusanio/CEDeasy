# Piano d'Azione — CedEasy Mobile (React Native + Expo)

> **Stack:** React Native 0.76 + Expo SDK 53 + Expo Router + Supabase + TanStack Query  
> **Target:** App Store (iOS 16+) + Google Play Store (Android 8+)  
> **Durata stimata:** ~10 settimane

---

## TASK 1 — Setup Progetto e Infrastruttura
> Prerequisito per tutto il resto. Non iniziare il Task 2 finché questo non è completo.

- [ ] **1.1 Account e Licenze**
  - [ ] Creare account **Apple Developer Program** su developer.apple.com ($99/anno)
  - [ ] Creare account **Google Play Console** su play.google.com/console ($25)
  - [ ] Verificare che entrambi gli account siano attivi (Apple può richiedere 24-48h)

- [ ] **1.2 Ambiente di sviluppo**
  - [ ] Installare **Android Studio** + Android SDK (API 26+) — per build e emulatore Android in locale
  - [ ] Installare **Expo CLI**: `npm install -g @expo/cli`
  - [ ] Installare **EAS CLI**: `npm install -g eas-cli`
  - [ ] Installare **Expo Go** su un iPhone e un Android fisici per testing rapido
  - > **Nota iOS senza Mac:** Non serve Xcode. Le build iOS vengono compilate sui server Mac di Expo tramite **EAS Build** (cloud). Il workflow è: scrivi codice su Windows → `eas build --platform ios` → Expo compila in cloud → scarichi l'IPA già firmato. Per testare su iPhone durante lo sviluppo, usa Expo Go o una EAS development build installata via link OTA.

- [ ] **1.3 Creazione progetto**
  - [ ] Creare il repo: `npx create-expo-app cedeasy-mobile --template tabs`
  - [ ] Inizializzare git e configurare `.gitignore`
  - [ ] Configurare path alias in `tsconfig.json` (`@/` → `./`)
  - [ ] Installare tutte le dipendenze (vedi lista sotto)

- [ ] **1.4 Configurazione Expo (`app.json`)**
  - [ ] Impostare `name: "CedEasy"`, `slug: "cedeasy"`
  - [ ] Impostare `bundleIdentifier: "com.cedeasy.app"` (iOS)
  - [ ] Impostare `package: "com.cedeasy.app"` (Android)
  - [ ] Aggiungere placeholder icona app (1024x1024px) e splash screen
  - [ ] Configurare `scheme` per deep linking (`cedeasy://`)
  - [ ] Impostare versioni minime: `ios.minimumOsVersion: "16.0"`, `android.minSdkVersion: 26`

- [ ] **1.5 Configurazione EAS Build (`eas.json`)**
  - [ ] Creare profilo `development` (build con dev client per testing)
  - [ ] Creare profilo `preview` (build interna per QA via TestFlight / Play Internal)
  - [ ] Creare profilo `production` (build finale per gli store)
  - [ ] Collegare EAS al progetto: `eas init`

- [ ] **1.6 Variabili d'ambiente**
  - [ ] Installare `expo-constants`
  - [ ] Creare `app.config.ts` (invece di `app.json`) per iniettare env vars
  - [ ] Copiare `SUPABASE_URL` e `SUPABASE_ANON_KEY` dal progetto web
  - [ ] Configurare `.env` locale + variabili su EAS Secrets per le build CI

- [ ] **1.7 Struttura cartelle**
  ```
  cedeasy-mobile/
  ├── app/             # Expo Router (schermate)
  ├── components/      # Componenti UI riutilizzabili
  ├── lib/             # Supabase, query, utils
  ├── hooks/           # Custom hooks
  ├── constants/       # Colori, dimensioni, temi
  └── assets/          # Icone, immagini, font
  ```

---

## TASK 2 — Supabase e Stato Globale
> Copia la logica dal progetto web con minime modifiche.

- [ ] **2.1 Client Supabase**
  - [ ] Installare `@supabase/supabase-js` e `@react-native-async-storage/async-storage`
  - [ ] Installare `react-native-url-polyfill`
  - [ ] Creare `lib/supabase/client.ts`:
    ```ts
    import AsyncStorage from '@react-native-async-storage/async-storage'
    import 'react-native-url-polyfill/auto'
    createClient(url, key, { auth: { storage: AsyncStorage, autoRefreshToken: true } })
    ```
  - [ ] Verificare che la connessione funzioni (test query su brands)

- [ ] **2.2 Copiare le query dal progetto web**
  - [ ] Copiare `lib/supabase/brands.ts` — nessuna modifica necessaria
  - [ ] Copiare `lib/supabase/posts.ts` + mappatura status — nessuna modifica necessaria
  - [ ] Copiare `lib/supabase/profiles.ts` — nessuna modifica necessaria
  - [ ] Copiare `lib/supabase/comments.ts` — nessuna modifica necessaria
  - [ ] Copiare tutte le definizioni TypeScript (tipi e interfacce)

- [ ] **2.3 TanStack Query**
  - [ ] Installare `@tanstack/react-query`
  - [ ] Configurare `QueryClient` con `focusManager` per React Native:
    ```ts
    focusManager.setEventListener(onFocus => AppState listener)
    ```
  - [ ] Avvolgere il root layout con `QueryClientProvider`

- [ ] **2.4 AppStore Context**
  - [ ] Creare `lib/store.ts` (adattare dal web: rimuovere logica browser)
  - [ ] Persistere `role` e `activeBrandId` su `AsyncStorage`
  - [ ] Avvolgere il root layout con il provider

---

## TASK 3 — Autenticazione
> Flusso completo login → redirect per ruolo → logout.

- [ ] **3.1 Schermata Login (`app/(auth)/login.tsx`)**
  - [ ] Layout con logo CedEasy + form
  - [ ] Campo email (keyboard type `email-address`)
  - [ ] Campo password (secure text entry + toggle visibilità)
  - [ ] Validazione con Zod (copiare schema dal web)
  - [ ] Chiamata `supabase.auth.signInWithPassword()`
  - [ ] Toast di errore su credenziali errate
  - [ ] Redirect a `/(smm)` o `/(client)` in base al ruolo
  - [ ] Link a schermata Registrazione

- [ ] **3.2 Schermata Registrazione (`app/(auth)/register.tsx`)**
  - [ ] Selezione ruolo (SMM / Cliente) come primo step
  - [ ] Campi: nome completo, email, password, conferma password
  - [ ] Se Cliente: campo per inserire il Brand ID fornito dall'SMM
  - [ ] Validazione Zod (copiare schema dal web)
  - [ ] Chiamata `supabase.auth.signUp()` + `upsertProfile()`
  - [ ] Redirect a Login dopo registrazione
  - [ ] Toast di conferma

- [ ] **3.3 Gestione sessione**
  - [ ] Root layout controlla la sessione all'avvio (`supabase.auth.getSession()`)
  - [ ] Listener `onAuthStateChange` per refresh automatico token
  - [ ] Redirect automatico `/` → `/(auth)/login` se non autenticato
  - [ ] Redirect automatico `/(auth)/*` → dashboard se già autenticato
  - [ ] Implementare logout: `supabase.auth.signOut()` + pulire AsyncStorage + redirect login

---

## TASK 4 — Componenti UI Base
> La "design system" dell'app. Costruire prima questi, poi usarli ovunque.

- [ ] **4.1 Configurazione tema**
  - [ ] Installare `expo-font` e caricare **Inter** (400, 500, 600, 700)
  - [ ] Creare `constants/colors.ts` con tutti i colori (replicare CSS custom properties del web in hex/rgba)
  - [ ] Creare `constants/spacing.ts` e `constants/typography.ts`
  - [ ] Configurare **NativeWind v4** (`npm install nativewind tailwindcss`) per usare classi Tailwind in RN

- [ ] **4.2 Componenti atomici**
  - [ ] `components/ui/Button.tsx` — varianti: primary, secondary, ghost, destructive; stati: loading, disabled
  - [ ] `components/ui/Input.tsx` — label, placeholder, error message, secure entry
  - [ ] `components/ui/Textarea.tsx` — multiline con altezza dinamica
  - [ ] `components/ui/Card.tsx` — contenitore con shadow e bordo
  - [ ] `components/ui/Badge.tsx` — status post (draft=grigio, pending=giallo, approved=verde, changes=rosso)
  - [ ] `components/ui/Avatar.tsx` — iniziali del nome su cerchio colorato
  - [ ] `components/ui/Divider.tsx`
  - [ ] `components/ui/Spinner.tsx` — loading indicator

- [ ] **4.3 Componenti di feedback**
  - [ ] Installare `react-native-toast-message` e configurare nel root layout
  - [ ] `components/ui/EmptyState.tsx` — icona + testo quando lista è vuota
  - [ ] `components/ui/ErrorState.tsx` — errore con bottone retry
  - [ ] `components/ui/SkeletonLoader.tsx` — placeholder durante caricamento

- [ ] **4.4 Componenti di navigazione**
  - [ ] Installare `@gorhom/bottom-sheet` + `react-native-gesture-handler` + `react-native-reanimated`
  - [ ] `components/ui/BottomSheet.tsx` — wrapper riutilizzabile per modali/form
  - [ ] `components/ui/Header.tsx` — header schermata con titolo e azioni opzionali

---

## TASK 5 — Navigazione e Layout
> Struttura route con Expo Router (file-based, simile a TanStack Router).

- [ ] **5.1 Root Layout (`app/_layout.tsx`)**
  - [ ] Avvolgere con `QueryClientProvider`, `AppStoreProvider`, `GestureHandlerRootView`, `BottomSheetModalProvider`
  - [ ] Caricare font con `expo-font`
  - [ ] Gestire splash screen con `expo-splash-screen`
  - [ ] Controllo auth + redirect al mount

- [ ] **5.2 Layout area SMM (`app/(smm)/_layout.tsx`)**
  - [ ] Tab Navigator con 3 tab: **Feed** (home), **Clienti** (brands), **Profilo**
  - [ ] Icone tab con `lucide-react-native`
  - [ ] Badge notifica su tab Feed (post in attesa)

- [ ] **5.3 Layout area Client (`app/(client)/_layout.tsx`)**
  - [ ] Tab Navigator con 2 tab: **Da Approvare**, **Approvati**
  - [ ] Badge count sui post in attesa di approvazione

- [ ] **5.4 Layout area Auth (`app/(auth)/_layout.tsx`)**
  - [ ] Stack navigator senza header
  - [ ] Sfondo e stili condivisi tra login e register

---

## TASK 6 — Area SMM
> Flusso principale per il Social Media Manager.

- [ ] **6.1 Dashboard / Feed (`app/(smm)/index.tsx`)**
  - [ ] Header con nome utente e avatar
  - [ ] Sezione "Riepilogo" — contatori post per status (draft, pending, approved)
  - [ ] Lista "Attività recente" — ultimi post aggiornati su tutti i brand
    - [ ] Card attività con: nome brand, titolo post, status badge, data
    - [ ] Tap sulla card → apre dettaglio post
  - [ ] Pull-to-refresh
  - [ ] Skeleton loading

- [ ] **6.2 Lista Brand (`app/(smm)/brands/index.tsx`)**
  - [ ] Search bar per filtrare brand per nome
  - [ ] FlatList di card brand
    - [ ] Nome brand, categoria, nome cliente
    - [ ] Contatore post in attesa di revisione
    - [ ] Tap → dettaglio brand
  - [ ] Bottone FAB (Floating Action Button) "+" → crea nuovo brand
  - [ ] Pull-to-refresh

- [ ] **6.3 Form Crea/Modifica Brand (bottom sheet)**
  - [ ] Campi: nome brand, categoria, nome cliente, email, telefono
  - [ ] Campi social (Instagram, TikTok, Facebook, ecc.) — collassabili
  - [ ] Validazione Zod
  - [ ] Salvataggio su Supabase
  - [ ] Aggiornamento automatico lista (React Query invalidation)

- [ ] **6.4 Dettaglio Brand (`app/(smm)/brands/[brandId].tsx`)**
  - [ ] Header con nome brand e azioni (modifica, info)
  - [ ] **Vista Calendario** — `react-native-calendars`
    - [ ] Installare `react-native-calendars`
    - [ ] Puntini colorati sui giorni con post programmati
    - [ ] Tap su giorno → mostra post di quel giorno
  - [ ] **Vista Lista** — FlatList con tutti i post del brand
    - [ ] Filtri per status (chip scrollabili orizzontalmente)
    - [ ] Card post con: titolo, piattaforma, data, status badge
  - [ ] Toggle calendario/lista
  - [ ] Bottone FAB "+" → crea nuovo post per questo brand

- [ ] **6.5 Form Crea/Modifica Post (bottom sheet)**
  - [ ] Campi: titolo, contenuto/caption, piattaforma (Post/Reel/Carosello/Story)
  - [ ] Date picker per data programmata (`@react-native-community/datetimepicker`)
  - [ ] Time picker per ora programmata
  - [ ] Note interne (campo opzionale)
  - [ ] Link media (campo testo URL)
  - [ ] Selezione status iniziale (Draft / Invia per revisione)
  - [ ] Validazione Zod
  - [ ] Salva come bozza / Invia per approvazione

- [ ] **6.6 Dettaglio Post (bottom sheet o schermata)**
  - [ ] Visualizzazione completa: titolo, caption, piattaforma, data, status
  - [ ] Note interne (solo SMM)
  - [ ] Sezione feedback dal cliente (se presente)
  - [ ] Sezione commenti (thread)
  - [ ] Azioni: Modifica, Elimina, Cambia status
  - [ ] Se status è CHANGES_REQUESTED: highlight del feedback cliente

---

## TASK 7 — Area Client
> Flusso per il cliente che approva i contenuti.

- [ ] **7.1 Dashboard — Post da Approvare (`app/(client)/index.tsx`)**
  - [ ] Header con nome brand del cliente
  - [ ] Lista post con status REVISION_REQUESTED
  - [ ] Card post: titolo, piattaforma, data programmata, anteprima caption
  - [ ] Tap → apre dettaglio post con azioni di approvazione
  - [ ] Stato vuoto: "Nessun post in attesa di approvazione"
  - [ ] Pull-to-refresh

- [ ] **7.2 Post Approvati (`app/(client)/approved.tsx`)**
  - [ ] Lista post con status APPROVED e PUBLISHED
  - [ ] Filtro per mese
  - [ ] Card post con data pubblicazione e piattaforma
  - [ ] Tap → apre dettaglio (read-only)
  - [ ] Pull-to-refresh

- [ ] **7.3 Dettaglio Post per Client (bottom sheet)**
  - [ ] Titolo, piattaforma, data programmata
  - [ ] Caption completa (testo scorrevole)
  - [ ] Link media (bottone "Vedi media" se presente)
  - [ ] Thread commenti (lettura + scrittura)
  - [ ] **Azione: Approva** — bottone verde → chiede conferma → imposta status APPROVED
  - [ ] **Azione: Richiedi Modifiche** — bottone rosso → apre campo testo per feedback → invia con status CHANGES_REQUESTED
  - [ ] Animazione/haptic feedback su approvazione

---

## TASK 8 — Commenti
> Usato sia dall'SMM che dal client in ogni dettaglio post.

- [ ] **8.1 Lista commenti**
  - [ ] Bubble stile chat: commenti SMM a destra, cliente a sinistra
  - [ ] Timestamp per ogni commento
  - [ ] Scroll automatico all'ultimo commento

- [ ] **8.2 Aggiunta commento**
  - [ ] Input fisso in basso (si sposta con la tastiera — `KeyboardAvoidingView`)
  - [ ] Bottone invia
  - [ ] Ottimistic update (appare subito prima della risposta del server)

---

## TASK 9 — Notifiche Push
> Avvisare il cliente quando ci sono post da approvare.

- [ ] **9.1 Setup**
  - [ ] Installare `expo-notifications`
  - [ ] Richiedere permesso notifiche al primo avvio (iOS lo mostra come dialog nativo)
  - [ ] Salvare `pushToken` del dispositivo su Supabase nella tabella `profiles`

- [ ] **9.2 Trigger notifiche**
  - [ ] Creare **Supabase Edge Function** `notify-client-on-post`
    - [ ] Si attiva quando un post passa a status REVISION_REQUESTED
    - [ ] Recupera il pushToken del cliente associato al brand
    - [ ] Chiama Expo Push API (`https://exp.host/--/api/v2/push/send`)
  - [ ] Configurare il webhook/trigger su Supabase (database webhook su tabella posts)

- [ ] **9.3 Gestione ricezione**
  - [ ] Handler per notifica in foreground (mostra toast)
  - [ ] Handler per tap su notifica → apre direttamente il post pertinente (deep link)

---

## TASK 10 — Ottimizzazioni UX

- [ ] **10.1 Performance**
  - [ ] Usare `expo-image` al posto di `Image` di React Native per caching automatico
  - [ ] Memoizzare componenti card pesanti con `React.memo`
  - [ ] Paginazione FlatList (caricare 20 post alla volta, load more on scroll)

- [ ] **10.2 Feedback tattile**
  - [ ] Installare `expo-haptics`
  - [ ] Aggiungere `Haptics.impactAsync(Medium)` su: approva post, invia per revisione
  - [ ] Aggiungere `Haptics.notificationAsync(Success)` su: azioni completate con successo

- [ ] **10.3 Gestione rete**
  - [ ] Installare `@react-native-community/netinfo`
  - [ ] Mostrare banner "Sei offline — dati non aggiornati" quando non c'è connessione
  - [ ] React Query serve i dati in cache anche offline

- [ ] **10.4 Animazioni**
  - [ ] Animazione di entrata sulle card (fade + slide up) con `react-native-reanimated`
  - [ ] Animazione bottom sheet (già gestita da `@gorhom/bottom-sheet`)
  - [ ] Transizioni tra tab fluide

---

## TASK 11 — Assets e Identità Visiva

- [ ] **11.1 Icona App**
  - [ ] Creare icona 1024x1024px (PNG, sfondo non trasparente)
  - [ ] Posizionare in `assets/icon.png`
  - [ ] Expo genera automaticamente tutte le dimensioni necessarie

- [ ] **11.2 Splash Screen**
  - [ ] Creare immagine splash 1284x2778px (iPhone 14 Pro Max)
  - [ ] Colore di sfondo splash in `app.json` (`splash.backgroundColor`)
  - [ ] Installare `expo-splash-screen` e nasconderlo dopo il caricamento

- [ ] **11.3 Icone Tab Bar**
  - [ ] Installare `lucide-react-native` (stesso pacchetto del web, compatibile RN)
  - [ ] Scegliere icone per ogni tab (Feed → Home, Clienti → Users, Profilo → User)

---

## TASK 12 — Testing e QA

- [ ] **12.1 Testing dispositivi**
  - [ ] **iPhone fisico** (iOS 16+) con **Expo Go** — sviluppo quotidiano (hot reload via WiFi)
  - [ ] **iPhone fisico** con **EAS development build** — testing feature native (notifiche push, haptic, ecc.) che Expo Go non supporta: `eas build --profile development --platform ios` → installa via link OTA
  - [ ] iPad — verificare che il layout non si rompa (opzionale ma consigliato)
  - [ ] Android (API 26/28/33/35) — emulatore Android Studio in locale + dispositivo fisico
  - [ ] Testare con testo grande su iOS (Impostazioni → Accessibilità → Testo più grande)
  - [ ] Testare modalità dark
  - > **Nota:** Senza Mac non è disponibile il simulatore iOS di Xcode. Un iPhone fisico è l'unico modo per testare su iOS durante lo sviluppo su Windows.

- [ ] **12.2 Flussi critici da testare**
  - [ ] Registrazione nuovo SMM → crea brand → crea post → invia per approvazione
  - [ ] Registrazione nuovo Cliente → vede post in attesa → approva
  - [ ] Registrazione nuovo Cliente → richiede modifiche → SMM modifica → cliente approva
  - [ ] Logout e re-login (sessione ripristinata correttamente)
  - [ ] App in background per 30 minuti → ripristino senza errori
  - [ ] Connessione persa durante un'azione → gestione errore graceful

- [ ] **12.3 Beta testing**
  - [ ] Build `preview` per iOS: `eas build --platform ios --profile preview`
  - [ ] Caricare su **TestFlight** via `eas submit --platform ios`
  - [ ] Invitare 2-3 utenti beta (un SMM + un cliente reale)
  - [ ] Build `preview` per Android: `eas build --platform android --profile preview`
  - [ ] Caricare su **Google Play Internal Testing Track**
  - [ ] Raccogliere feedback e iterare

---

## TASK 13 — Preparazione e Submit App Store (Apple)

- [ ] **13.1 Certificati e firma**
  - [ ] EAS gestisce automaticamente i certificati se si usa `"credentialsSource": "remote"` in `eas.json`
  - [ ] Verificare che bundle ID `com.cedeasy.app` sia registrato su App Store Connect

- [ ] **13.2 App Store Connect**
  - [ ] Creare nuova app su [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
  - [ ] Compilare: nome app, sottotitolo, descrizione (IT + EN), parole chiave
  - [ ] Caricare screenshot per: iPhone 6.9" (iPhone 16 Pro Max) e 6.5" (iPhone 14 Plus) — obbligatori
  - [ ] Impostare classificazione età (rispondere al questionario — app business, nessun contenuto sensibile)
  - [ ] Aggiungere URL Privacy Policy (creare una pagina semplice su Vercel o Notion)
  - [ ] Selezionare categoria: **Business** o **Productivity**

- [ ] **13.3 Build e submit**
  - [ ] Build produzione: `eas build --platform ios --profile production`
  - [ ] Submit agli store: `eas submit --platform ios`
  - [ ] Compilare le note per il reviewer Apple (spiegare il flusso SMM/Cliente, fornire credenziali demo)
  - [ ] Attendere review (1-3 giorni lavorativi)

---

## TASK 14 — Preparazione e Submit Google Play Store

- [ ] **14.1 Google Play Console**
  - [ ] Creare nuova app su [play.google.com/console](https://play.google.com/console)
  - [ ] Compilare: nome app, descrizione breve (80 car.), descrizione completa (4000 car.)
  - [ ] Caricare icona (512x512px), feature graphic (1024x500px)
  - [ ] Caricare screenshot phone (minimo 2, massimo 8)
  - [ ] Completare questionario classificazione contenuti
  - [ ] Aggiungere URL Privacy Policy
  - [ ] Selezionare categoria: **Business**

- [ ] **14.2 Build e submit**
  - [ ] Build produzione AAB: `eas build --platform android --profile production`
  - [ ] Submit: `eas submit --platform android`
  - [ ] Pubblicare prima su **Internal Testing** → **Closed Testing** → **Production**
  - [ ] Attendere review (solitamente poche ore per app nuove)

---

## Dipendenze da Installare

```bash
# Core
npx expo install expo-router expo-constants expo-font expo-image expo-splash-screen

# Supabase
npm install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill

# Data fetching
npm install @tanstack/react-query react-hook-form zod @hookform/resolvers date-fns

# UI / Animazioni
npm install nativewind tailwindcss
npm install react-native-reanimated react-native-gesture-handler
npm install @gorhom/bottom-sheet
npm install react-native-toast-message
npm install react-native-calendars
npm install lucide-react-native

# Native features
npx expo install expo-notifications expo-haptics expo-image-picker
npm install @react-native-community/netinfo
npm install @react-native-community/datetimepicker

# Navigation
npx expo install react-native-screens react-native-safe-area-context
```

---

## Riepilogo Timeline

| Task | Descrizione | Settimane |
|------|-------------|-----------|
| 1 | Setup progetto e infrastruttura | 1 |
| 2 | Supabase e stato globale | 1 |
| 3 | Autenticazione completa | 1 |
| 4 | Componenti UI base | 1 |
| 5 | Navigazione e layout | 0.5 |
| 6 | Area SMM | 2 |
| 7 | Area Client | 1 |
| 8 | Commenti | 0.5 |
| 9 | Notifiche push | 1 |
| 10 | Ottimizzazioni UX | 0.5 |
| 11 | Assets e identità visiva | 0.5 |
| 12 | Testing e QA | 1 |
| 13–14 | Submit App Store + Play Store | 1 |
| **Totale** | | **~11 settimane** |

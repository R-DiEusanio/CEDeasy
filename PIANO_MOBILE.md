# Piano d'Azione — Conversione a App Mobile Nativa (iOS + Android)

> **Progetto:** CedEasy — Piattaforma di approvazione contenuti social  
> **Obiettivo:** Trasformare la web-app in un'app nativa pubblicabile su App Store (Apple) e Google Play Store  
> **Data:** Giugno 2026

---

## Analisi della Situazione Attuale

| Aspetto | Stato Attuale |
|---------|---------------|
| Framework | TanStack Start + React 19 + TypeScript |
| UI | shadcn/ui + Radix UI + Tailwind CSS v4 |
| Backend | Supabase (PostgreSQL + Auth) |
| State | React Context + TanStack Query |
| Routing | TanStack Router (file-based) |
| Deploy | Vercel + Cloudflare Workers |
| Mobile | Responsive design + bottom tab bar già presente |

L'app è già pensata per mobile (tab bar, breakpoint responsivi, safe area), ma gira in un browser. Per entrare nell'App Store e nel Play Store serve un'app nativa o un wrapper nativo.

---

## Approcci Possibili

### Opzione A — Capacitor (Rapida, 3-5 settimane)
Capacitor di Ionic avvolge la web-app esistente in una WebView nativa. Funziona con qualsiasi progetto Vite/React.

**Pro:** Ricicla il 100% del codice UI, deploy rapido, meno rischio.  
**Contro:** Non è un'app veramente nativa (WebView), prestazioni inferiori su dispositivi lenti, Apple può rifiutare app che sembrano solo siti web.

### Opzione B — React Native + Expo (Raccomandata, 8-14 settimane)
Riscrive il layer UI in React Native, mantenendo tutta la logica di business (Supabase, query, validazione, autenticazione).

**Pro:** App 100% nativa, massima qualità, accettata senza problemi dagli store, prestazioni eccellenti.  
**Contro:** Riscrittura completa dei componenti UI (niente Tailwind/HTML).

---

## Raccomandazione: React Native + Expo

React Native con Expo è la scelta corretta perché:
1. Il team usa già React + TypeScript — la curva di apprendimento è minima
2. Expo semplifica enormemente build, firma del codice e submit agli store
3. Supabase ha supporto ufficiale per React Native (`@supabase/supabase-js` funziona nativamente)
4. TanStack Query, Zod, React Hook Form funzionano tutti in React Native senza modifiche
5. Apple accetta senza problemi app React Native native
6. **Expo EAS Build** gestisce automaticamente certificati iOS e keystore Android

---

## Struttura del Nuovo Progetto

```
cedeasy-mobile/
├── app/                    # Expo Router (file-based routing come TanStack Router)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (smm)/
│   │   ├── index.tsx       # Dashboard SMM
│   │   ├── brands/
│   │   │   ├── index.tsx
│   │   │   └── [brandId].tsx
│   │   └── _layout.tsx     # Tab bar SMM
│   ├── (client)/
│   │   ├── index.tsx       # Post da approvare
│   │   ├── approved.tsx
│   │   └── _layout.tsx     # Tab bar Client
│   └── _layout.tsx         # Root layout + Auth check
├── components/             # Componenti UI React Native
│   ├── ui/                 # Equivalenti shadcn (Button, Card, Badge, etc.)
│   ├── posts/
│   ├── brands/
│   └── common/
├── lib/
│   ├── supabase/           # RIUTILIZZARE DIRETTAMENTE (stesso codice)
│   │   ├── brands.ts
│   │   ├── posts.ts
│   │   ├── profiles.ts
│   │   └── comments.ts
│   ├── store.ts            # AppStore context (adattare)
│   └── utils.ts
├── hooks/                  # useIsMobile non serve più
├── assets/                 # Icone, splash screen
├── app.json                # Config Expo
├── eas.json                # Config EAS Build
└── package.json
```

---

## Cosa si Riutilizza vs Cosa si Riscrive

### Riutilizzo Diretto (copia & incolla)
- `src/lib/supabase/brands.ts` — query brands
- `src/lib/supabase/posts.ts` — query posts + status mapping
- `src/lib/supabase/profiles.ts` — profilo utente
- `src/lib/supabase/comments.ts` — commenti
- Tutte le definizioni TypeScript (tipi, interfacce)
- Logica di validazione Zod (schemi form)
- Logica business (calcolo status, date, ecc.)

### Adattamento (piccole modifiche)
- `AppStore` context — rimuovere logica web, aggiungere AsyncStorage per persistenza
- React Query setup — identico, aggiungere `focusManager` per background fetch
- Logica autenticazione Supabase — usare `AsyncStorage` invece di localStorage

### Riscritto da Zero (solo UI)
- Tutti i componenti `.tsx` che usano HTML (`<div>`, `<button>`, `<input>`)
- Tailwind CSS → StyleSheet / NativeWind (Tailwind per React Native)
- Radix UI → React Native equivalenti (Bottom sheets, modali nativi)
- TanStack Router → Expo Router (stessa filosofia file-based)
- `MobileTabBar.tsx` → Tab Navigator di Expo Router
- Calendario → `react-native-calendars`

---

## Fasi di Sviluppo

### Fase 0 — Setup e Infrastruttura (Settimana 1)

- [ ] Creare account **Apple Developer Program** ($99/anno) — necessario per pubblicare su App Store
- [ ] Creare account **Google Play Console** ($25 una tantum) — necessario per Play Store
- [ ] Installare Expo CLI: `npm install -g @expo/cli`
- [ ] Creare nuovo progetto: `npx create-expo-app cedeasy-mobile --template tabs`
- [ ] Configurare **Expo EAS**: `eas init`
- [ ] Configurare `eas.json` per profili development, preview, production
- [ ] Configurare variabili ambiente con `expo-constants`
- [ ] Configurare `app.json` (bundle ID: `com.cedeasy.app`, nome, icona, splash)
- [ ] Impostare Supabase con `AsyncStorage` per la persistenza sessione:
  ```ts
  import AsyncStorage from '@react-native-async-storage/async-storage'
  createClient(url, key, { auth: { storage: AsyncStorage } })
  ```

### Fase 1 — Autenticazione (Settimana 1-2)

- [ ] Installare e configurare `@supabase/supabase-js` + `@react-native-async-storage/async-storage`
- [ ] Copiare logica Supabase auth esistente
- [ ] Costruire schermata **Login** (email + password)
- [ ] Costruire schermata **Registrazione** (con selezione ruolo SMM/Client)
- [ ] Implementare redirect automatico in base al ruolo dopo login
- [ ] Gestire refresh token e sessione persistente
- [ ] Implementare logout
- [ ] Testare su simulatore iOS e dispositivo Android reale

### Fase 2 — Componenti UI Base (Settimana 2-3)

Costruire la libreria di componenti riutilizzabili equivalente a shadcn/ui:

- [ ] `Button` — varianti primary, secondary, destructive, ghost
- [ ] `Card` — contenitore con shadow
- [ ] `Badge` — per status (draft, pending, approved, changes)
- [ ] `Input` + `Textarea` — campi form con validazione
- [ ] `Modal` / `BottomSheet` — per form e dettagli (usare `@gorhom/bottom-sheet`)
- [ ] `Toast` — notifiche (usare `react-native-toast-message`)
- [ ] `Avatar` / `StatusDot`
- [ ] Palette colori — replicare i CSS custom properties (OKLCH → hex/rgba)
- [ ] Typography — Inter font via `expo-font`

### Fase 3 — Area SMM (Settimana 3-5)

- [ ] **Dashboard SMM** (`app/(smm)/index.tsx`)
  - Lista brand attivi
  - Feed attività recente
  - Statistiche post per status
- [ ] **Lista Brand** (`app/(smm)/brands/index.tsx`)
  - Ricerca brand
  - Card per ogni brand con info contatto
- [ ] **Dettaglio Brand** (`app/(smm)/brands/[brandId].tsx`)
  - Calendario post (usare `react-native-calendars`)
  - Lista post filtrabili per status
  - Accesso ai dettagli post
- [ ] **Creazione/Modifica Post** (modal o schermata dedicata)
  - Form con titolo, contenuto, piattaforma, data programmata
  - Selezione piattaforma (Post/Reel/Carosello/Story)
  - Note interne
- [ ] **Tab Bar SMM** (Feed + Clienti + notifiche future)

### Fase 4 — Area Client (Settimana 5-6)

- [ ] **Dashboard Client** (`app/(client)/index.tsx`)
  - Lista post da approvare (status REVISION_REQUESTED)
  - Preview contenuto + media link
- [ ] **Post Approvati** (`app/(client)/approved.tsx`)
  - Archivio post approvati e pubblicati
- [ ] **Dettaglio Post** (modal)
  - Visualizzazione completa post
  - Azioni: Approva / Richiedi modifiche
  - Campo feedback per richiesta modifiche
  - Thread commenti
- [ ] **Tab Bar Client** (Da approvare + Approvati)

### Fase 5 — Funzionalità Native (Settimana 6-7)

- [ ] **Push Notifications** — avvisare il client quando c'è un post da approvare
  - Usare `expo-notifications` + Supabase Edge Functions per il trigger
  - Configurare APNs (Apple) e FCM (Firebase/Google)
- [ ] **Deep Linking** — aprire l'app da link esterni
- [ ] **Haptic Feedback** — `expo-haptics` su azioni importanti (approva, elimina)
- [ ] **Image Picker** — `expo-image-picker` per allegare media ai post (opzionale)
- [ ] **Share** — condivisione post via `expo-sharing`
- [ ] **Safe Area** — `react-native-safe-area-context` per notch e home bar

### Fase 6 — Ottimizzazioni e Rifinitura (Settimana 7-8)

- [ ] Skeleton loading screens
- [ ] Pull-to-refresh su tutte le liste
- [ ] Infinite scroll / paginazione
- [ ] Offline handling (mostrare dati cached quando offline)
- [ ] Animazioni con `react-native-reanimated`
- [ ] Error boundaries
- [ ] Ottimizzazione immagini con `expo-image`
- [ ] Dark mode (seguire sistema operativo)

### Fase 7 — Testing e QA (Settimana 8-9)

- [ ] Testing su iPhone (iOS 16+) — simulatore + dispositivo reale
- [ ] Testing su Android (API 26+ / Android 8+) — emulatore + dispositivo reale
- [ ] Test del flusso completo SMM → Crea post → Client approva
- [ ] Test autenticazione (login, logout, refresh sessione)
- [ ] Test con connessione lenta / offline
- [ ] Test notifiche push (iOS richiede dispositivo reale)
- [ ] Distribuzione beta via **TestFlight** (iOS) e **Google Play Beta Track**

### Fase 8 — Preparazione Store (Settimana 9-10)

**App Store (Apple):**
- [ ] Icona app (1024x1024px PNG, no angoli arrotondati — ci pensa Apple)
- [ ] Splash screen
- [ ] Screenshot per ogni dispositivo richiesto (6.9", 6.5", 12.9" iPad opzionale)
- [ ] Descrizione app in italiano (e inglese per maggiore visibilità)
- [ ] Parole chiave (keywords) — massimo 100 caratteri
- [ ] Classificazione età
- [ ] Privacy Policy URL (obbligatorio)
- [ ] Configurare **App Store Connect** con bundle ID
- [ ] Build finale: `eas build --platform ios --profile production`
- [ ] Submit: `eas submit --platform ios`

**Google Play Store:**
- [ ] Icona app (512x512px PNG)
- [ ] Feature graphic (1024x500px)
- [ ] Screenshot per phone + tablet (opzionale)
- [ ] Descrizione breve (80 caratteri) e completa (4000 caratteri)
- [ ] Privacy Policy URL (obbligatorio)
- [ ] Classificazione contenuti (rispondere al questionario)
- [ ] Build finale: `eas build --platform android --profile production`
- [ ] Submit: `eas submit --platform android`

---

## Dipendenze Chiave del Nuovo Progetto

```json
{
  "dependencies": {
    "expo": "~53.x",
    "expo-router": "~4.x",
    "react-native": "0.76.x",
    "@supabase/supabase-js": "^2.x",
    "@react-native-async-storage/async-storage": "^2.x",
    "@tanstack/react-query": "^5.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "date-fns": "^4.x",
    "react-native-calendars": "^1.x",
    "@gorhom/bottom-sheet": "^5.x",
    "react-native-reanimated": "~3.x",
    "react-native-safe-area-context": "^4.x",
    "react-native-screens": "^3.x",
    "expo-notifications": "^0.x",
    "expo-haptics": "^13.x",
    "expo-font": "^13.x",
    "expo-image": "^2.x",
    "react-native-toast-message": "^2.x",
    "nativewind": "^4.x"
  }
}
```

> **NativeWind v4** permette di usare classi Tailwind in React Native — riduce la riscrittura dei componenti.

---

## Timeline Riassuntiva

| Fase | Attività | Durata |
|------|----------|--------|
| 0 | Setup, account store, configurazione Expo + EAS | 1 settimana |
| 1 | Autenticazione completa | 1 settimana |
| 2 | Libreria componenti UI | 1 settimana |
| 3 | Area SMM (dashboard, brand, post) | 2 settimane |
| 4 | Area Client (approvazione, commenti) | 1 settimana |
| 5 | Funzionalità native (push, deep link, haptic) | 1 settimana |
| 6 | Ottimizzazioni, animazioni, offline | 1 settimana |
| 7 | Testing QA, TestFlight, Play Beta | 1 settimana |
| 8 | Preparazione e submit agli store | 1 settimana |
| **Totale** | | **~10 settimane** |

---

## Cosa Succede alla Web-App

La web-app su Vercel **non va eliminata** — può continuare a esistere in parallelo. Le opzioni sono:

1. **Mantenere entrambe** — web per desktop, app mobile per mobile (consigliato inizialmente)
2. **Redirigere web → app** — sul sito mostrare solo i link per scaricare l'app
3. **Deprecare la web-app** — solo dopo che l'app mobile è stabile in produzione

Il backend Supabase è condiviso tra web e mobile senza alcuna modifica.

---

## Rischi e Note

| Rischio | Mitigazione |
|---------|-------------|
| Apple può richiedere un profilo clienti/SMM demo per la review | Preparare credenziali di test per il reviewer Apple |
| Apple può rifiutare se l'app sembra solo una WebView | React Native nativo non ha questo problema |
| Push notifications iOS richiedono dispositivo fisico per testare | Procurarsi un iPhone fisico per la fase 7 |
| Certificati iOS scadono ogni anno | EAS gestisce il rinnovo automatico |
| App Store review: 1-3 giorni lavorativi | Pianificare il submit almeno una settimana prima del lancio |
| Play Store review: poche ore per app nuove | Solitamente più veloce di Apple |

---

## Costi Stimati

| Voce | Costo |
|------|-------|
| Apple Developer Program | $99/anno |
| Google Play Console | $25 una tantum |
| Expo EAS Build (free tier) | Gratis (30 build/mese) |
| Expo EAS Build (production) | $29/mese se superi il free tier |
| **Totale avvio** | **~$125 una tantum + $99/anno** |

# Piano d'Azione — Pubblicazione su App Store e Play Store

> **Progetto:** CedEasy — Piattaforma di approvazione contenuti social
> **Obiettivo:** Portare l'app (già convertita in Expo/React Native) fino al submit su App Store (Apple) e Google Play Store
> **Data:** Luglio 2026

---

## Stato Attuale

| Aspetto | Stato |
|---------|-------|
| Framework | Expo ~54 + React Native 0.81.5 + Expo Router (già migrato, vedi `PIANO_MOBILE.md`) |
| Bundle ID | Configurato in `app.json` (`com.cedeasy.app` per iOS e Android) |
| Flussi app | Auth, area SMM, area Client già presenti e funzionanti |
| Asset icona/splash | Presenti in `assets/` (`icon.png`, `splash.png`, `adaptive-icon.png`) |
| EAS Build | **Non configurato** — nessun `eas.json`, nessun `projectId` collegato |
| Account store | **Non creati** — né Apple Developer Program né Google Play Console |
| Privacy Policy | **Assente** — nessun file/pagina nel repo |
| Asset store (screenshot, feature graphic, descrizioni) | **Assenti** |

**Conclusione:** la riscrittura tecnica è completa. Quello che manca è solo la parte di build/firma/submission — stimabile in circa 1 settimana di lavoro (vedi Fase 8 di `PIANO_MOBILE.md`).

---

## TASK 1 — Account Store (a carico dell'utente)

- [ ] **1.1** Creare account **Apple Developer Program** su developer.apple.com — $99/anno
- [ ] **1.2** Creare account **Google Play Console** su play.google.com/console — $25 una tantum
- [ ] **1.3** Creare (se non esiste) un account **Expo** su expo.dev, necessario per EAS Build

> Questi sono prerequisiti bloccanti: senza questi account non si può fare submit, anche con build già pronte.

---

## TASK 2 — Setup EAS Build

- [ ] **2.1** Login: `eas login`
- [ ] **2.2** Collegare il progetto: `eas init` (popola `extra.eas.projectId` in `app.json`)
- [ ] **2.3** Creare `eas.json` con profili `development`, `preview`, `production`
- [ ] **2.4** Aggiungere `ios.buildNumber` e `android.versionCode` in `app.json` (o abilitare `"autoIncrement": true` nel profilo `production` di `eas.json`)
- [ ] **2.5** Verificare variabili d'ambiente (Supabase URL/key) siano configurate per la build EAS (`expo-constants` / EAS secrets)

---

## TASK 3 — Privacy Policy (obbligatoria per entrambi gli store)

- [ ] **3.1** Scrivere il testo della privacy policy (dati raccolti: email, dati profilo, contenuti post — gestiti via Supabase)
- [ ] **3.2** Pubblicare la policy su un URL pubblico stabile (pagina statica, anche riusando l'hosting Vercel già esistente)
- [ ] **3.3** Inserire il link nella configurazione di App Store Connect e Google Play Console

---

## TASK 4 — Preparazione Asset Store

**Apple (App Store Connect):**
- [ ] **4.1** Icona 1024×1024px PNG (verificare `assets/icon.png`, no angoli arrotondati)
- [ ] **4.2** Screenshot per i formati richiesti (6.9", 6.5")
- [ ] **4.3** Descrizione app (italiano + inglese)
- [ ] **4.4** Parole chiave (max 100 caratteri)
- [ ] **4.5** Classificazione età
- [ ] **4.6** Configurare App Store Connect con bundle ID `com.cedeasy.app`

**Google (Play Console):**
- [ ] **4.7** Icona 512×512px PNG
- [ ] **4.8** Feature graphic 1024×500px (da creare)
- [ ] **4.9** Screenshot phone (+ tablet opzionale)
- [ ] **4.10** Descrizione breve (80 car.) e completa (4000 car.)
- [ ] **4.11** Questionario classificazione contenuti

---

## TASK 5 — Build di Produzione

- [ ] **5.1** `eas build --platform ios --profile production`
- [ ] **5.2** `eas build --platform android --profile production`

> EAS gestisce automaticamente certificati iOS e keystore Android — nessuna azione manuale su Xcode/Android Studio necessaria.

---

## TASK 6 — Test Pre-Submission

- [ ] **6.1** Distribuzione beta iOS via **TestFlight**
- [ ] **6.2** Distribuzione beta Android via **Google Play Internal/Beta Track**
- [ ] **6.3** Test end-to-end su dispositivo reale: login, flusso SMM → creazione post → approvazione client
- [ ] **6.4** Test con connessione lenta / offline

---

## TASK 7 — Submit

- [ ] **7.1** Completare store listing su App Store Connect (bundle ID, screenshot, descrizione, privacy policy URL)
- [ ] **7.2** Completare store listing su Google Play Console (screenshot, descrizione, privacy policy URL, content rating)
- [ ] **7.3** `eas submit --platform ios`
- [ ] **7.4** `eas submit --platform android`
- [ ] **7.5** Monitorare stato review: App Store 1-3 giorni lavorativi, Play Store solitamente poche ore

---

## Fuori Scope (rimandato a dopo la prima pubblicazione)

- Push notifications (`expo-notifications`) — non presenti nel codice, non bloccanti per il primo rilascio
- Deep linking, condivisione, ottimizzazioni offline — miglioramenti futuri, non richiesti per l'accettazione da parte degli store

---

## Costi Stimati

| Voce | Costo |
|------|-------|
| Apple Developer Program | $99/anno |
| Google Play Console | $25 una tantum |
| Expo EAS Build (free tier) | Gratis (30 build/mese) |
| **Totale avvio** | **~$125 una tantum + $99/anno** |

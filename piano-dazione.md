# Piano d'azione — CEDeasy

## Task 1 — Selezione modalità operativa

- [x] Aggiungere switch tra **Consulenza** e **Gestione** nella schermata principale SMM
  - [ ] Definire le differenze di interfaccia tra le due modalità
  - [x] Implementare lo switch UI (toggle/tab)
  - [x] Persistere la selezione per utente (AsyncStorage)

---

## Task 2 — Tutorial onboarding a fasi interattive

- [x] Progettare il flusso onboarding (numero di step e contenuto)
  - [x] Step 1: benvenuto e presentazione app
  - [x] Step 2: creazione primo cliente
  - [x] Step 3: creazione primo post
  - [x] Step 4: spiegazione stati del post
  - [x] Step 5: spiegazione sezione strategia
- [x] Implementare la navigazione tra gli step
- [x] Aggiungere possibilità di saltare il tutorial
- [x] Mostrare il tutorial solo al primo accesso (AsyncStorage)

---

## Task 3 — Griglia contenuti del mese

- [x] Creare la vista a griglia mensile dei contenuti per ogni cliente
  - [x] Layout a griglia con i giorni del mese
  - [x] Ogni cella mostra il post pianificato (se presente)
- [x] Implementare i 6 stati per ogni contenuto
  - [x] Da fare
  - [x] Da revisionare
  - [x] Da modificare
  - [x] Da programmare
  - [x] Programmato
  - [x] Rimandato
- [x] Permettere allo SMM di modificare lo stato direttamente dalla griglia
- [x] Colorare le celle in base allo stato del contenuto
- [x] **DB migration:** `ALTER TABLE posts ADD COLUMN planning_status TEXT DEFAULT 'da_fare';`

---

## Task 4 — Strategia cliente

- [x] Aggiungere pulsante **Strategia** nella dashboard del cliente
- [x] Creare il componente `StrategySheet` con piano d'azione (task + sottotask) evidenziabili
- [ ] Definire i campi del form strategia *(dati da inserire — in arrivo)*
  - [ ] Campo 1 — *(da definire)*
  - [ ] Campo 2 — *(da definire)*
  - [ ] Campo 3 — *(da definire)*
- [ ] Collegare il form al backend (Supabase)
- [ ] Caricare e salvare il piano d'azione per cliente

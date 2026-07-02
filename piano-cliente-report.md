# Piano d'azione — Dashboard Avanzamento Lavori & Report (Lato Cliente)

---

## Task 0 — Struttura della Dashboard

- [ ] Creare una sezione dedicata separata dalla vista "Da approvare" attuale
  - [ ] Aggiungere una nuova tab nella navigation bar del cliente (es. "Dashboard" o "Andamento")
  - [ ] Definire il layout generale della dashboard (header, sezioni scorrevoli)
  - [ ] La dashboard è accessibile solo al cliente loggato e mostra solo i dati del proprio brand
  - [ ] Navigazione fluida tra la dashboard e la vista post esistente

---

## Task 1 — Schermata stato di avanzamento lavori

- [ ] Progettare la UI della schermata avanzamento
  - [ ] Header con nome brand e periodo di riferimento (mese corrente)
  - [ ] Barra di avanzamento visiva (es. % post approvati sul totale pianificati)
  - [ ] Riepilogo stati: bozze, in approvazione, approvati, pubblicati
  - [ ] Sezione "Ultime attività" (cronologia approvazioni e modifiche richieste)

- [ ] Implementare i dati in tempo reale
  - [ ] Query Supabase per conteggio post per stato del cliente loggato
  - [ ] Aggiornamento automatico al cambio di stato di un post
  - [ ] Skeleton loader durante il caricamento

---

## Task 2 — KPI e metriche principali

- [ ] Definire i KPI da mostrare al responsabile
  - [ ] Numero totale post pianificati nel periodo
  - [ ] Numero post pubblicati vs pianificati (tasso di completamento)
  - [ ] Numero feedback/modifiche richieste (indica qualità lavoro SMM)
  - [ ] Tempo medio di approvazione da parte del cliente
  - [ ] Tasso di approvazione al primo invio (senza modifiche richieste)

- [ ] Creare i componenti UI per i KPI
  - [ ] Card KPI con valore principale e variazione rispetto al mese precedente
  - [ ] Grafico a barre mensile (post pianificati vs pubblicati)
  - [ ] Indicatore qualità SMM (verde/giallo/rosso in base al tasso modifiche)

- [ ] Implementare le query aggregate su Supabase
  - [ ] Conteggio per status e periodo
  - [ ] Calcolo tempo medio tra `created_at` e `updated_at` su post approvati
  - [ ] Confronto con mese precedente per variazioni percentuali

---

## Task 3 — Generazione report esportabile

- [ ] Definire il contenuto del report
  - [ ] Periodo (mese/trimestre/personalizzato)
  - [ ] Riepilogo KPI del periodo
  - [ ] Lista post con stato, data e numero di revisioni richieste
  - [ ] Sezione feedback: quante modifiche, quali post le hanno ricevute
  - [ ] Valutazione sintetica dell'andamento (automatica da algoritmo semplice)

- [ ] Implementare la generazione del report
  - [ ] Formato PDF (libreria `react-native-html-to-pdf` o simile)
  - [ ] Formato CSV per i dati grezzi (utile per import in gestionali)
  - [ ] Preview del report in-app prima dell'esportazione

- [ ] UI per la selezione e l'esportazione
  - [ ] Bottone "Genera report" con selezione periodo
  - [ ] Modale di anteprima con scroll
  - [ ] Tasto "Scarica PDF" e "Esporta CSV"
  - [ ] Condivisione via email o app native (share sheet)

---

## Task 4 — Storico e confronto periodi

- [ ] Archivio report generati in precedenza
  - [ ] Lista report salvati con data e periodo di riferimento
  - [ ] Possibilità di riaprire e riscaricare un report precedente
  - [ ] Salvataggio su Supabase Storage o generazione on-demand

- [ ] Vista comparativa tra periodi
  - [ ] Confronto mese su mese (MoM)
  - [ ] Confronto trimestre su trimestre (QoQ)
  - [ ] Grafico andamento pubblicazioni negli ultimi 6 mesi

---

## Task 5 — Integrazione con gestionale interno (futuro)

- [ ] Definire le modalità di integrazione
  - [ ] API REST esposta da CEDeasy (endpoint pubblici autenticati)
  - [ ] Webhook per notificare il gestionale a ogni cambio di stato post
  - [ ] Import/export dati in formato standard (JSON, CSV)

- [ ] Implementare le API di integrazione
  - [ ] `GET /api/brands/:id/report?from=&to=` — dati aggregati per periodo
  - [ ] `GET /api/brands/:id/posts` — lista post con stati e metadati
  - [ ] `POST /api/webhooks` — registrazione endpoint esterno per notifiche
  - [ ] Autenticazione via API key per sistemi esterni

- [ ] Documentazione per l'integrazione
  - [ ] Swagger/OpenAPI spec degli endpoint
  - [ ] Guida all'integrazione per sviluppatori del gestionale
  - [ ] Ambiente sandbox per test

- [ ] Considerazioni future
  - [ ] Plugin/connector per gestionali comuni (es. Monday.com, Notion, HubSpot)
  - [ ] Dashboard embed (iframe) da includere nel gestionale senza re-login
  - [ ] SSO (Single Sign-On) per accesso unificato gestionale + CEDeasy

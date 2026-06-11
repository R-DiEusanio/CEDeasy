# CedEasy

**Tagline:** *"Bozze, approvazioni e modifiche. In un solo posto."*  
**Repository:** github.com/R-DiEusanio/CEDeasy

---

## Cosa fa

Una piattaforma di gestione e approvazione dei contenuti social, pensata per semplificare la collaborazione tra **Social Media Manager (SMM)** e i loro **clienti/brand**.

Il flusso centrale è un sistema di stati per ogni post:
- **Bozza** — draft privato, visibile solo all'SMM
- **In revisione** — inviato al cliente per approvazione
- **Approvato** — il cliente ha dato il via libera
- **Modifiche richieste** — il cliente ha richiesto cambiamenti + feedback

**Funzionalità principali:**
- Gestione multi-brand (ogni SMM gestisce più brand/clienti)
- Creazione post con tipi: Post, Reel, Carosello, Story
- Calendario editoriale mensile
- Sistema di commenti/feedback per i post
- Dashboard dedicata per il cliente (approva/richiede modifiche)
- Design mobile-first (sidebar su desktop, tab bar su mobile)
- Sync real-time con polling ogni 15 secondi

---

## Stack tecnico

| Layer | Tecnologia |
|---|---|
| **Frontend framework** | React 19 + TanStack Start (SSR) |
| **Routing** | TanStack Router (file-based) |
| **Server state** | TanStack Query |
| **Database & Auth** | Supabase (PostgreSQL + RLS) |
| **Styling** | Tailwind CSS 4 + shadcn/ui + Radix UI |
| **Form** | React Hook Form + Zod |
| **Build** | Vite 7 |
| **Deploy** | Cloudflare Workers |
| **Linguaggio** | TypeScript |
| **Icons** | Lucide React |
| **Date** | date-fns |
| **Toast** | Sonner |

La sicurezza dei dati è gestita tramite **Row-Level Security (RLS)** su Supabase: i clienti vedono solo i post in stato di approvazione, mai le bozze private degli SMM.

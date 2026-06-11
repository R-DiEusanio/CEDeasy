import { createClient } from '@supabase/supabase-js'

// Queste righe leggono i dati che hai appena messo nel file .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Questo è il "telecomando" che useremo per il login
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
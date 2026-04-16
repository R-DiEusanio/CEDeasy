import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://panbgxyffqcgixsttsbl.supabase.co'
const supabaseKey = 'sb_publishable_8zpu2l3fQDuwWgdYmNT90g_TA1Ze1Kc'

export const supabase = createClient(supabaseUrl, supabaseKey)
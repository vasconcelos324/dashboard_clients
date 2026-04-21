import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  
  console.warn('Supabase URL ou KEY não configurados. Verifique as variáveis de ambiente.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

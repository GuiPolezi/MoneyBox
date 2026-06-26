import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Permite o app carregar e mostrar um aviso amigável quando faltam as
// variáveis de ambiente, em vez de quebrar na importação.
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase não configurado. Crie um arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(
  url || 'http://localhost:54321',
  anonKey || 'anon-key-placeholder',
  { auth: { persistSession: true, autoRefreshToken: true } }
)

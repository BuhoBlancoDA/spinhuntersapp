import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // *** SERVER ONLY ***
  if (!url || !serviceKey) {
    throw new Error('Config faltante: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

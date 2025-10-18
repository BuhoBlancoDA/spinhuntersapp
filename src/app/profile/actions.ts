// src/app/profile/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAction } from '@/lib/supabase'

export async function updateProfile(formData: FormData) {
  const supabase = supabaseAction()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'NOT_AUTH' }

  const full_name = String(formData.get('full_name') ?? '').slice(0, 120)
  const country = String(formData.get('country') ?? '').slice(0, 2).toUpperCase()

  // 1) Intento con user_id
  let { error } = await supabase
    .from('profiles')
    .update({ full_name, country })
    .eq('user_id', user.id)

  if (error) {
    // 2) Fallback con id (por si la columna es 'id' en tu esquema)
    const { error: err2 } = await supabase
      .from('profiles')
      .update({ full_name, country })
      .eq('id', user.id)

    if (err2) {
      return { ok: false, error: err2.message }
    }
  }

  // Revalida vistas relacionadas
  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { ok: true }
}

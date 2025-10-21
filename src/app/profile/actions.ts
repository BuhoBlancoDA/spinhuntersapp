// src/app/profile/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'

export async function updateProfile(formData: FormData) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } } as any))
  if (!user) return { ok: false, error: 'NOT_AUTH' }

  const payload: Record<string, any> = {}
  if (formData.has('discord_user')) {
    payload.discord_user = String(formData.get('discord_user') ?? '').slice(0, 120)
  }
  if (formData.has('whatsapp')) {
    payload.whatsapp = String(formData.get('whatsapp') ?? '').slice(0, 40)
  }

  if (Object.keys(payload).length === 0) {
    return { ok: false, error: 'EMPTY' }
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: user.id, ...payload }, { onConflict: 'user_id' })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/profile')
  revalidatePath('/dashboard')
  return { ok: true }
}

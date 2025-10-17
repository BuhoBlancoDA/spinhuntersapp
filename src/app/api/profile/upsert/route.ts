import { NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase'

export async function POST(req: Request) {
  const supabase = supabaseRoute()
  const form = await req.formData()

  const userRes = await supabase.auth.getUser()
  const user = userRes.data.user
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const payload = {
    user_id: user.id,
    full_name: String(form.get('full_name') || ''),
    country_code: String(form.get('country_code') || ''),
    discord_user: String(form.get('discord_user') || ''),
    whatsapp: String(form.get('whatsapp') || ''),
    email_alt: String(form.get('email_alt') || ''),
    how_heard: String(form.get('how_heard') || ''),
    how_heard_other: String(form.get('how_heard_other') || '')
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.redirect(new URL('/profile', req.url))
}
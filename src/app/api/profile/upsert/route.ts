// src/app/api/profile/upsert/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase'

export async function POST(req: Request) {
  const supabase = supabaseRoute()

  // Sesión por cookies httpOnly
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) {
    return NextResponse.json({ error: 'NOT_AUTH' }, { status: 401 })
  }

  // Datos del formulario
  const form = await req.formData()
  const full_name = String(form.get('full_name') ?? '').slice(0, 120)

  // admitimos 'country' o 'country_code'
  const country_code = String(form.get('country') ?? form.get('country_code') ?? '')
    .slice(0, 2)
    .toUpperCase()

  const discord_user = String(form.get('discord_user') ?? '')
  const whatsapp = String(form.get('whatsapp') ?? '')
  const email_alt = String(form.get('email_alt') ?? '')
  const how_heard = String(form.get('how_heard') ?? '')
  const how_heard_other = String(form.get('how_heard_other') ?? '')

  const basePayload = {
    full_name,
    country_code,
    discord_user,
    whatsapp,
    email_alt,
    how_heard,
    how_heard_other,
  }

  // 1) upsert por user_id (lo más común)
  let { error } = await supabase
    .from('profiles')
    .upsert({ user_id: user.id, ...basePayload }, { onConflict: 'user_id' })

  // 2) si tu esquema usa 'id' como PK=uid, fallback:
  if (error) {
    const { error: err2 } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...basePayload }, { onConflict: 'id' })

    if (err2) {
      return NextResponse.json({ error: err2.message }, { status: 400 })
    }
  }

  // Devolvemos JSON (no redirect para no romper cookies en dev)
  return NextResponse.json({ ok: true })
}

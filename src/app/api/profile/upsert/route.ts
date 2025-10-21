export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const res = new NextResponse()
  const supabase = supabaseRoute(req, res)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'NOT_AUTH' }, { status: 401, headers: res.headers })
  }

  const ct = req.headers.get('content-type') || ''

  // Construimos payload SOLO con lo recibido (no pisar campos).
  const rest: Record<string, any> = {}

  try {
    if (ct.includes('application/json')) {
      const body = await req.json()
      if ('full_name' in body) rest.full_name = String(body.full_name ?? '').slice(0, 120)
      if ('country' in body || 'country_code' in body) {
        rest.country_code = String(body.country ?? body.country_code ?? '').slice(0, 2).toUpperCase()
      }
      if ('discord_user' in body) rest.discord_user = String(body.discord_user ?? '')
      if ('whatsapp' in body) rest.whatsapp = String(body.whatsapp ?? '')
      if ('email_alt' in body) rest.email_alt = String(body.email_alt ?? '')
      if ('how_heard' in body) rest.how_heard = String(body.how_heard ?? '')
      if ('how_heard_other' in body) rest.how_heard_other = String(body.how_heard_other ?? '')
      if ('username' in body) rest.username = String(body.username ?? '').trim().toLowerCase()
    } else {
      const fd = await req.formData()
      if (fd.has('full_name')) rest.full_name = String(fd.get('full_name') ?? '').slice(0, 120)
      if (fd.has('country') || fd.has('country_code')) {
        rest.country_code = String(fd.get('country') ?? fd.get('country_code') ?? '').slice(0, 2).toUpperCase()
      }
      if (fd.has('discord_user')) rest.discord_user = String(fd.get('discord_user') ?? '')
      if (fd.has('whatsapp')) rest.whatsapp = String(fd.get('whatsapp') ?? '')
      if (fd.has('email_alt')) rest.email_alt = String(fd.get('email_alt') ?? '')
      if (fd.has('how_heard')) rest.how_heard = String(fd.get('how_heard') ?? '')
      if (fd.has('how_heard_other')) rest.how_heard_other = String(fd.get('how_heard_other') ?? '')
      if (fd.has('username')) rest.username = String(fd.get('username') ?? '').trim().toLowerCase()
    }
  } catch {
    return NextResponse.json({ error: 'BODY_INVALID' }, { status: 400, headers: res.headers })
  }

  if (Object.keys(rest).length === 0) {
    return NextResponse.json({ error: 'EMPTY_PAYLOAD' }, { status: 400, headers: res.headers })
  }

  // 1) ¿Existe fila de perfil?
  const { data: existing, error: exErr } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (exErr) {
    return NextResponse.json({ error: exErr.message }, { status: 400, headers: res.headers })
  }

  if (existing) {
    // 2a) UPDATE parcial si existe
    const { error } = await supabase
      .from('profiles')
      .update(rest)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: res.headers })
    }
  } else {
    // 2b) INSERT "stub" + los campos recibidos si NO existe
    const stub = {
      full_name: '',
      country_code: '',
      discord_user: '',
      // whatsapp/email_alt/how_heard/how_heard_other pueden ser NULL
    }

    const { error } = await supabase
      .from('profiles')
      .insert({ user_id: user.id, ...stub, ...rest })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: res.headers })
    }
  }

  return NextResponse.json({ ok: true }, { headers: res.headers })
}

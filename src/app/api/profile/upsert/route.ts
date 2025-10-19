// src/app/api/profile/upsert/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const res = new NextResponse()
  const supabase = supabaseRoute(req, res)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'NOT_AUTH' }, { status: 401, headers: res.headers })
  }

  const ct = req.headers.get('content-type') || ''
  let full_name = '', country_code = '', discord_user = '', whatsapp = '', email_alt = '', how_heard = '', how_heard_other = ''
  try {
    if (ct.includes('application/json')) {
      const body = await req.json()
      full_name = String(body?.full_name ?? '').slice(0, 120)
      country_code = String(body?.country ?? body?.country_code ?? '').slice(0, 2).toUpperCase()
      discord_user = String(body?.discord_user ?? '')
      whatsapp = String(body?.whatsapp ?? '')
      email_alt = String(body?.email_alt ?? '')
      how_heard = String(body?.how_heard ?? '')
      how_heard_other = String(body?.how_heard_other ?? '')
    } else {
      const fd = await req.formData()
      full_name = String(fd.get('full_name') ?? '').slice(0, 120)
      country_code = String(fd.get('country') ?? fd.get('country_code') ?? '').slice(0, 2).toUpperCase()
      discord_user = String(fd.get('discord_user') ?? '')
      whatsapp = String(fd.get('whatsapp') ?? '')
      email_alt = String(fd.get('email_alt') ?? '')
      how_heard = String(fd.get('how_heard') ?? '')
      how_heard_other = String(fd.get('how_heard_other') ?? '')
    }
  } catch {
    return NextResponse.json({ error: 'BODY_INVALID' }, { status: 400, headers: res.headers })
  }

  const basePayload = { full_name, country_code, discord_user, whatsapp, email_alt, how_heard, how_heard_other }

  let { error } = await supabase
    .from('profiles')
    .upsert({ user_id: user.id, ...basePayload }, { onConflict: 'user_id' })

  if (error) {
    const { error: err2 } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...basePayload }, { onConflict: 'id' })
    if (err2) {
      return NextResponse.json({ error: err2.message }, { status: 400, headers: res.headers })
    }
  }

  return NextResponse.json({ ok: true }, { headers: res.headers })
}

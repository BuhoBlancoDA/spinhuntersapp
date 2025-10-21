import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const res = new NextResponse()
  const sb = supabaseServer(req, res)

  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'NOT_AUTH' }, { status: 401 })

  const { data: isAdmin } = await sb.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const { data, error } = await sb.rpc('admin_get_user', { uid: params.id })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data || !Array.isArray(data) || !data[0]) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const r = data[0]
  return NextResponse.json({
    user_id: r.user_id,
    email: r.email,
    auth_created_at: r.auth_created_at,
    username: r.username,
    full_name: r.full_name,
    country_code: r.country_code,
    discord_user: r.discord_user,
    whatsapp: r.whatsapp,
    email_alt: r.email_alt,
    how_heard: r.how_heard,
    how_heard_other: r.how_heard_other,
    ggpoker_nick: r.ggpoker_nick,
    created_at: r.profile_created_at,
    updated_at: r.profile_updated_at
  }, { headers: res.headers })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const res = new NextResponse()
  const sb = supabaseServer(req, res)

  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'NOT_AUTH' }, { status: 401 })

  const { data: isAdmin } = await sb.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'BODY_INVALID' }, { status: 400 })

  const allowed = ['full_name','country_code','discord_user','whatsapp','email_alt','how_heard','how_heard_other','ggpoker_nick']
  const payload: Record<string, any> = {}
  for (const k of allowed) if (k in body) payload[k] = body[k]

  const admin = supabaseAdmin()
  // upsert por user_id, para crear perfil si aún no existe
  const { error } = await admin
    .from('profiles')
    .upsert({ user_id: params.id, ...payload }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true }, { headers: res.headers })
}

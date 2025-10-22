import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const res = new NextResponse()
  const sb = supabaseServer(req, res)
  const admin = supabaseAdmin()

  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'NOT_AUTH' }, { status: 401 })
  const { data: isAdmin } = await sb.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'BODY_INVALID' }, { status: 400 })

  let { user_id, email, plan_id, status, start_at, end_at, source, ggpoker_username, discord_nickname, notes, eva } = body

  if (!user_id && email) {
    const { data: uid, error } = await sb.rpc('admin_find_user_by_email', { email_in: email })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!uid) return NextResponse.json({ error: 'EMAIL_NOT_FOUND' }, { status: 404 })
    user_id = uid
  }

  if (!user_id || !plan_id || !status || !end_at) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 })
  }

  const payload = {
    user_id,
    plan_id: Number(plan_id),
    status: String(status).toUpperCase(),
    start_at: start_at ? new Date(start_at).toISOString() : new Date().toISOString(),
    end_at: new Date(end_at).toISOString(),
    source: source ? String(source).toUpperCase() : null,
    ggpoker_username: ggpoker_username || null,
    discord_nickname: discord_nickname || null,
    notes: notes || null,
    eva: !!eva
  }

  const { data: ins, error: insErr } = await admin
    .from('memberships')
    .insert(payload)
    .select('id')
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 })
  return NextResponse.json({ ok: true, id: ins.id }, { headers: res.headers })
}

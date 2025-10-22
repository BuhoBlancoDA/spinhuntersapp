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

  const { data, error } = await sb.rpc('admin_get_membership', { mid: Number(params.id) })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!Array.isArray(data) || !data[0]) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  return NextResponse.json(data[0], { headers: res.headers })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const res = new NextResponse()
  const sb = supabaseServer(req, res)
  const admin = supabaseAdmin()

  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'NOT_AUTH' }, { status: 401 })
  const { data: isAdmin } = await sb.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'BODY_INVALID' }, { status: 400 })

  const allowed = ['plan_id','status','start_at','end_at','source','ggpoker_username','discord_nickname','notes','eva']
  const patch: Record<string, any> = {}
  for (const k of allowed) if (k in body) patch[k] = body[k]

  if ('start_at' in patch && patch.start_at) patch.start_at = new Date(patch.start_at).toISOString()
  if ('end_at' in patch && patch.end_at) patch.end_at = new Date(patch.end_at).toISOString()
  if ('status' in patch && patch.status) patch.status = String(patch.status).toUpperCase()
  if ('source' in patch && patch.source) patch.source = String(patch.source).toUpperCase()
  if ('plan_id' in patch && patch.plan_id) patch.plan_id = Number(patch.plan_id)

  const { error } = await admin.from('memberships').update(patch).eq('id', Number(params.id))
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true }, { headers: res.headers })
}

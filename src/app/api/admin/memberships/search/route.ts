import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const q = String(url.searchParams.get('q') || '').trim()
  const status = String(url.searchParams.get('status') || '').trim().toUpperCase() || null
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') || 20)))

  const res = new NextResponse()
  const sb = supabaseServer(req, res)

  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'NOT_AUTH' }, { status: 401 })

  const { data: isAdmin } = await sb.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const { data, error } = await sb.rpc('admin_list_memberships', {
    q: q || null,
    status_filter: status,
    page_size: pageSize,
    page
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const items = (data || []).map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    email: r.email,
    username: r.username,
    plan_id: r.plan_id,
    plan_code: r.plan_code,
    plan_name: r.plan_name,
    status: r.status,
    start_at: r.start_at,
    end_at: r.end_at,
    source: r.source,
    ggpoker_username: r.ggpoker_username,
    discord_nickname: r.discord_nickname,
    notes: r.notes,
    eva: r.eva,
    created_at: r.created_at
  }))
  const total = Array.isArray(data) && data.length > 0 ? Number(data[0].total_count || 0) : 0

  return NextResponse.json({ items, total, page, pageSize }, { headers: res.headers })
}

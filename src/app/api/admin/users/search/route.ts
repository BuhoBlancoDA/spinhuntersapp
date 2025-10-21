import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const q = String(url.searchParams.get('q') || '').trim()
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') || 20)))

  const res = new NextResponse()
  const sb = supabaseServer(req, res)

  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'NOT_AUTH' }, { status: 401 })

  const { data: isAdmin } = await sb.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const { data, error } = await sb.rpc('admin_list_users', {
    q: q || null,
    page_size: pageSize,
    page
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // data es un array con total_count en cada fila; tomamos el primero (o 0)
  const total = Array.isArray(data) && data.length > 0 ? Number(data[0].total_count || 0) : 0

  // Normalizamos nombres/keys para el front
  const items = (data || []).map((r: any) => ({
    user_id: r.user_id,
    email: r.email,
    auth_created_at: r.auth_created_at,
    username: r.username,
    discord_user: r.discord_user,
    whatsapp: r.whatsapp
  }))

  return NextResponse.json({ items, total, page, pageSize }, { headers: res.headers })
}


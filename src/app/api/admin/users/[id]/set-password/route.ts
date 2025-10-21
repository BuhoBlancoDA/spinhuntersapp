import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const res = new NextResponse()
  const supa = supabaseServer(req, res)
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'NOT_AUTH' }, { status: 401 })

  const { data: isAdmin } = await supa.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const password = String(body?.password || '')
  if (password.length < 8) return NextResponse.json({ error: 'PASSWORD_TOO_SHORT' }, { status: 400 })

  const admin = supabaseAdmin()
  const { error } = await admin.auth.admin.updateUserById(params.id, { password })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true }, { headers: res.headers })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, supabaseRoute } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const res = new NextResponse()
  const sb = supabaseServer(req, res)

  // 1) Autenticación + admin
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'NOT_AUTH' }, { status: 401 })
  const { data: isAdmin } = await sb.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  // 2) Buscar email del usuario en auth.users
  const admin = supabaseAdmin()
  const { data: byId, error: byIdErr } = await admin.auth.admin.getUserById(params.id)
  if (byIdErr) {
    // Si falla, seguimos intentando con el RPC detalle (fallback)
    // Nota: este RPC lo hicimos antes (admin_get_user)
  }

  let email: string | null = byId?.user?.email ?? null

  if (!email) {
    // Fallback extra: tirar del RPC admin_get_user (por si acaso)
    const { data: rcp, error: rcpErr } = await sb.rpc('admin_get_user', { uid: params.id })
    if (!rcpErr && Array.isArray(rcp) && rcp[0]?.email) {
      email = rcp[0].email as string
    }
  }

  if (!email) {
    return NextResponse.json({ error: 'EMAIL_NOT_FOUND' }, { status: 404 })
  }

  const redirectTo =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/auth/update-password'
      : 'https://app.spinhunters.es/auth/update-password'

  // 3) Plan A: intenta que Supabase envíe el correo (requiere SMTP en Auth → Email)
  try {
    const anon = supabaseRoute() // cliente anon sin cookies
    const { error } = await anon.auth.resetPasswordForEmail(email, { redirectTo })
    if (!error) {
      return NextResponse.json({ ok: true, sent: 'supabase' }, { headers: res.headers })
    }
  } catch {
    // seguimos al fallback
  }

  // 4) Plan B: genera link de recuperación (para enviarlo manualmente)
  try {
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      redirectTo,
    } as any)

    if (linkErr || !linkData?.action_link) {
      return NextResponse.json({ error: linkErr?.message || 'GEN_LINK_FAILED' }, { status: 400 })
    }

    return NextResponse.json(
      { ok: true, sent: 'manual', action_link: linkData.action_link },
      { headers: res.headers }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'GEN_LINK_FAILED' }, { status: 400 })
  }
}

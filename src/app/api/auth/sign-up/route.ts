import { NextRequest, NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const res = new NextResponse()

  try {
    const body = await req.json()

    const email = String(body.email || '')
    const password = String(body.password || '')
    const username = String(body.username || '').trim().toLowerCase()

    const profile = {
      full_name: String(body.full_name || ''),
      country_code: String(body.country_code || '').toUpperCase(),
      discord_user: String(body.discord_user || ''),
      whatsapp: String(body.whatsapp || '') || null,
      email_alt: String(body.email_alt || '') || null,
      how_heard: String(body.how_heard || '') || null,
      how_heard_other: String(body.how_heard_other || '') || null
    }

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400, headers: res.headers })
    }

    // ⬇️ AHORA sí pasamos req y res al helper SSR
    const supabase = supabaseRoute(req, res)

    const redirectUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000/auth/callback'
        : 'https://app.spinhunters.es/auth/callback'

    // Crea el user en Auth (con verificación por email)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      { email, password },
      { emailRedirectTo: redirectUrl }
    )
    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400, headers: res.headers })
    }

    const user = signUpData.user
    if (!user?.id) {
      return NextResponse.json({ error: 'Usuario no creado' }, { status: 400, headers: res.headers })
    }

    // Crea/actualiza perfil con service role
    const admin = supabaseAdmin()
    const { error: upsertErr } = await admin
      .from('profiles')
      .upsert({ user_id: user.id, username, ...profile }, { onConflict: 'user_id' })

    if (upsertErr) {
      const msg = upsertErr.message || ''
      if (msg.toLowerCase().includes('uniq_profiles_username_lower')) {
        return NextResponse.json({ error: 'Ese username ya está en uso' }, { status: 400, headers: res.headers })
      }
      return NextResponse.json({ error: msg || 'Error al crear el perfil' }, { status: 400, headers: res.headers })
    }

    // Devolvemos headers por si Supabase setea algo (SSR helpers)
    return NextResponse.json({ ok: true }, { headers: res.headers })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500, headers: res.headers })
  }
}

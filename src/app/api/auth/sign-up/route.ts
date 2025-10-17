import { NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const email = String(body.email || '')
    const password = String(body.password || '')
    const profile = {
      full_name: String(body.full_name || ''),
      country_code: String(body.country_code || '').toUpperCase(),
      discord_user: String(body.discord_user || ''),
      whatsapp: String(body.whatsapp || '') || null,
      email_alt: String(body.email_alt || '') || null,
      how_heard: String(body.how_heard || '') || null,
      how_heard_other: String(body.how_heard_other || '') || null
    }

    const supabase = supabaseRoute()

    const redirectUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000/auth/callback'
        : 'https://app.spinhunters.es/auth/callback'

    // 1) Crear usuario (puede devolver session=null si Confirm email está activo)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      { email, password },
      { emailRedirectTo: redirectUrl }
    )
    if (signUpError) return NextResponse.json({ error: signUpError.message }, { status: 400 })

    const user = signUpData.user
    if (!user?.id) {
      return NextResponse.json({ error: 'Usuario no creado' }, { status: 400 })
    }

    // 2) Crear perfil con SERVICE ROLE (by-pass RLS, server-only)
    const admin = supabaseAdmin()
    const { error: upsertErr } = await admin
      .from('profiles')
      .upsert({ user_id: user.id, ...profile }, { onConflict: 'user_id' })

    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 })
  }
}

// src/app/auth/callback/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const res = new NextResponse()
  const supabase = supabaseRoute(req, res)
  const { searchParams } = req.nextUrl

  // Caso 1: confirmación por email (signup/email_change) con token_hash
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') // 'signup' | 'email_change' | etc.
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) {
      return NextResponse.redirect(new URL('/auth/verified', req.url), { status: 303, headers: res.headers })
    }
    return NextResponse.redirect(new URL('/auth/sign-in?error=Verificaci%C3%B3n%20fallida', req.url), { status: 303, headers: res.headers })
  }

  // Caso 2: OAuth (viene ?code=)
  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      const m = encodeURIComponent(error.message)
      return NextResponse.redirect(new URL(`/auth/sign-in?error=${m}`, req.url), { status: 303, headers: res.headers })
    }

    // Ya hay sesión; comprobamos perfil
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/auth/sign-in?error=Sin%20sesion', req.url), { status: 303, headers: res.headers })
    }

    // ¿Existe perfil?
    const { data: existing } = await supabase
      .from('profiles')
      .select('full_name, country_code, discord_user, whatsapp, email_alt, how_heard, how_heard_other')
      .eq('user_id', user.id)
      .maybeSingle()

    // Si no existe, creamos un esqueleto mínimo (sin pisar si ya existe)
    if (!existing) {
      await supabase.from('profiles').insert({
        user_id: user.id,
        full_name: user.user_metadata?.name || '',
        country_code: '',
        discord_user: '',
        whatsapp: '',
        email_alt: '',
        how_heard: '',
        how_heard_other: '',
      })
    }

    // Chequear completitud mínima
    const isComplete = !!(existing?.full_name && existing?.country_code && existing?.discord_user)
    const to = isComplete ? '/dashboard' : '/auth/onboarding'
    return NextResponse.redirect(new URL(to, req.url), { status: 303, headers: res.headers })
  }

  // Fallback
  return NextResponse.redirect(new URL('/auth/sign-in?error=Callback%20inv%C3%A1lido', req.url), { status: 303, headers: res.headers })
}


// src/app/api/auth/oauth/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const res = new NextResponse()
  const supabase = supabaseRoute(req, res)

  const provider = (req.nextUrl.searchParams.get('provider') || '').toLowerCase()
  if (provider !== 'google') {
    return NextResponse.redirect(new URL('/auth/sign-in?error=Proveedor%20no%20soportado', req.url), { status: 303 })
  }

  const redirectTo = `${req.nextUrl.origin}/auth/callback` // vuelve a tu callback
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })

  if (error || !data?.url) {
    const m = encodeURIComponent(error?.message || 'No se pudo iniciar OAuth')
    return NextResponse.redirect(new URL(`/auth/sign-in?error=${m}`, req.url), { status: 303, headers: res.headers })
  }

  // Redirige al URL de Google
  return NextResponse.redirect(data.url, { status: 303, headers: res.headers })
}

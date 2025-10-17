import { NextRequest, NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = supabaseRoute()
  const { searchParams } = new URL(req.url)

  // Caso 1: confirmación por email (signup/email_change) con token_hash
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') // 'signup' | 'email_change' | etc.
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) {
      return NextResponse.redirect(new URL('/auth/verified', req.url))
    }
  }

  // Caso 2: OAuth u otros que entregan ?code=
  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL('/auth/verified', req.url))
    }
  }

  // Fallback: si algo falla, llevar a sign-in con aviso
  return NextResponse.redirect(new URL('/auth/sign-in?verified=1', req.url))
}
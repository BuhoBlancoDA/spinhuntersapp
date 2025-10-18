// src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const supabase = supabaseRoute()
  const { searchParams } = new URL(req.url)

  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')

  console.log('[callback] params:', { token_hash: !!token_hash, type, hasCode: !!code })

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    console.log('[callback] verifyOtp error?', error?.message)
    if (!error) return NextResponse.redirect(new URL('/auth/verified', req.url))
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[callback] exchangeCodeForSession error?', error?.message)
    if (!error) return NextResponse.redirect(new URL('/auth/verified', req.url))
  }

  console.log('[callback] fallback → /auth/sign-in?verified=1')
  return NextResponse.redirect(new URL('/auth/sign-in?verified=1', req.url))
}

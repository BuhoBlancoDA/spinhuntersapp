// src/app/api/auth/me/route.ts
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { cookies as nextCookies } from 'next/headers'
import { supabaseRoute } from '@/lib/supabase-server'

export async function GET() {
  try {
    // LOG 1: cookies disponibles en este request (solo nombres)
    const cookieNames = nextCookies().getAll().map(c => c.name)
    console.log('[me] cookies in request:', cookieNames)

    const supabase = supabaseRoute()

    // LOG 2: sesión
    const { data: { session }, error: sessErr } = await supabase.auth.getSession()
    console.log('[me] getSession() -> hasSession?', !!session, 'sessErr?', sessErr?.message)

    // LOG 3: usuario
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    console.log('[me] getUser() -> hasUser?', !!user, 'userErr?', userErr?.message, 'userId:', user?.id)

    return NextResponse.json(
      { user, hasSession: !!session },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e: any) {
    console.error('[me] fatal error:', e?.message || e)
    return NextResponse.json({ user: null, error: 'fatal' }, { status: 500 })
  }
}

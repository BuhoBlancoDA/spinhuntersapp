// src/app/api/debug/whoami/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = supabaseRoute(req, res)
  const session = await supabase.auth.getSession()
  const user = await supabase.auth.getUser()
  return NextResponse.json(
    { hasSession: !!session.data.session, user: user.data.user },
    { headers: res.headers }
  )
}

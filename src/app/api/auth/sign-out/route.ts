// src/app/api/auth/sign-out/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const res = new NextResponse()
  const supabase = supabaseRoute(req, res)
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', req.url), {
    status: 303,
    headers: res.headers,
  })
}

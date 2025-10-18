// src/app/api/auth/sign-out/route.ts
import { NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = supabaseRoute()
  await supabase.auth.signOut()
  // Responder JSON para llamadas via fetch
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}

// Por si cierras sesión via enlace directo
export async function GET(req: Request) {
  const supabase = supabaseRoute()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', req.url))
}


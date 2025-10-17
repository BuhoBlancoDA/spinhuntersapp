import { NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase'

export async function POST(req: Request) {
  const supabase = supabaseRoute()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', req.url))
}

// (opcional) permitir GET también, por si se usa un enlace
export async function GET(req: Request) {
  const supabase = supabaseRoute()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', req.url))
}

import { NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase'

export async function POST(req: Request) {
  const { email, password } = await req.json()
  const supabase = supabaseRoute()
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
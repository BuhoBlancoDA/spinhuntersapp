import { NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase'

export async function POST(req: Request) {
  const { email, password } = await req.json()
  const supabase = supabaseRoute()

  // Set the redirect URL based on environment
  const redirectTo = process.env.NODE_ENV === 'production'
    ? 'https://app.spinhunters.es/auth/callback'
    : 'http://localhost:3000/auth/callback'

  const { error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      emailRedirectTo: redirectTo
    }
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

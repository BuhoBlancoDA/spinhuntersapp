import { NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase'

export async function POST() {
  const supabase = supabaseRoute()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
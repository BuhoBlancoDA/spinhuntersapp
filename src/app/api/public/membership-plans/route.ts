import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'

export async function GET() {
  const sb = supabaseAdmin()
  const { data, error } = await sb
    .from('membership_plans')
    .select('id, code, name, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ items: [] })
  return NextResponse.json({ items: data || [] })
}

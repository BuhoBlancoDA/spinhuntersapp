// src/app/api/auth/sign-in/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase'

export async function POST(req: Request) {
  const supabase = supabaseRoute()

  let body: any = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const email = String(body?.email || '').trim()
  const password = String(body?.password || '')

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña son obligatorios' }, { status: 400 })
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    // Opcional: mapear mensaje de Supabase a uno más amable
    const message = /invalid/i.test(error.message)
      ? 'Credenciales inválidas'
      : error.message
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // Cookies httpOnly quedan seteadas por el helper. Devolvemos JSON.
  return NextResponse.json({ ok: true })
}

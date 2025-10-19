// src/app/api/auth/sign-in/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseRoute } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  // ⬇️ en App Route Handler usa un Response “vacío”, NO next()
  const res = new NextResponse()
  const supabase = supabaseRoute(req, res)

  // Acepta JSON o FormData
  const ct = req.headers.get('content-type') || ''
  let email = '', password = ''
  try {
    if (ct.includes('application/json')) {
      const body = await req.json()
      email = String(body?.email || '').trim()
      password = String(body?.password || '')
    } else {
      const fd = await req.formData()
      email = String(fd.get('email') || '').trim()
      password = String(fd.get('password') || '')
    }
  } catch {
    return NextResponse.redirect(new URL('/auth/sign-in?error=JSON%20inv%C3%A1lido', req.url), { status: 303 })
  }

  if (!email || !password) {
    return NextResponse.redirect(new URL('/auth/sign-in?error=Faltan%20datos', req.url), { status: 303 })
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    const msg = encodeURIComponent(/invalid/i.test(error.message) ? 'Credenciales%20inv%C3%A1lidas' : error.message)
    return NextResponse.redirect(new URL(`/auth/sign-in?error=${msg}`, req.url), { status: 303 })
  }

  // Importante: devolver headers con Set-Cookie que escribió supabase
  return NextResponse.redirect(new URL('/dashboard', req.url), {
    status: 303,
    headers: res.headers,
  })
}

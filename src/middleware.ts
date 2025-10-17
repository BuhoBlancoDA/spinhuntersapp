import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabaseMiddleware } from '@/lib/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = supabaseMiddleware(req, res)
  // Refresca la sesión si hace falta (setea cookies)
  await supabase.auth.getSession()
  return res
}

// Evitar assets/estáticos
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}

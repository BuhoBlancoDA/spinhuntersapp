import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Para Server Components (RSC / SSR)
 * - En RSC solo leemos cookies; atrapamos escrituras para no romper.
 */
export function supabaseServer() {
  const cookieStore = cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set(name, value, {
            ...options,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })
        } catch {/* no-op en RSC */}
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set(name, '', {
            ...options,
            path: '/',
            maxAge: 0,
          })
        } catch {/* no-op en RSC */}
      },
    },
  })
}

/**
 * Para Route Handlers (app/api/.../route.ts)
 * - Aquí sí podemos leer/escribir cookies con req/res.
 * - Si alguien lo llama sin req/res, devolvemos cliente stateless (sin cookies).
 */
export function supabaseRoute(req?: NextRequest, res?: NextResponse) {
  if (req && res) {
    return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set(name, value, {
            ...options,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })
        },
        remove(name: string, options: any) {
          res.cookies.set(name, '', {
            ...options,
            path: '/',
            maxAge: 0,
          })
        },
      },
    })
  }

  // Fallback sin cookies (no persiste sesión)
  return createSupabaseJsClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

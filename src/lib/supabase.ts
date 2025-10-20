// src/lib/supabase.ts
import { createServerClient, createBrowserClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server Components (RSC / SSR):
// - En RSC solo LEEMOS cookies. Si Supabase intenta refrescar tokens y escribir,
//   envolvemos set/remove en try/catch para silenciarlo (prohibido en RSC).
export function supabaseServer() {
  const cookieStore = cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        // En RSC no se permite modificar cookies → atrapamos y no rompemos
        try {
          cookieStore.set(name, value, {
            ...options,
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          })
        } catch {
          // no-op en RSC
        }
      },
      remove(name: string, options: any) {
        // En RSC no se permite modificar cookies → atrapamos y no rompemos
        try {
          cookieStore.set(name, '', {
            ...options,
            path: '/',
            maxAge: 0,
          })
        } catch {
          // no-op en RSC
        }
      },
    },
  })
}

// Route Handlers (app/api/<...>/route.ts):
// - Aquí SÍ podemos leer/escribir cookies (req/res). Úsalo en login/logout/profile.
export function supabaseRoute(req: NextRequest, res: NextResponse) {
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

// Cliente (solo si lo necesitas en componentes cliente)
export function supabaseBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

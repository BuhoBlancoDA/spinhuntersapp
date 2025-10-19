// src/lib/supabase.ts
import { createServerClient, createBrowserClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server Components (RSC / SSR)
export function supabaseServer() {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookies().set(name, value, {
          ...options,
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
      },
      remove(name: string, options: any) {
        cookies().set(name, '', {
          ...options,
          path: '/',
          maxAge: 0,
        })
      },
    },
  })
}

// Route Handlers (app/api/**/route.ts): reciben req/res para leer/escribir cookies
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

// Client (si lo necesitas; intenta minimizar su uso)
export function supabaseBrowser() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

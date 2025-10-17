import { createBrowserClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  createServerComponentClient,
  createRouteHandlerClient,
  createMiddlewareClient
} from '@supabase/auth-helpers-nextjs'

export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

export const supabaseServer = () =>
  createServerComponentClient({ cookies })

export const supabaseRoute = () =>
  createRouteHandlerClient({ cookies })

// Se usa en middleware para refrescar sesión y setear cookies
export const supabaseMiddleware = (req: any, res: any) =>
  createMiddlewareClient({ req, res })
// src/lib/supabase.ts
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import {
  createServerComponentClient,
  createRouteHandlerClient,
  createMiddlewareClient,
  createServerActionClient,
} from '@supabase/auth-helpers-nextjs'

// Server Components (RSC / SSR)
export const supabaseServer = () => createServerComponentClient({ cookies })

// Route Handlers (app/api/*/route.ts)
export const supabaseRoute = () => createRouteHandlerClient({ cookies })

// Middleware
export const supabaseMiddleware = (req: NextRequest, res: NextResponse) =>
  createMiddlewareClient({ req, res })

// Server Actions
export const supabaseAction = () => createServerActionClient({ cookies })

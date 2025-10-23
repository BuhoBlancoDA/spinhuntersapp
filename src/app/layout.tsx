// src/app/layout.tsx
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import './globals.css'
import { inter } from './fonts'
import Header from '@/components/Header'
import { unstable_noStore as noStore } from 'next/cache'
import { cookies } from 'next/headers'
import SupportWidget from '@/components/SupportWidget'
// 👇 IMPORTA el client de supabase en server
import { supabaseServer } from '@/lib/supabase-server'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  noStore()

  // 1) Seguimos usando la cookie para la "key" (remonta el árbol al login/logout)
  const hasCookie = Boolean(cookies().get('sb-access-token')?.value)

  // 2) Y determinamos sesión real con Supabase (fiable en SSR)
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } } as any))
  const isAuthenticated = !!user

  return (
    <html lang="es">
      <body
        key={hasCookie ? 'auth' : 'guest'}
        className={`${inter.variable} dark bg-bg text-foreground antialiased`}
      >
        <Header />
        {children}

        {/* Widget flotante de soporte: solo para usuarios autenticados */}
        {isAuthenticated && <SupportWidget />}
      </body>
    </html>
  )
}

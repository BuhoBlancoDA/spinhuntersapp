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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  noStore()

  // Si existe el token de acceso, consideramos sesión activa.
  // Usamos esto como "key" para forzar re-montaje del árbol
  // cuando se inicia/cierra sesión y evitar que el App Router
  // reutilice una versión cacheada de "invitado".
  const hasSession = Boolean(cookies().get('sb-access-token')?.value)

  return (
    <html lang="es">
      <body
        key={hasSession ? 'auth' : 'guest'}
        className={`${inter.variable} dark bg-bg text-foreground antialiased`}
      >
        <Header />
        {children}
      </body>
    </html>
  )
}

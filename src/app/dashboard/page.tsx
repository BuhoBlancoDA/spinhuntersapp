// src/app/dashboard/page.tsx
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { supabaseServer } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'

export default async function DashboardPage() {
  noStore()

  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  return (
    <main className="min-h-dvh p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Hola, {user.email}</h1>
      <div className="glass p-4">
        <p className="text-sm text-white/70">
          Aquí verás tu membresía, recursos y anuncios.
        </p>
      </div>

      {/* ⚠️ Navegación dura */}
      <a
        href="/profile"
        className="inline-block px-4 py-2 rounded bg-brand text-white hover:bg-brand/90"
      >
        Completar/editar perfil
      </a>
    </main>
  )
}


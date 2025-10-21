// src/app/dashboard/page.tsx
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { unstable_noStore as noStore } from 'next/cache'

export default async function DashboardPage() {
  noStore()

  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } } as any))
  if (!user) redirect('/auth/sign-in')

  // Username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('user_id', user.id)
    .maybeSingle()
  const username = profile?.username || user.email?.split('@')[0] || 'usuario'

  // ¿Admin? (RPC -> boolean)
  let isAdmin = false
  try {
    const { data, error } = await supabase.rpc('is_admin')
    if (error) throw error
    isAdmin = !!data
  } catch {
    // Fallback suave por si el RPC aún no existe
    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    isAdmin = !!adminRow
  }

  return (
    <main className="min-h-dvh p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Hola, {username}
            {isAdmin && (
              <span className="text-xs px-2 py-0.5 rounded border border-brand/50 text-brand/90 bg-brand/10">
                [Admin]
              </span>
            )}
          </h1>
          <p className="text-sm text-white/70">
            Correo registrado: <span className="text-white/90">{user.email}</span>
          </p>
        </div>

        <Link
          href="/profile"
          className="inline-flex items-center rounded bg-brand text-white px-4 py-2 hover:bg-brand/90 transition"
        >
          Mis Datos
        </Link>
      </div>

      <div className="glass p-4">
        <p className="text-sm text-white/70">
          Aquí verás tus <b>membresías, cursos, herramientas y anuncios</b>.
        </p>
      </div>
    </main>
  )
}

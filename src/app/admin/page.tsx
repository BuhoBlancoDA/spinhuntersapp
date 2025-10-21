import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  return (
    <main className="min-h-dvh p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Panel de administración</h1>
        <Link className="px-3 py-1.5 rounded bg-brand text-white hover:bg-brand/90" href="/admin/users">
          Usuarios
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
        <h2 className="text-lg font-semibold mb-1">Usuarios</h2>
        <p className="text-sm text-white/70">
          Editar, modificar o buscar información de los miembros.
        </p>
      </div>
    </main>
  )
}

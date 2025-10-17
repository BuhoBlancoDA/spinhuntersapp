import { supabaseServer } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  // Opción 1: usar RPC is_admin() si existe
  const { data: isAdminRpc } = await supabase.rpc('is_admin')
  let isAdmin = Boolean(isAdminRpc === true)

  // Fallback: comprobar fila propia (RLS "select self")
  if (!isAdmin) {
    const { data } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    isAdmin = Boolean(data)
  }

  if (!isAdmin) redirect('/')

  return (
    <main className="min-h-dvh p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Panel de administración</h1>
        <Link className="px-3 py-1.5 rounded bg-black text-white" href="/admin/users">Usuarios</Link>
      </div>
      <p className="text-gray-600">Selecciona una sección para gestionar.</p>
    </main>
  )
}

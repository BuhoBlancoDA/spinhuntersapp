import { supabaseServer } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  return (
    <main className="min-h-dvh p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Hola, {user.email}</h1>
      <div className="p-4 border rounded">
        <p className="text-sm text-gray-700">Aquí verás tu membresía, recursos y anuncios.</p>
      </div>
      <a className="inline-block px-4 py-2 rounded bg-black text-white" href="/profile">Completar/editar perfil</a>
    </main>
  )
}
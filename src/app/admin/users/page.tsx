import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminUsersPage() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  // Comprobar admin rápido
  const { data: isAdminRpc } = await supabase.rpc('is_admin')
  if (!isAdminRpc) redirect('/')

  const { data: rows, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, country_code, discord_user, email_alt, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return <main className="p-6"><p>Error: {error.message}</p></main>
  }

  return (
    <main className="min-h-dvh p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Usuarios (últimos 50)</h1>
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Nombre</th>
              <th className="text-left p-2">País</th>
              <th className="text-left p-2">Discord</th>
              <th className="text-left p-2">Email alterno</th>
              <th className="text-left p-2">Creado</th>
              <th className="text-left p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows?.map(r => (
              <tr key={r.user_id} className="border-t">
                <td className="p-2">{r.full_name}</td>
                <td className="p-2">{r.country_code}</td>
                <td className="p-2">{r.discord_user}</td>
                <td className="p-2">{r.email_alt || '-'}</td>
                <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-2">
                  <Link className="underline" href={`/admin/users/${r.user_id}`}>Editar</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
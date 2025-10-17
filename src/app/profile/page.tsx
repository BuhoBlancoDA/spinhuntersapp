import { supabaseServer } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <main className="min-h-dvh p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Mi perfil</h1>
      <form action="/api/profile/upsert" method="post" className="space-y-3">
        <input type="hidden" name="user_id" value={user.id}/>
        <input className="w-full border p-2 rounded" name="full_name" required placeholder="Nombre completo" defaultValue={profile?.full_name || ''}/>
        <input className="w-full border p-2 rounded" name="country_code" required placeholder="País (ISO-2 ej. CO, ES)" defaultValue={profile?.country_code || ''}/>
        <input className="w-full border p-2 rounded" name="discord_user" required placeholder="Usuario de Discord" defaultValue={profile?.discord_user || ''}/>
        <input className="w-full border p-2 rounded" name="whatsapp" placeholder="WhatsApp" defaultValue={profile?.whatsapp || ''}/>
        <input className="w-full border p-2 rounded" name="email_alt" placeholder="Email alterno" defaultValue={profile?.email_alt || ''}/>
        <select className="w-full border p-2 rounded" name="how_heard" defaultValue={profile?.how_heard || ''}>
          <option value="">¿Cómo nos conociste? (opcional)</option>
          <option>Youtube</option><option>Discord</option><option>Twitch</option>
          <option>Google</option><option>Un amigo</option><option>Otros</option>
        </select>
        <input className="w-full border p-2 rounded" name="how_heard_other" placeholder="Si elegiste 'Otros', escribe aquí" defaultValue={profile?.how_heard_other || ''}/>
        <button className="px-4 py-2 rounded bg-black text-white">Guardar</button>
      </form>
    </main>
  )
}
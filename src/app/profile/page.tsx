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

  const cls = "w-full bg-transparent border border-white/15 focus:border-brand/80 outline-none rounded p-2 text-white placeholder:text-white/40"

  return (
    <main className="min-h-dvh p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Mi perfil</h1>
      <form action="/api/profile/upsert" method="post" className="glass p-6 space-y-3">
        <input type="hidden" name="user_id" value={user.id}/>
        <input className={cls} name="full_name" required placeholder="Nombre completo" defaultValue={profile?.full_name || ''}/>
        <input className={cls} name="country_code" required placeholder="País (ISO-2 ej. CO, ES)" defaultValue={profile?.country_code || ''}/>
        <input className={cls} name="discord_user" required placeholder="Usuario de Discord" defaultValue={profile?.discord_user || ''}/>
        <input className={cls} name="whatsapp" placeholder="WhatsApp" defaultValue={profile?.whatsapp || ''}/>
        <input className={cls} name="email_alt" placeholder="Email alterno" defaultValue={profile?.email_alt || ''}/>
        <select className={cls} name="how_heard" defaultValue={profile?.how_heard || ''}>
          <option value="">¿Cómo nos conociste? (opcional)</option>
          <option>Youtube</option><option>Discord</option><option>Twitch</option>
          <option>Google</option><option>Un amigo</option><option>Otros</option>
        </select>
        <input className={cls} name="how_heard_other" placeholder="Si elegiste 'Otros', escribe aquí" defaultValue={profile?.how_heard_other || ''}/>
        <button className="px-4 py-2 rounded bg-brand text-white hover:bg-brand/90">Guardar</button>
      </form>
    </main>
  )
}

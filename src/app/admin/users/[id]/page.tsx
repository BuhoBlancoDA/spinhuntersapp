import { supabaseServer } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function AdminUserEdit({ params }: { params: { id: string } }) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: isAdminRpc } = await supabase.rpc('is_admin')
  if (!isAdminRpc) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', params.id)
    .maybeSingle()

  async function UpdateAction(formData: FormData) {
    'use server'
    const full_name = String(formData.get('full_name') || '')
    const country_code = String(formData.get('country_code') || '').toUpperCase().slice(0,2)
    const discord_user = String(formData.get('discord_user') || '')
    const whatsapp = String(formData.get('whatsapp') || '')
    const email_alt = String(formData.get('email_alt') || '')
    const how_heard = String(formData.get('how_heard') || '')
    const how_heard_other = String(formData.get('how_heard_other') || '')

    const supa = supabaseServer()
    const { error } = await (await supa).from('profiles').update({
      full_name, country_code, discord_user, whatsapp, email_alt, how_heard, how_heard_other
    }).eq('user_id', params.id)
    if (error) {
      return { ok: false, error: error.message }
    }
    return { ok: true }
  }

  if (!profile) {
    return <main className="p-6">No se encontró el perfil.</main>
  }

  return (
    <main className="min-h-dvh p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Editar perfil</h1>
      <form action={UpdateAction} className="space-y-3">
        <input className="w-full border p-2 rounded" name="full_name" defaultValue={profile.full_name} required />
        <input className="w-full border p-2 rounded" name="country_code" defaultValue={profile.country_code} maxLength={2} required />
        <input className="w-full border p-2 rounded" name="discord_user" defaultValue={profile.discord_user} required />
        <input className="w-full border p-2 rounded" name="whatsapp" defaultValue={profile.whatsapp || ''} />
        <input className="w-full border p-2 rounded" name="email_alt" defaultValue={profile.email_alt || ''} />
        <input className="w-full border p-2 rounded" name="how_heard" defaultValue={profile.how_heard || ''} />
        <input className="w-full border p-2 rounded" name="how_heard_other" defaultValue={profile.how_heard_other || ''} />
        <button className="px-4 py-2 rounded bg-black text-white">Guardar cambios</button>
      </form>
    </main>
  )
}
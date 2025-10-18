// src/app/profile/page.tsx
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { supabaseServer } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import ProfileForm from './ProfileForm'
import { unstable_noStore as noStore } from 'next/cache'

export default async function ProfilePage() {
  noStore()

  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  // Lee perfil por user_id; si no, por id
  let { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, country_code, discord_user, whatsapp, email_alt, how_heard, how_heard_other')
    .eq('user_id', user.id)
    .maybeSingle()

  if ((!profile && !error) || error) {
    const res2 = await supabase
      .from('profiles')
      .select('full_name, country_code, discord_user, whatsapp, email_alt, how_heard, how_heard_other')
      .eq('id', user.id)
      .maybeSingle()
    profile = res2.data ?? profile
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Perfil</h1>
      <ProfileForm
        defaultFullName={profile?.full_name ?? ''}
        defaultCountryCode={profile?.country_code ?? ''}
        defaultDiscordUser={profile?.discord_user ?? ''}
        defaultWhatsapp={profile?.whatsapp ?? ''}
        defaultEmailAlt={profile?.email_alt ?? ''}
        defaultHowHeard={profile?.how_heard ?? ''}
        defaultHowHeardOther={profile?.how_heard_other ?? ''}
      />
    </main>
  )
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { COUNTRIES } from '@/lib/countries'
import { updateProfile } from './actions' // (no usado aquí, pero lo dejamos)
import ContactForm from './ContactForm'
import Image from 'next/image'

export default async function ProfilePage() {
  noStore()

  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } } as any))
  if (!user) redirect('/auth/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, country_code, discord_user, whatsapp, ggpoker_nick')
    .eq('user_id', user.id)
    .maybeSingle()

  const countryName =
    profile?.country_code
      ? (COUNTRIES.find(c => c.code === profile.country_code)?.name ?? profile.country_code)
      : ''

  const initials = ((profile?.full_name || profile?.username || user.email || 'U')
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('') || 'U').toUpperCase()

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Fondo con hero + overlay para coherencia visual */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/Hero/hero-mobile.webp"
          alt=""
          fill
          className="object-cover md:hidden"
          priority
        />
        <Image
          src="/Hero/hero-desktop.webp"
          alt=""
          fill
          className="hidden md:block object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 md:py-14 space-y-6">
        {/* Cabecera de perfil */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <div className="flex items-center gap-4">
            {/* Avatar con aro degradado (solo visual) */}
            <div className="p-[2px] rounded-full bg-gradient-to-br from-brand via-cyan-400/70 to-transparent">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white/5 grid place-items-center text-base sm:text-lg font-semibold">
                {initials}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-tight truncate">Mi perfil</h1>
              <p className="text-sm text-white/70 truncate">
                @{profile?.username ?? '—'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {countryName ? <span className="chip">{countryName}</span> : <span className="chip">País no registrado</span>}
              </div>
            </div>
          </div>

          <div aria-hidden className="mt-6 hud-divider" />
        </section>

        {/* Username (solo lectura) */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8 space-y-2">
          <h2 className="font-semibold">Username</h2>
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder-white/50 select-none cursor-not-allowed"
            value={profile?.username ?? ''}
            readOnly
          />
          <p className="text-xs text-white/60">
            Tu username es público y no se puede modificar.
          </p>
        </section>

        {/* Datos de registro (solo lectura) */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8 space-y-4">
          <h2 className="font-semibold">Datos de registro</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Nombre completo</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white select-none cursor-not-allowed"
                value={profile?.full_name ?? ''}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">País</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white select-none cursor-not-allowed"
                value={countryName}
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-1">Nick de GGpoker</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder-white/40 select-none cursor-not-allowed"
              value={profile?.ggpoker_nick ?? ''}
              placeholder="Sin registrar"
              readOnly
            />
            <p className="text-xs text-white/60 mt-1">Este dato lo gestiona un administrador.</p>
          </div>
        </section>

        {/* Datos editables (Discord / WhatsApp) */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8 space-y-4">
          <h2 className="font-semibold">Contacto</h2>
          <ContactForm
            defaultDiscord={profile?.discord_user ?? ''}
            defaultWhatsapp={profile?.whatsapp ?? ''}
          />
        </section>
      </div>
    </main>
  )
}


// src/app/dashboard/page.tsx
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { unstable_noStore as noStore } from 'next/cache'
import PreflopVideoButton from './components/PreflopVideoButton'
import ClassScheduleCard from './components/ClassScheduleCard'
import Image from 'next/image'

export default async function DashboardPage() {
  noStore()

  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } } as any))
  if (!user) redirect('/auth/sign-in')

  // Perfil (username y país)
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, country_code')
    .eq('user_id', user.id)
    .maybeSingle()
  const username = profile?.username || user.email?.split('@')[0] || 'usuario'
  const countryCode = (profile?.country_code || 'CO').toUpperCase()

  // ¿Admin?
  let isAdmin = false
  try {
    const { data, error } = await supabase.rpc('is_admin')
    if (error) throw error
    isAdmin = !!data
  } catch {
    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    isAdmin = !!adminRow
  }

  // ===== Membresía ULTIMATE (activa por membresía o por ser admin) =====
  const { data: planUltimate } = await supabase
    .from('membership_plans')
    .select('id, code, name')
    .eq('code', 'ULTIMATE')
    .maybeSingle()

  let ultimateActive = false
  let ultimateEndAt: string | null = null

  if (planUltimate?.id) {
    const nowIso = new Date().toISOString()
    const { data: m } = await supabase
      .from('memberships')
      .select('status, end_at')
      .eq('user_id', user.id)
      .eq('plan_id', planUltimate.id)
      .eq('status', 'ACTIVE')
      .gt('end_at', nowIso)
      .maybeSingle()
    if (m?.status === 'ACTIVE') {
      ultimateActive = true
      ultimateEndAt = m.end_at
    }
  }

  // Activa si el user tiene Ultimate o si es admin
  const ultimateEnabled = ultimateActive || isAdmin

  // URLs
  const CLASSROOM_URL =
    'https://classroom.google.com/c/NzQ1ODU4NzA0ODM4'
  const PREFLOP_LATEST_URL =
    'https://drive.google.com/drive/folders/1OflfWNkNadRvYI1jdRFzGmV5WKzI-19j?usp=drive_link'
  const BUNNY_IFRAME_SRC =
    'https://iframe.mediadelivery.net/embed/80866/cf5ca02e-0b58-4e01-8e52-9de8c9327917?autoplay=false&loop=false&muted=false&preload=true&responsive=true'

  // UI helpers
  const StatusChip = ({ active }: { active: boolean }) => (
    <span
      className={[
        'text-[11px] px-2 py-0.5 rounded border tracking-wide',
        active
          ? 'border-cyan-400/40 text-cyan-300 bg-cyan-500/10'
          : 'border-white/20 text-white/60 bg-white/5',
      ].join(' ')}
    >
      {active ? '[ACTIVA]' : '[INACTIVA]'}
    </span>
  )

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Fondo hero + overlay para coherencia visual */}
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

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10 md:py-14 space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Hola, {username}
                {isAdmin && (
                  <span className="text-[11px] px-2 py-0.5 rounded border border-brand/50 text-brand/90 bg-brand/10">
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
              className="inline-flex items-center rounded-lg bg-brand text-white px-4 py-2 hover:bg-brand/90 transition shadow-glow"
            >
              Mis Datos
            </Link>
          </div>
          <div aria-hidden className="mt-6 hud-divider" />
        </section>

        {/* Intro */}
        <section className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur p-4">
          <p className="text-sm text-white/80">
            Aquí verás tus <b>membresías, cursos, herramientas y anuncios</b>.
          </p>
        </section>

        {/* Tarjeta: Membresía Ultimate */}
        <section
          className={[
            'rounded-2xl border p-6 sm:p-8 transition space-y-5',
            ultimateEnabled
              ? 'border-cyan-400/40 bg-cyan-500/5'
              : 'border-white/10 bg-white/5 opacity-90',
          ].join(' ')}
        >
          {/* Encabezado y estado */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                MEMBRESÍA ULTIMATE <StatusChip active={ultimateEnabled} />
              </h2>

              {ultimateEnabled ? (
                <p className="text-sm text-white/85">
                  Acceso a todo el contenido avanzado y beneficios de Ultimate.
                  {ultimateActive && ultimateEndAt && (
                    <>
                      {' '}
                      <span className="text-white/70">
                        (vigente hasta {new Date(ultimateEndAt).toLocaleDateString()})
                      </span>
                    </>
                  )}
                </p>
              ) : (
                <p className="text-sm text-white/70">
                  No tienes activa la membresía Ultimate en este momento.
                </p>
              )}
            </div>
          </div>

          {/* Contenidos / Accesos (solo si enabled) */}
          {ultimateEnabled && (
            <div className="space-y-5">
              {/* 0) Horario de clases */}
              <ClassScheduleCard
                initialCountryCode={countryCode}
                classDaysLabel="Lunes, Miércoles, Viernes y Sábados"
                baseTZ="America/Bogota"
                startH={9}
                startM={0}
                endH={10}
                endM={0}
              />

              {/* 1) Rangos Preflop */}
              <div className="rounded-xl border border-white/10 p-4 bg-white/[0.04]">
                <h3 className="text-sm font-semibold mb-2 tracking-wide text-white/90">RANGOS PREFLOP</h3>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={PREFLOP_LATEST_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg bg-white/5 text-white px-4 py-2 border border-white/15 hover:bg-white/10 transition text-sm"
                  >
                    Descargar Tablas Preflop (última versión)
                  </a>

                  <PreflopVideoButton
                    iframeSrc={BUNNY_IFRAME_SRC}
                    buttonLabel="Video explicativo"
                  />
                </div>
              </div>

              {/* 2) Ingreso al Classroom + ayuda */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={CLASSROOM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-brand text-white px-4 py-2 hover:bg-brand/90 transition shadow-glow"
                >
                  Ingreso al Classroom
                </a>

                {/* Ayuda (popover nativo) */}
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-sm text-white/80 hover:bg-white/10"
                  aria-label="Ayuda Classroom"
                  popovertarget="classroom-help"
                  popovertargetaction="toggle"
                  title="Ayuda"
                >
                  ?
                </button>

                <div
                  id="classroom-help"
                  popover="manual"
                  className="max-w-xs rounded-lg border border-white/10 bg-neutral-900/95 p-3 shadow-xl backdrop-blur"
                >
                  <p className="text-sm leading-relaxed text-white/90">Para acceder al Classroom:</p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-white/80 space-y-1">
                    <li>Acepta la invitación que llega a tu correo electrónico.</li>
                    <li>Revisa también la carpeta <b>Spam</b>.</li>
                    <li>Tu membresía debe estar <b>activa</b>.</li>
                    <li>¿No llegó el correo? Contacta con <b>soporte</b> para reenvío.</li>
                  </ul>
                  <div className="mt-3 text-right">
                    <button
                      className="text-xs px-3 py-1.5 rounded bg-red-600/90 hover:bg-red-500 text-white transition"
                      popovertarget="classroom-help"
                      popovertargetaction="hide"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xs text-white/70">Accede a las clases, anuncios y más</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

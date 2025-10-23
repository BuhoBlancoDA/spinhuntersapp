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

  // ===== Soporte: últimos tickets ABIERTOS del usuario =====
  const { data: myTickets } = await supabase
    .from('tickets')
    .select('id, subject, status, created_at')
    .eq('user_id', user.id)
    .eq('type', 'SUPPORT')
    .in('status', ['OPEN', 'IN_PROGRESS'])
    .order('created_at', { ascending: false })
    .limit(3)

  const openCount = (myTickets || []).length

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
        'inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border tracking-wide',
        active
          ? 'border-cyan-400/40 text-cyan-300 bg-cyan-500/10'
          : 'border-white/15 text-white/65 bg-white/5'
      ].join(' ')}
    >
      <span className={['inline-block h-1.5 w-1.5 rounded-full', active ? 'bg-cyan-300' : 'bg-white/50'].join(' ')} />
      {active ? 'ACTIVA' : 'INACTIVA'}
    </span>
  )

  const Badge = ({ children }: { children: React.ReactNode }) => (
    <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/15 bg-white/5 text-white/75">{children}</span>
  )

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Fondo hero + overlay */}
      <div className="absolute inset-0 -z-10">
        <Image src="/Hero/hero-mobile.webp" alt="" fill className="object-cover md:hidden" priority />
        <Image src="/Hero/hero-desktop.webp" alt="" fill className="hidden md:block object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10 md:py-14 space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Avatar inicial */}
              <div className="grid place-items-center h-10 w-10 rounded-full bg-white/10 text-white/90 text-sm font-semibold select-none">
                {username.charAt(0)?.toUpperCase()}
              </div>
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
                  Correo: <span className="text-white/90">{user.email}</span>
                </p>
              </div>
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
            ultimateEnabled ? 'border-cyan-400/40 bg-cyan-500/5' : 'border-white/10 bg-white/5 opacity-90',
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
                    <> <span className="text-white/70">(vigente hasta {new Date(ultimateEndAt).toLocaleDateString()})</span></>
                  )}
                </p>
              ) : (
                <p className="text-sm text-white/70">No tienes activa la membresía Ultimate en este momento.</p>
              )}
            </div>
          </div>

          {/* Contenido cuando está habilitada */}
          {ultimateEnabled && (
            <div className="space-y-4">
              {/* Horario a lo ancho */}
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 md:p-5 md:col-span-2">
                <h3 className="text-sm font-semibold mb-3 tracking-wide text-white/90 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-cyan-300" /> HORARIO DE CLASES
                </h3>
                <ClassScheduleCard
                  initialCountryCode={countryCode}
                  classDaysLabel="Lunes, Miércoles, Viernes y Sábados"
                  baseTZ="America/Bogota"
                  startH={9}
                  startM={0}
                  endH={10}
                  endM={0}
                />
              </div>

              {/* Grid: Preflop + Classroom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Preflop */}
                <div className="rounded-xl border border-white/10 p-4 bg-white/[0.04]">
                  <h3 className="text-sm font-semibold mb-2 tracking-wide text-white/90">RANGOS PREFLOP</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={PREFLOP_LATEST_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg bg-white/5 text-white px-4 py-2 border border-white/15 hover:bg-white/10 transition text-sm"
                    >
                      Descargar Tablas (última versión)
                    </a>
                    <PreflopVideoButton iframeSrc={BUNNY_IFRAME_SRC} buttonLabel="Video explicativo" />
                  </div>
                </div>

                {/* Classroom */}
                <div className="rounded-xl border border-white/10 p-4 bg-white/[0.04]">
                  <h3 className="text-sm font-semibold mb-2 tracking-wide text-white/90">CLASSROOM</h3>
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

                  <p className="text-xs text-white/70 mt-2">Accede a las clases, anuncios y más</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Soporte: tickets abiertos del usuario */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Soporte <Badge>{openCount} abiertos</Badge>
            </h2>
            <div className="flex items-center gap-2">
              <Link href="/support" className="text-sm underline">Abrir ticket</Link>
              <Link href="/support/my-tickets" className="text-sm underline">Ver todos</Link>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 divide-y divide-white/10">
            {(myTickets || []).length === 0 && (
              <div className="p-4 text-sm text-white/70">
                No tienes tickets abiertos. Usa el botón 💬 “¿Necesitas ayuda?” para crear uno.
              </div>
            )}
            {(myTickets || []).map(t => (
              <Link
                key={t.id}
                href={`/support/tickets/${t.id}`}
                className="p-3 flex items-center justify-between hover:bg-white/[0.03] transition"
              >
                <div>
                  <div className="text-sm">
                    <b>#{t.id}</b> — <span className="text-white/90">{t.subject}</span>
                  </div>
                  <div className="text-xs text-white/60">{new Date(t.created_at!).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded border border-white/20">{t.status}</span>
                  <span className="text-white/50">›</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

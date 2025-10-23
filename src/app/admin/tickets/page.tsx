// src/app/admin/tickets/page.tsx
import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams?: { status?: string; pending?: string }
}) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  let query = supabase
    .from('tickets')
    .select('id, type, subject, status, created_at')
    .eq('type', 'SUPPORT')

  if (searchParams?.pending === '1') {
    query = query.in('status', ['OPEN', 'IN_PROGRESS'])
  }
  if (searchParams?.status) {
    query = query.eq('status', searchParams.status)
  }

  const { data: tickets } = await query
    .order('created_at', { ascending: false })
    .limit(200)

  const isActive = (href: string) => {
    const sp = new URLSearchParams(href.split('?')[1] || '')
    const s = sp.get('status') || ''
    const p = sp.get('pending') || ''
    const cs = searchParams?.status || ''
    const cp = searchParams?.pending || ''
    return (s || '') === (cs || '') && (p || '') === (cp || '')
  }

  const fmtDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString() : ''

  const TicketStatus = ({ status }: { status?: string | null }) => {
    const base = 'text-[11px] px-2 py-0.5 rounded border tracking-wide'
    switch (status) {
      case 'OPEN':
        return <span className={`${base} border-amber-400/40 text-amber-300 bg-amber-500/10`}>ABIERTO</span>
      case 'IN_PROGRESS':
        return <span className={`${base} border-cyan-400/40 text-cyan-300 bg-cyan-500/10`}>EN PROCESO</span>
      case 'RESOLVED':
        return <span className={`${base} border-emerald-400/40 text-emerald-300 bg-emerald-500/10`}>RESUELTO</span>
      case 'CLOSED':
        return <span className={`${base} border-white/30 text-white/70 bg-white/5`}>CERRADO</span>
      default:
        return <span className={`${base} border-white/20 text-white/70 bg-white/5`}>{status}</span>
    }
  }

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

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-10 md:py-14 space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5">🛠️</span>
              <h1 className="text-2xl font-bold">Tickets de soporte</h1>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              <span aria-hidden>←</span> Volver al Panel
            </Link>
          </div>

          {/* Filtros como tabs */}
          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
            {[
              ['/admin/tickets', 'Todos'],
              ['/admin/tickets?pending=1', 'Pendientes'],
              ['/admin/tickets?status=CLOSED', 'Cerrados'],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={[
                  'rounded-lg px-3 py-1.5 border transition',
                  isActive(href)
                    ? 'border-brand/50 bg-brand/10 text-white'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/80'
                ].join(' ')}
              >
                {label}
              </Link>
            ))}
          </div>

          <div aria-hidden className="mt-6 hud-divider" />
        </section>

        {/* Lista */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-2">
          {(tickets || []).length === 0 ? (
            <div className="p-6 text-sm text-white/70">Sin resultados.</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {(tickets || []).map(t => (
                <li key={t.id} className="group relative">
                  <div className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/[0.04] transition">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] px-2 py-0.5 rounded border border-white/15 text-white/70 bg-white/5">#{t.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded border border-white/15 text-white/70 bg-white/5 uppercase tracking-wide">
                          {t.type}
                        </span>
                        <span className="truncate text-sm text-white/90 max-w-[52ch]">{t.subject}</span>
                      </div>
                      <div className="text-xs text-white/60 mt-1">{fmtDate(t.created_at)}</div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <TicketStatus status={t.status} />
                      <Link
                        href={`/admin/tickets/${t.id}`}
                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-brand hover:border-brand/0 hover:text-white transition"
                      >
                        Abrir
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

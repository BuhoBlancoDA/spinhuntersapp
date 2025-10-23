// src/app/admin/tickets/[id]/page.tsx
import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ReplyForm from './reply-form'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'nodejs'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function AdminTicketDetail({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  // Simplificamos el SELECT: solo lo necesario
  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, type, subject, status, created_at')
    .eq('id', id)
    .maybeSingle()

  const { data: messages } = await supabase
    .from('ticket_messages')
    .select('id, author_role, body, created_at')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : '')

  const StatusChip = ({ status }: { status?: string | null }) => {
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
      {/* Fondo */}
      <div className="absolute inset-0 -z-10">
        <Image src="/Hero/hero-mobile.webp" alt="" fill className="object-cover md:hidden" priority />
        <Image src="/Hero/hero-desktop.webp" alt="" fill className="hidden md:block object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10 md:py-14 space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">
                Ticket #{ticket?.id} — <span className="text-white/90">{ticket?.subject}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                <StatusChip status={ticket?.status} />
                <span className="text-[13px] text-white/60">Creado: {fmtDate(ticket?.created_at)}</span>
                <span className="text-[11px] px-2 py-0.5 rounded border border-white/15 bg-white/5 text-white/70 uppercase tracking-wide">
                  {ticket?.type}
                </span>
              </div>
            </div>
            <Link
              href="/admin/tickets"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              <span aria-hidden>←</span> Volver a Tickets
            </Link>
          </div>
          <div aria-hidden className="mt-6 hud-divider" />
        </section>

        {/* Meta del ticket (simple: Tipo y Estado) */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <h2 className="text-lg font-semibold mb-4">Detalles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-white/60 text-xs mb-1">Tipo</div>
              <div className="text-white/90">{ticket?.type}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="text-white/60 text-xs mb-1">Estado</div>
              <div><StatusChip status={ticket?.status} /></div>
            </div>
          </div>
        </section>

        {/* Mensajes */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-2">
          <ul className="space-y-3">
            {(messages || []).map(m => {
              const isAdminMsg = m.author_role === 'ADMIN'
              return (
                <li key={m.id} className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'}`}>
                  <div className={[
                    'max-w-[85%] rounded-xl border p-3',
                    isAdminMsg ? 'border-brand/40 bg-brand/10' : 'border-white/10 bg-white/5'
                  ].join(' ')}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-xs text-white/70">{m.author_role}</span>
                      <span className="text-[11px] text-white/50">{fmtDate(m.created_at)}</span>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</pre>
                  </div>
                </li>
              )
            })}
            {(messages || []).length === 0 && (
              <li className="p-4 text-sm text-white/70">No hay mensajes aún.</li>
            )}
          </ul>
        </section>

        {/* Responder / actualizar estado */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <h2 className="text-lg font-semibold mb-4">Responder al usuario</h2>
          <ReplyForm ticketId={id} />
        </section>
      </div>
    </main>
  )
}

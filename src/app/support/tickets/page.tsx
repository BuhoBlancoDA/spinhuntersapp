// src/app/support/tickets/[id]/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ReplyFormUser from './reply-form'

export default async function UserTicketDetail({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  // RLS: solo verá su ticket (si no es suyo, devolverá null)
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('id, subject, status, type, created_at')
    .eq('id', id)
    .maybeSingle()

  if (!ticket) redirect('/support/my-tickets')

  const { data: messages } = await supabase
    .from('ticket_messages')
    .select('id, author_role, body, created_at')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  return (
    <main className="min-h-dvh p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Ticket #{ticket.id} — {ticket.subject}</h1>

      <div className="rounded-lg border border-white/10 p-3 bg-black/10 text-sm">
        <div><b>Estado:</b> {ticket.status}</div>
        <div className="text-xs text-white/60 mt-1">
          Creado: {ticket.created_at && new Date(ticket.created_at).toLocaleString()}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 divide-y divide-white/10">
        {(messages || []).map(m => (
          <div key={m.id} className="p-3">
            <div className="text-xs text-white/60 mb-1">
              {m.author_role} — {new Date(m.created_at!).toLocaleString()}
            </div>
            <pre className="whitespace-pre-wrap text-sm">{m.body}</pre>
          </div>
        ))}
      </div>

      <ReplyFormUser ticketId={ticket.id} />
    </main>
  )
}

// src/app/api/tickets/[id]/reply/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendAdminTicketUpdateEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = Number(params.id)
    if (!id || Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const { body } = await req.json().catch(() => ({} as any))
    if (!body || typeof body !== 'string') return NextResponse.json({ error: 'Body required' }, { status: 400 })

    // Verificar que el ticket le pertenece (RLS igual protege, pero validamos)
    const { data: ticket, error: tErr } = await supabase
      .from('tickets')
      .select('id, subject, user_id, status')
      .eq('id', id)
      .maybeSingle()
    if (tErr || !ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Insert mensaje como USER (RLS lo permite)
    const { error: mErr } = await supabase
      .from('ticket_messages')
      .insert([{
        ticket_id: ticket.id,
        author_id: user.id,
        author_role: 'USER',
        body: String(body).slice(0, 10000),
        is_internal: false,
      }])
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 400 })

    // Si estaba CLOSED, lo pasamos a OPEN (opcional)
    if (ticket.status === 'CLOSED') {
      await supabase.from('tickets').update({ status: 'OPEN' }).eq('id', ticket.id)
    }

    // Email al admin avisando respuesta
    const admin = supabaseAdmin()
    const { data: authUser } = await admin.auth.admin.getUserById(user.id)
    const userEmail = authUser?.user?.email || 'usuario@desconocido'
    await sendAdminTicketUpdateEmail({
      ticketId: ticket.id,
      subject: ticket.subject,
      userEmail,
      body,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('user reply error:', e)
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

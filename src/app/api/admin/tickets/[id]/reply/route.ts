// src/app/api/admin/tickets/[id]/reply/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendUserReplyEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: isAdmin, error: isAdminErr } = await supabase.rpc('is_admin')
    if (isAdminErr) return NextResponse.json({ error: isAdminErr.message }, { status: 500 })
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const id = Number(params.id)
    if (!id || Number.isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const bodyJson = await req.json().catch(() => null)
    const body = bodyJson?.body as string | undefined
    const new_status = bodyJson?.new_status as string | undefined
    if (!body || typeof body !== 'string') {
      return NextResponse.json({ error: 'Body required' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    // Ticket + dueño
    const { data: ticket, error: e1 } = await admin
      .from('tickets')
      .select('id, subject, user_id, status')
      .eq('id', id)
      .maybeSingle()

    if (e1 || !ticket) return NextResponse.json({ error: e1?.message || 'Not found' }, { status: 404 })

    // Mensaje ADMIN
    const { error: e2 } = await admin
      .from('ticket_messages')
      .insert([{
        ticket_id: ticket.id,
        author_id: user.id,
        author_role: 'ADMIN',
        body: body.slice(0, 10000),
        is_internal: false,
      }])

    if (e2) return NextResponse.json({ error: e2.message }, { status: 400 })

    // Estado opcional
    if (new_status && ['OPEN','IN_PROGRESS','CLOSED'].includes(new_status)) {
      await admin.from('tickets').update({ status: new_status }).eq('id', ticket.id)
    }

    // Email al usuario
    const { data: authUser } = await admin.auth.admin.getUserById(ticket.user_id)
    const to = authUser?.user?.email
    if (to) {
      await sendUserReplyEmail({
        to,
        ticketId: ticket.id,
        subject: ticket.subject,
        body,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('admin reply error:', e)
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

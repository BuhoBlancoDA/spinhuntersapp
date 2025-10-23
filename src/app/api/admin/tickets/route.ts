// src/app/api/tickets/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
// 👇 IMPORT CORRECTO (desde el archivo separado)
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendAdminNewTicketEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const json = await req.json()
    const {
      type,          // 'SUPPORT' | 'PURCHASE'
      subject,
      message,       // contenido inicial
      purchase_method,
      transaction_code,
      amount,
      currency,
      plan_id,
    } = json || {}

    if (!type || !['SUPPORT','PURCHASE'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    // Insert ticket (RLS permite insert por el dueño)
    const { data: tkt, error: errT } = await supabase
      .from('tickets')
      .insert([{
        user_id: user.id,
        type, subject,
        purchase_method: type === 'PURCHASE' ? (purchase_method || null) : null,
        transaction_code: type === 'PURCHASE' ? (transaction_code || null) : null,
        amount: type === 'PURCHASE' ? (amount ?? null) : null,
        currency: type === 'PURCHASE' ? (currency || 'USD') : null,
        plan_id: type === 'PURCHASE' ? (plan_id ?? null) : null,
      }])
      .select('id')
      .single()

    if (errT || !tkt) {
      return NextResponse.json({ error: errT?.message || 'Ticket insert failed' }, { status: 400 })
    }

    // Mensaje inicial
    const { error: errM } = await supabase
      .from('ticket_messages')
      .insert([{
        ticket_id: tkt.id,
        author_id: user.id,
        author_role: 'USER',
        body: String(message).slice(0, 10000),
        is_internal: false,
      }])

    if (errM) {
      return NextResponse.json({ error: errM.message }, { status: 400 })
    }

    // Email al admin (obtenemos email del usuario con client admin)
    const admin = supabaseAdmin()
    const { data: authUser } = await admin.auth.admin.getUserById(user.id)
    const userEmail = authUser?.user?.email || 'usuario@desconocido'

    await sendAdminNewTicketEmail({
      ticketId: tkt.id,
      subject,
      type,
      userEmail,
      body: message,
    })

    return NextResponse.json({ ok: true, id: tkt.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

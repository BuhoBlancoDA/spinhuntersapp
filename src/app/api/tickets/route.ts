// src/app/api/tickets/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

type Body = {
  type: 'SUPPORT' | 'PURCHASE'
  subject: string
  message: string
  purchase_method?: string | null
  transaction_code?: string | null
  amount?: number | null
  currency?: string | null
  plan_id?: number | null
  product_id?: string | null
  variant_id?: number | null
}

async function sendBrevoMailToAdmin(subject: string, html: string) {
  const apiKey = (process.env.BREVO_API_KEY || '').trim()
  const fromEmail = (process.env.ADMIN_EMAIL_FROM || '').trim().toLowerCase()
  const toList = (process.env.ADMIN_EMAIL_TO || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!apiKey) { console.warn('[MAIL] Falta BREVO_API_KEY'); return { ok: false, skipped: true } }
  if (!fromEmail || !emailRegex.test(fromEmail)) { console.error('[MAIL] ADMIN_EMAIL_FROM inválido:', JSON.stringify(fromEmail)); return { ok: false } }
  if (toList.length === 0) { console.error('[MAIL] ADMIN_EMAIL_TO vacío'); return { ok: false } }
  for (const to of toList) {
    if (!emailRegex.test(to)) { console.error('[MAIL] ADMIN_EMAIL_TO contiene email inválido:', JSON.stringify(to)); return { ok: false } }
  }

  const payload = {
    sender: { name: 'SpinHunters Soporte', email: fromEmail },
    to: toList.map(email => ({ email })),
    subject,
    htmlContent: html,
    replyTo: { email: fromEmail },
    headers: { 'X-Mailin-Tag': 'tickets' },
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.error('[MAIL] Brevo error:', res.status, txt)
      return { ok: false }
    }
    return { ok: true }
  } catch (e: any) {
    console.error('[MAIL] Brevo fetch error:', e?.message || e)
    return { ok: false }
  }
}

export async function POST(req: Request) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as Body
  if (!body?.type || !body?.subject || !body?.message) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // 1) Crear ticket
  const ticketRow: any = {
    user_id: user.id,
    type: body.type,
    subject: body.subject,
    status: 'OPEN',
  }
  if (body.product_id) ticketRow.product_id = body.product_id
  if (body.variant_id) ticketRow.variant_id = body.variant_id
  if (body.plan_id != null) ticketRow.plan_id = body.plan_id

  // Si es PURCHASE, guarda método/monto/moneda
  if (body.type === 'PURCHASE') {
    const methodRaw = (body.purchase_method || '').toString().toUpperCase()
    const normalizedMethod =
      methodRaw === 'CARD' || methodRaw === 'SKRILL' || methodRaw === 'NETELLER' || methodRaw === 'BINANCE' || methodRaw === 'CRYPTO'
        ? methodRaw
        : null

    ticketRow.purchase_method = normalizedMethod
    ticketRow.transaction_code = body.transaction_code ?? null
    ticketRow.amount = typeof body.amount === 'number' && !Number.isNaN(body.amount) ? Number(body.amount) : null
    ticketRow.currency = (body.currency || '').toString().trim().toUpperCase() || null
  }

  const insert = await supabase
    .from('tickets')
    .insert([ticketRow])
    .select('id')
    .single()

  if (insert.error || !insert.data) {
    return NextResponse.json({ error: insert.error?.message || 'Ticket insert failed' }, { status: 400 })
  }

  const ticketId = insert.data.id as number

  // 2) Primer mensaje (autor: USER)
  const msgIns = await supabase
    .from('ticket_messages')
    .insert([{
      ticket_id: ticketId,
      author_role: 'USER',
      body: body.message,
    }])

  if (msgIns.error) {
    console.error('[TICKETS] Falló primer mensaje:', msgIns.error.message)
    return NextResponse.json({ error: msgIns.error.message, id: ticketId }, { status: 207 })
  }

  // 3) Aviso al admin (no bloqueante)
  const label = body.type === 'PURCHASE' ? 'COMPRA' : 'SOPORTE'
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif">
      <h2>Nuevo ticket de ${label}</h2>
      <p><b>ID:</b> #${ticketId}</p>
      <p><b>Usuario:</b> ${user.email}</p>
      <p><b>Asunto:</b> ${body.subject}</p>
      <pre style="white-space:pre-wrap;background:#0b0b0b;color:#fff;padding:12px;border-radius:8px">${body.message}</pre>
      <hr/>
      <p>Puedes gestionarlo en el panel.</p>
    </div>
  `.trim()

  const mailRes = await sendBrevoMailToAdmin(`[Ticket ${label}] #${ticketId} — ${body.subject}`, html)
  if (!mailRes.ok) {
    console.warn('[MAIL] No se pudo enviar correo al admin. Ticket #', ticketId)
  }

  return NextResponse.json({ ok: true, id: ticketId })
}

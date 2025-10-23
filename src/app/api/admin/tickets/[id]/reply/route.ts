// src/app/api/admin/tickets/[id]/reply/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Lee el payload tolerando JSON, x-www-form-urlencoded o querystring
async function readPayload(req: Request) {
  let payload: any = {}
  try {
    const raw = await req.text()
    if (raw) {
      try { payload = JSON.parse(raw) }
      catch {
        const params = new URLSearchParams(raw)
        payload = Object.fromEntries(params.entries())
      }
    }
  } catch {/* ignore */}
  const url = new URL(req.url)
  if (payload.new_status == null && url.searchParams.has('new_status')) {
    payload.new_status = url.searchParams.get('new_status')
  }
  if (payload.body == null && url.searchParams.has('body')) {
    payload.body = url.searchParams.get('body')
  }
  return payload
}

// Envío de correo con Brevo al USUARIO (desde ADMIN_EMAIL_FROM)
async function sendBrevoToUser(userEmail: string, subject: string, html: string) {
  const apiKey = (process.env.BREVO_API_KEY || '').trim()
  const fromEmail = (process.env.ADMIN_EMAIL_FROM || '').trim()
  if (!apiKey || !fromEmail || !userEmail) {
    console.warn('[MAIL->USER] Envío omitido por falta de ENV o userEmail', { apiKey: !!apiKey, fromEmail, userEmail })
    return { ok: false, skipped: true }
  }
  const payload = {
    sender: { name: 'SpinHunters Soporte', email: fromEmail },
    to: [{ email: userEmail }],
    subject,
    htmlContent: html,
    replyTo: { email: fromEmail },
    headers: { 'X-Mailin-Tag': 'tickets-user-update' }
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    console.error('[MAIL->USER] Brevo error:', res.status, txt)
    return { ok: false }
  }
  return { ok: true }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  if (!id) return NextResponse.json({ error: 'Invalid ticket id' }, { status: 400 })

  // Auth + rol admin
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Cargar ticket y email del usuario (usamos admin para poder leer auth.users)
  const admin = supabaseAdmin()
  const { data: ticket, error: tErr } = await admin
    .from('tickets')
    .select('id, subject, status, user_id')
    .eq('id', id)
    .single()
  if (tErr || !ticket) {
    return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
  }

  // Obtener email del usuario
  let userEmail: string | null = null
  try {
    // v2: clientes con service role tienen auth.admin.getUserById
    const got = await admin.auth.admin.getUserById(ticket.user_id)
    userEmail = got?.data?.user?.email || null
  } catch {
    // Fallback (si no disponible): intentar desde profiles.email_alt
    const { data: prof } = await admin
      .from('profiles')
      .select('email_alt')
      .eq('user_id', ticket.user_id)
      .maybeSingle()
    userEmail = prof?.email_alt || null
  }

  // Leer payload
  const payload = await readPayload(req)
  const rawBody = payload?.body
  const body = typeof rawBody === 'string' ? rawBody.trim() : ''
  const newStatusRaw = payload?.new_status
  const newStatus = typeof newStatusRaw === 'string' ? newStatusRaw.toUpperCase() : ''
  const allowedStatuses = new Set(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])

  const doMessage = body.length > 0
  const doStatus = allowedStatuses.has(newStatus)

  if (!doMessage && !doStatus) {
    return NextResponse.json({ error: 'Nada que actualizar (sin mensaje ni estado válido)' }, { status: 400 })
  }

  // 1) Insertar mensaje (opcional)
  if (doMessage) {
    const { error } = await admin
      .from('ticket_messages')
      .insert([{ ticket_id: id, author_role: 'ADMIN', body }])
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // 2) Actualizar estado (opcional)
  let finalStatus = ticket.status
  if (doStatus) {
    const { error } = await admin
      .from('tickets')
      .update({ status: newStatus })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    finalStatus = newStatus
  }

  // 3) Notificar al usuario por correo (si tenemos su email)
  if (userEmail) {
    const parts: string[] = []
    parts.push(`<p>Hola,</p>`)
    parts.push(`<p>Tu ticket <b>#${ticket.id}</b> ha sido actualizado.</p>`)
    if (doStatus) {
      parts.push(`<p><b>Estado:</b> ${ticket.status} → <b>${finalStatus}</b></p>`)
    }
    if (doMessage) {
      parts.push(`<p><b>Respuesta del equipo:</b></p>`)
      parts.push(`<pre style="white-space:pre-wrap;background:#0b0b0b;color:#fff;padding:12px;border-radius:8px">${escapeHtml(body)}</pre>`)
    }
    parts.push(`<p>Puedes verlo en tu panel: <code>/support/tickets/${ticket.id}</code></p>`)
    const html = `<div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif">${parts.join('') }</div>`

    // No bloqueamos la respuesta si falla el correo
    await sendBrevoToUser(
      userEmail,
      `[Ticket #${ticket.id}] ${doMessage ? 'Nueva respuesta' : 'Actualización de estado'} — ${ticket.subject}`,
      html
    )
  } else {
    console.warn('[MAIL->USER] Email del usuario no disponible; notificación omitida.', { ticketId: ticket.id })
  }

  return NextResponse.json({
    ok: true,
    message: doMessage && doStatus
      ? 'Respuesta enviada y estado actualizado. Notificación enviada al usuario.'
      : doMessage
        ? 'Respuesta enviada. Notificación enviada al usuario.'
        : 'Estado actualizado. Notificación enviada al usuario.'
  })
}

// util mínimo para no romper layout del correo
function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

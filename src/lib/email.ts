// src/lib/email.ts
// Envío de correos con Brevo (Sendinblue) vía HTTP API.

const BREVO_API = 'https://api.brevo.com/v3/smtp/email'

const FROM = process.env.ADMIN_EMAIL_FROM || 'SpinHunters Soporte <soporte@spinhunters.es>'
const ADMIN_TO = process.env.ADMIN_EMAIL_TO || 'admin@spinhunters.es'
const API_KEY = process.env.BREVO_API_KEY || ''

type BrevoEmailPayload = { to: string | string[]; subject: string; html: string; replyTo?: string }

async function sendBrevoEmail({ to, subject, html, replyTo }: BrevoEmailPayload) {
  if (!API_KEY) return
  const toArray = Array.isArray(to) ? to : String(to).split(',').map(s => s.trim()).filter(Boolean)
  const payload: any = {
    sender: parseSender(FROM),
    to: toArray.map(email => ({ email })),
    subject,
    htmlContent: html,
  }
  if (replyTo) payload.replyTo = parseSender(replyTo)

  const res = await fetch(BREVO_API, {
    method: 'POST',
    headers: { 'api-key': API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Brevo error ${res.status}: ${txt}`)
  }
}

function parseSender(input: string) {
  const m = input.match(/^(.*)<([^>]+)>$/)
  if (m) return { name: m[1].trim(), email: m[2].trim() }
  return { name: 'SpinHunters Soporte', email: input.trim() }
}

function escapeHtml(s: string) {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

/* ==== APIs usadas por los endpoints ==== */

export async function sendAdminNewTicketEmail(payload: {
  ticketId: number
  subject: string
  type: 'SUPPORT' | 'PURCHASE'
  userEmail: string
  body: string
}) {
  const subject = `Nuevo ticket #${payload.ticketId} (${payload.type}) — ${payload.subject}`
  const html = `
    <p><b>Usuario:</b> ${escapeHtml(payload.userEmail)}</p>
    <p><b>Tipo:</b> ${escapeHtml(payload.type)}</p>
    <p><b>Asunto:</b> ${escapeHtml(payload.subject)}</p>
    <p><b>Mensaje:</b></p>
    <pre style="white-space:pre-wrap">${escapeHtml(payload.body)}</pre>
    <p>Ir al panel: /admin/tickets/${payload.ticketId}</p>
  `
  await sendBrevoEmail({ to: ADMIN_TO, subject, html, replyTo: payload.userEmail })
}

export async function sendAdminTicketUpdateEmail(payload: {
  ticketId: number
  subject: string
  userEmail: string
  body: string
}) {
  const subject = `Actualización de ticket #${payload.ticketId} — ${payload.subject}`
  const html = `
    <p>El usuario <b>${escapeHtml(payload.userEmail)}</b> respondió al ticket <b>#${payload.ticketId}</b>.</p>
    <p><b>Mensaje:</b></p>
    <pre style="white-space:pre-wrap">${escapeHtml(payload.body)}</pre>
    <p>Ir al panel: /admin/tickets/${payload.ticketId}</p>
  `
  await sendBrevoEmail({ to: ADMIN_TO, subject, html, replyTo: payload.userEmail })
}

export async function sendUserReplyEmail(payload: { to: string; ticketId: number; subject: string; body: string }) {
  const subject = `Respuesta a tu ticket #${payload.ticketId} — ${payload.subject}`
  const html = `
    <p>Hola,</p>
    <p>Tenemos una actualización de tu ticket <b>#${payload.ticketId}</b>.</p>
    <p><b>Respuesta:</b></p>
    <pre style="white-space:pre-wrap">${escapeHtml(payload.body)}</pre>
    <p>Puedes responder desde tu panel.</p>
  `
  await sendBrevoEmail({ to: payload.to, subject, html })
}

// src/app/api/admin/tickets/[id]/reply/route.ts
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ticketId = Number(params.id)
  if (Number.isNaN(ticketId)) return NextResponse.json({ error: 'ID_INVALID' }, { status: 400 })

  // auth + rol (server session)
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({} as any)) as {
    body?: string
    new_status?: 'OPEN'|'IN_PROGRESS'|'RESOLVED'|'CLOSED'|''
    send_receipt?: boolean
  }

  const admin = supabaseAdmin()

  // Leemos ticket con service role (para poder ver todo)
  const { data: t, error: tErr } = await admin
    .from('tickets')
    .select(`
      id, type, user_id, subject, status, created_at,
      purchase_method, transaction_code, amount, currency,
      product_id, variant_id, plan_id
    `)
    .eq('id', ticketId)
    .maybeSingle()

  if (tErr) return NextResponse.json({ error: 'TICKET_READ_FAILED' }, { status: 500 })
  if (!t) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  // Email del usuario (vía admin API) -> PRIORIDAD para mostrar y para enviar correo
  let userEmail: string | null = null
  try {
    const { data: uRes } = await admin.auth.admin.getUserById(t.user_id)
    userEmail = uRes?.user?.email ?? null
  } catch {
    // noop
  }

  // Datos del perfil (opcional)
  let profileParts: string[] = []
  try {
    const { data: prof } = await admin
      .from('profiles')
      .select('full_name, username, email, telegram')
      .eq('id', t.user_id)
      .maybeSingle()
    if (prof) {
      if (prof.full_name) profileParts.push(prof.full_name)
      if (prof.username) profileParts.push(`@${prof.username}`)
      if (!userEmail && prof.email) userEmail = prof.email // fallback si no vino desde auth
      if (prof.telegram) profileParts.push(`(tg: ${prof.telegram})`)
    }
  } catch { /* opcional */ }

  // Línea "Usuario:" priorizando email
  let userLine = userEmail || (profileParts.length ? profileParts.join(' · ') : `ID: ${t.user_id}`)

  // ---------- Enviar RECIBO ----------
  if (body.send_receipt) {
    if (t.type !== 'PURCHASE') return NextResponse.json({ error: 'NOT_PURCHASE_TICKET' }, { status: 400 })

    // Fallback: parsear primer mensaje del usuario si faltan datos
    const { data: msgs } = await admin
      .from('ticket_messages')
      .select('id, author_role, body, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
      .limit(20)

    const firstUser = (msgs || []).find(m => m.author_role !== 'ADMIN') || (msgs || [])[0] || null
    const parsed = firstUser ? parseFromMessage(firstUser.body || '') : {}

    const methodCode = normalizeMethod(t.purchase_method || parsed.methodCode || null)
    const amount = normalizeAmount(t.amount ?? parsed.amount ?? null)
    const currency = (t.currency || parsed.currency || '').toString().toUpperCase() || null
    const transactionCode = t.transaction_code || parsed.transaction_code || null

    // Nombres de producto/variante si existen
    let productName: string | null = null
    let variantName: string | null = null
    let durationDays: number | null = null
    if (t.product_id) {
      const { data: prod } = await admin.from('products').select('name').eq('id', t.product_id).maybeSingle()
      productName = prod?.name || null
    }
    if (t.variant_id) {
      const { data: variant } = await admin
        .from('product_variants')
        .select('name, duration_days')
        .eq('id', t.variant_id)
        .maybeSingle()
      variantName = variant?.name || null
      durationDays = (variant?.duration_days as number | null) ?? null
    }

    // Idempotencia: evitar duplicar recibo
    const { data: prev } = await admin
      .from('ticket_messages')
      .select('body')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })
      .limit(20)
    if ((prev || []).some(m => (m.body || '').startsWith('RECIBO / CONFIRMACIÓN DE RECEPCIÓN'))) {
      if (body.new_status) await admin.from('tickets').update({ status: body.new_status }).eq('id', ticketId)
      return NextResponse.json({ ok: true, message: 'Recibo ya había sido enviado.' })
    }

    // Construir cuerpo del recibo (texto plano para el hilo)
    const now = new Date()
    const fmt = (d: Date) => d.toLocaleString()
    const lines: string[] = []
    lines.push('RECIBO / CONFIRMACIÓN DE RECEPCIÓN')
    lines.push('')
    lines.push('Usuario:')
    lines.push(`- ${userLine}`)
    lines.push('')
    lines.push('Detalle de la compra:')
    if (productName) lines.push(`- Producto: ${productName}`)
    if (variantName) lines.push(`- Opción/Variante: ${variantName}${durationDays ? ` (${durationDays} días)` : ''}`)
    lines.push(`- Método de pago: ${labelMethod(methodCode)}`)
    if (transactionCode) lines.push(`- Código/Hash/Referencia: ${transactionCode}`)
    if (amount != null && currency) lines.push(`- Monto pagado: ${amount} ${currency}`)
    lines.push(`- Ticket: #${t.id}`)
    lines.push(`- Fecha: ${fmt(now)}`)
    lines.push('')
    lines.push('Notas:')
    lines.push('- Este mensaje confirma la recepción de la solicitud de pago.')
    lines.push('- La activación de accesos se realiza tras la verificación (hasta 24 horas).')
    lines.push('- Si necesitas factura fiscal, responde a este ticket con tus datos de facturación.')
    const receiptText = lines.join('\n')

    // 1) Guardar mensaje ADMIN en el hilo
    const { error: mErr } = await admin.from('ticket_messages').insert({
      ticket_id: ticketId,
      author_role: 'ADMIN',
      body: receiptText,
    } as any)
    if (mErr) return NextResponse.json({ error: 'MESSAGE_SAVE_FAILED' }, { status: 500 })

    // 2) Enviar correo al usuario (no bloqueante)
    if (userEmail) {
      const subject = `[SpinHunters] Confirmación de recepción — Ticket #${t.id}`
      const html = renderMailHTML({
        title: 'Confirmación de recepción',
        preheader: `Recibimos tu solicitud de pago. Ticket #${t.id}`,
        blocks: [
          `Hola${profileParts.length && profileParts[0] ? ` ${profileParts[0]}` : ''},`,
          'Hemos recibido tu pago. Aquí tienes el detalle:',
          toHtmlList([
            productName ? `Producto: ${productName}` : null,
            variantName ? `Opción: ${variantName}${durationDays ? ` (${durationDays} días)` : ''}` : null,
            `Método de pago: ${labelMethod(methodCode)}`,
            transactionCode ? `Código/Hash/Referencia: ${transactionCode}` : null,
            (amount != null && currency) ? `Monto pagado: ${amount} ${currency}` : null,
            `Ticket: #${t.id}`,
          ]),
          'Activaremos tus accesos tras la verificación (hasta 24 horas).',
        ],
      })
      try { await sendBrevoMailTo(userEmail, subject, html) } catch { /* no bloquear */ }
    }

    // 3) Actualizar estado si se envió
    if (body.new_status) await admin.from('tickets').update({ status: body.new_status }).eq('id', ticketId)

    return NextResponse.json({ ok: true, message: 'Recibo enviado.' })
  }

  // ---------- Rama normal: responder / actualizar estado ----------
  const text = (body.body || '').toString()
  const next = body.new_status || ''

  if (!text && !next) return NextResponse.json({ error: 'EMPTY' }, { status: 400 })

  if (text) {
    const { error } = await supabase
      .from('ticket_messages')
      .insert({ ticket_id: ticketId, author_role: 'ADMIN', body: text } as any)
    if (error) return NextResponse.json({ error: 'MESSAGE_SAVE_FAILED' }, { status: 500 })

    // También enviar correo al usuario con esta respuesta (si tenemos email)
    if (userEmail) {
      const subject = `[SpinHunters] Respuesta a tu ticket #${t.id} — ${t.subject}`
      const html = renderMailHTML({
        title: 'Tienes una respuesta',
        preheader: `Nueva respuesta del equipo — Ticket #${t.id}`,
        blocks: [
          `Hola${profileParts.length && profileParts[0] ? ` ${profileParts[0]}` : ''},`,
          'Te hemos dejado esta respuesta en tu ticket:',
          `<pre style="white-space:pre-wrap">${escapeHtml(text)}</pre>`,
          `Puedes responder desde este correo o en el panel. Ticket #${t.id}.`,
        ],
      })
      try { await sendBrevoMailTo(userEmail, subject, html) } catch { /* no bloquear */ }
    }
  }

  if (next) await supabase.from('tickets').update({ status: next }).eq('id', ticketId)

  return NextResponse.json({ ok: true, message: 'Acción realizada.' })
}

/* ============== helpers ============== */

function normalizeAmount(v: any): number | null {
  if (v == null) return null
  if (typeof v === 'number' && !Number.isNaN(v)) return +v.toFixed(2)
  if (typeof v === 'string') {
    let s = v.trim().replace(/^\$/, '')
    const hasComma = s.includes(',')
    const hasDot = s.includes('.')
    if (hasComma && hasDot) s = s.replace(/\./g, '').replace(',', '.')
    else s = s.replace(',', '.')
    const n = Number(s)
    return Number.isNaN(n) ? null : +n.toFixed(2)
  }
  return null
}

function normalizeMethod(m?: string | null) {
  const s = (m || '').toUpperCase()
  return s === 'CARD' || s === 'SKRILL' || s === 'NETELLER' || s === 'BINANCE' || s === 'CRYPTO' ? s : null
}

function labelMethod(m?: string | null) {
  switch (m) {
    case 'CARD': return 'Tarjeta de Crédito'
    case 'SKRILL': return 'Skrill'
    case 'NETELLER': return 'Neteller'
    case 'BINANCE': return 'Binance'
    case 'CRYPTO': return 'Criptomonedas'
    default: return '—'
  }
}

// extrae monto/moneda/método/referencia desde el primer mensaje del usuario
function parseFromMessage(body: string): {
  amount?: number | null
  currency?: string | null
  methodCode?: 'CARD'|'SKRILL'|'NETELLER'|'BINANCE'|'CRYPTO'|null
  transaction_code?: string | null
} {
  const out: any = {}

  const mAmt =
    body.match(/Total\s*a\s*pagar:\s*([$\d.,]+)\s*([A-Z]{3,5})/i) ||
    body.match(/Total:\s*([$\d.,]+)\s*([A-Z]{3,5})/i) ||
    body.match(/Importe:\s*([$\d.,]+)\s*([A-Z]{3,5})/i)
  if (mAmt) {
    out.amount = normalizeAmount(mAmt[1])
    out.currency = (mAmt[2] || '').toUpperCase()
  }

  const mMethod =
    body.match(/Método(?:\s*de\s*pago)?:\s*([^\n\r]+)/i) ||
    body.match(/Metodo(?:\s*de\s*pago)?:\s*([^\n\r]+)/i)
  if (mMethod) {
    const s = mMethod[1].trim().toLowerCase()
    out.methodCode =
      s.includes('tarjeta') ? 'CARD' :
      s.includes('skrill') ? 'SKRILL' :
      s.includes('neteller') ? 'NETELLER' :
      s.includes('binance') ? 'BINANCE' :
      (s.includes('cripto') || s.includes('crypto')) ? 'CRYPTO' :
      null
  }

  const mRef =
    body.match(/Referencia\s*del\s*pago:\s*([^\n\r]+)/i) ||
    body.match(/Código:\s*([^\n\r]+)/i) ||
    body.match(/Hash\s*de\s*la\s*transacción:\s*([^\n\r]+)/i)
  if (mRef) out.transaction_code = mRef[1].trim()

  return out
}

/** Enviar correo vía Brevo al usuario (usa las mismas ENV que ya usas) */
async function sendBrevoMailTo(toEmail: string, subject: string, html: string) {
  const apiKey = (process.env.BREVO_API_KEY || '').trim()
  const fromEmail = (process.env.ADMIN_EMAIL_FROM || '').trim().toLowerCase()
  if (!apiKey || !fromEmail) return { ok: false }

  const payload = {
    sender: { name: 'SpinHunters Soporte', email: fromEmail },
    to: [{ email: toEmail }],
    subject,
    htmlContent: html,
    replyTo: { email: fromEmail },
    headers: { 'X-Mailin-Tag': 'tickets' },
  }
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.error('[MAIL][USER] Brevo error:', res.status, txt)
      return { ok: false }
    }
    return { ok: true }
  } catch (e: any) {
    console.error('[MAIL][USER] Brevo fetch error:', e?.message || e)
    return { ok: false }
  }
}

/** Render HTML básico y consistente con el correo al admin */
function renderMailHTML(opts: { title: string; preheader?: string; blocks: (string | null | undefined)[] }) {
  const { title, preheader, blocks } = opts
  const safeBlocks = blocks.filter(Boolean).map(b => `<p style="margin:0 0 12px 0">${b}</p>`).join('')
  const pre = preheader ? `<span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(preheader)}</span>` : ''
  return `
  ${pre}
  <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;max-width:640px;margin:0 auto">
    <h2 style="margin:0 0 12px 0">${escapeHtml(title)}</h2>
    ${safeBlocks}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
    <p style="color:#6b7280;font-size:12px;margin:0">Este mensaje fue enviado por el equipo de SpinHunters.</p>
  </div>
  `.trim()
}

function toHtmlList(items: (string | null)[]) {
  const lis = items.filter(Boolean).map(s => `<li>${escapeHtml(s!)}</li>`).join('')
  return `<ul style="margin:8px 0 12px 18px;padding:0">${lis}</ul>`
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' :
    c === '<' ? '&lt;' :
    c === '>' ? '&gt;' :
    c === '"' ? '&quot;' : '&#39;'
  )
}

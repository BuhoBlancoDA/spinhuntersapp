// src/app/api/tickets/[id]/reply/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Normaliza el payload: acepta JSON, x-www-form-urlencoded, o querystring (?body=...)
async function readPayload(req: Request) {
  let payload: any = {}
  try {
    const raw = await req.text()
    if (raw) {
      try {
        payload = JSON.parse(raw)
      } catch {
        const params = new URLSearchParams(raw)
        payload = Object.fromEntries(params.entries())
      }
    }
  } catch {
    // ignore
  }
  // Fallback a querystring si no vino en body
  const url = new URL(req.url)
  if (payload.body == null && url.searchParams.has('body')) {
    payload.body = url.searchParams.get('body')
  }
  return payload
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  if (!id) return NextResponse.json({ error: 'Invalid ticket id' }, { status: 400 })

  const supabase = supabaseServer()

  // Usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Cargar body tolerante
  const payload = await readPayload(req)
  const rawBody = payload?.body
  const body = typeof rawBody === 'string' ? rawBody.trim() : ''

  if (!body) {
    return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 })
  }

  // Verificar que el ticket pertenece al usuario (defensa en profundidad; además de RLS)
  const { data: ticket, error: tErr } = await supabase
    .from('tickets')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle()

  if (tErr || !ticket) {
    return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
  }
  if (ticket.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Insertar mensaje del usuario
  const { error: mErr } = await supabase
    .from('ticket_messages')
    .insert([{
      ticket_id: id,
      author_role: 'USER',
      body
    }])

  if (mErr) {
    return NextResponse.json({ error: mErr.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

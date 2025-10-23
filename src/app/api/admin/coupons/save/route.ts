import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

type Payload = {
  id?: number
  code: string
  kind: 'PERCENT' | 'AMOUNT'
  value: number
  is_active: boolean
  product_id?: string | null
  starts_at?: string | null
  expires_at?: string | null
  max_redemptions?: number | null
}

export async function POST(req: Request) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'NOT_AUTH' }, { status: 401 })

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ ok: false, error: 'NOT_ADMIN' }, { status: 403 })

  const body = await req.json() as Payload
  // Normalización & Validación
  const code = (body.code || '').trim().toUpperCase()
  const kind = body.kind
  const value = Number(body.value)
  const is_active = !!body.is_active
  const product_id = body.product_id || null
  const starts_at = body.starts_at ? new Date(body.starts_at).toISOString() : null
  const expires_at = body.expires_at ? new Date(body.expires_at).toISOString() : null
  const max_redemptions = (body.max_redemptions ?? null) as number | null

  if (!/^[A-Z0-9\-]{3,40}$/.test(code)) {
    return NextResponse.json({ ok: false, error: 'CODE_INVALID' }, { status: 400 })
  }
  if (kind !== 'PERCENT' && kind !== 'AMOUNT') {
    return NextResponse.json({ ok: false, error: 'KIND_INVALID' }, { status: 400 })
  }
  if (Number.isNaN(value) || value <= 0) {
    return NextResponse.json({ ok: false, error: 'VALUE_INVALID' }, { status: 400 })
  }
  if (kind === 'PERCENT' && (value > 100)) {
    return NextResponse.json({ ok: false, error: 'PERCENT_OUT_OF_RANGE' }, { status: 400 })
  }
  if (starts_at && expires_at && (new Date(starts_at) > new Date(expires_at))) {
    return NextResponse.json({ ok: false, error: 'DATE_RANGE_INVALID' }, { status: 400 })
  }

  // Si viene product_id, comprobamos que exista
  if (product_id) {
    const { data: prod, error: prodErr } = await supabase
      .from('products').select('id').eq('id', product_id).maybeSingle()
    if (prodErr) return NextResponse.json({ ok: false, error: 'PRODUCT_CHECK_FAILED' }, { status: 500 })
    if (!prod) return NextResponse.json({ ok: false, error: 'PRODUCT_NOT_FOUND' }, { status: 400 })
  }

  const row = {
    code,
    kind,
    value,
    is_active,
    product_id,
    starts_at,
    expires_at,
    max_redemptions
  }

  if (body.id) {
    const { data, error } = await supabase
      .from('coupons')
      .update(row)
      .eq('id', body.id)
      .select('id')
      .maybeSingle()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, id: data?.id })
  } else {
    const { data, error } = await supabase
      .from('coupons')
      .insert(row)
      .select('id')
      .maybeSingle()

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true, id: data?.id })
  }
}

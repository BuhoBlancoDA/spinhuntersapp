// POST /api/coupons/apply
// body: { productId: string, variantId: number, code: string }
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req: Request) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { productId, variantId, code } = await req.json()
    if (!productId || !variantId || !code) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Precio base de la variante
    const { data: variant, error: vErr } = await supabase
      .from('product_variants')
      .select('id, product_id, price, currency, is_active')
      .eq('id', variantId)
      .maybeSingle()
    if (vErr || !variant || !variant.is_active || variant.product_id !== productId) {
      return NextResponse.json({ error: 'Invalid variant' }, { status: 400 })
    }

    // Cupón (case-insensitive exact match)
    const { data: coupon, error: cErr } = await supabase
      .from('coupons')
      .select('id, code, kind, value, is_active, product_id, starts_at, expires_at, max_redemptions')
      .ilike('code', code)
      .maybeSingle()
    if (cErr || !coupon || !coupon.is_active) {
      return NextResponse.json({ error: 'Cupón inválido o inactivo' }, { status: 400 })
    }

    // Restricción por producto
    if (coupon.product_id && coupon.product_id !== productId) {
      return NextResponse.json({ error: 'Cupón no aplica a este producto' }, { status: 400 })
    }

    // Ventana de validez
    const now = new Date()
    if (coupon.starts_at && now < new Date(coupon.starts_at)) {
      return NextResponse.json({ error: 'Cupón aún no está activo' }, { status: 400 })
    }
    if (coupon.expires_at && now > new Date(coupon.expires_at)) {
      return NextResponse.json({ error: 'Cupón expirado' }, { status: 400 })
    }

    // Max redenciones (opcional)
    if (coupon.max_redemptions != null) {
      const { count } = await supabase
        .from('coupon_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
      if ((count ?? 0) >= coupon.max_redemptions) {
        return NextResponse.json({ error: 'Cupón agotado' }, { status: 400 })
      }
    }

    const original = Number(variant.price)
    let discount = 0
    if (coupon.kind === 'PERCENT') {
      discount = Math.max(0, Math.min(original, (original * Number(coupon.value)) / 100))
    } else {
      discount = Math.max(0, Math.min(original, Number(coupon.value)))
    }
    const finalAmount = Math.max(0, original - discount)

    return NextResponse.json({
      ok: true,
      originalAmount: original,
      discount,
      finalAmount,
      currency: variant.currency,
      couponId: coupon.id,
      normalizedCode: coupon.code,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

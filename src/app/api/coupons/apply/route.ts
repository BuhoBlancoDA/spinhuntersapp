// POST /api/coupons/apply
// body: { productId: string, variantId: number, code: string }
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin' // <- usa el cliente de service role

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function round2(n: number) {
  // Redondeo bancario simple a 2 decimales
  return Math.round(n * 100) / 100
}

export async function POST(req: Request) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { productId, variantId, code } = await req.json()

    if (!productId || !variantId || !code) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // 1) Validar variante (con sesión del usuario basta)
    const { data: variant, error: vErr } = await supabase
      .from('product_variants')
      .select('id, product_id, price, currency, is_active')
      .eq('id', variantId)
      .maybeSingle()

    if (vErr || !variant || !variant.is_active || variant.product_id !== productId) {
      return NextResponse.json({ error: 'Invalid variant' }, { status: 400 })
    }

    // 2) Leer cupón con service role (bypass de RLS, cupones no públicos)
    const CODE = String(code).trim().toUpperCase()

    // Si guardas los códigos normalizados en mayúsculas, eq() es suficiente.
    // Si no estás 100% seguro, puedes cambiar a .ilike('code', CODE) sin wildcards.
    const { data: coupon, error: cErr } = await supabaseAdmin()
      .from('coupons')
      .select('id, code, kind, value, is_active, product_id, starts_at, expires_at, max_redemptions')
      .eq('code', CODE)
      .maybeSingle()

    if (cErr || !coupon || !coupon.is_active) {
      return NextResponse.json({ error: 'Cupón inválido o inactivo' }, { status: 400 })
    }

    // 3) Restricción por producto
    if (coupon.product_id && coupon.product_id !== productId) {
      return NextResponse.json({ error: 'Cupón no aplica a este producto' }, { status: 400 })
    }

    // 4) Ventana de validez (time-zone safe)
    const now = new Date()
    if (coupon.starts_at && now < new Date(coupon.starts_at)) {
      return NextResponse.json({ error: 'Cupón aún no está activo' }, { status: 400 })
    }
    if (coupon.expires_at && now > new Date(coupon.expires_at)) {
      return NextResponse.json({ error: 'Cupón expirado' }, { status: 400 })
    }

    // 5) Tope global de redenciones
    if (coupon.max_redemptions != null) {
      const { count, error: rErr } = await supabaseAdmin()
        .from('coupon_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)

      if (rErr) {
        return NextResponse.json({ error: 'No se pudo validar redenciones' }, { status: 500 })
      }
      if ((count ?? 0) >= coupon.max_redemptions) {
        return NextResponse.json({ error: 'Cupón agotado' }, { status: 400 })
      }
    }

    // 6) Cálculo del descuento con redondeo a 2 decimales
    const original = Number(variant.price)
    let discount = 0

    if (coupon.kind === 'PERCENT') {
      // valor entre 0–100 por constraint de BD; clamp por seguridad
      const pct = Math.max(0, Math.min(100, Number(coupon.value)))
      discount = round2((original * pct) / 100)
    } else {
      // AMOUNT: monto fijo, clamp a [0, original]
      discount = Math.max(0, Math.min(original, Number(coupon.value)))
      discount = round2(discount)
    }

    const finalAmount = round2(Math.max(0, original - discount))

    return NextResponse.json({
      ok: true,
      originalAmount: round2(original),
      discount,
      finalAmount,
      currency: variant.currency,
      couponId: coupon.id,
      normalizedCode: String(coupon.code || CODE).toUpperCase(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'NOT_AUTH' }, { status: 401 })
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ ok: false, error: 'NOT_ADMIN' }, { status: 403 })

  const couponId = Number(params.id)
  if (Number.isNaN(couponId)) return NextResponse.json({ ok: false, error: 'ID_INVALID' }, { status: 400 })

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('id, code, kind, value, is_active, product_id, starts_at, expires_at, max_redemptions')
    .eq('id', couponId)
    .maybeSingle()

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  if (!coupon) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 })

  // Conteo de redenciones
  const { count } = await supabase
    .from('coupon_redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('coupon_id', couponId)

  return NextResponse.json({ ok: true, coupon, redemptions_count: count ?? 0 })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'NOT_AUTH' }, { status: 401 })
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ ok: false, error: 'NOT_ADMIN' }, { status: 403 })

  const couponId = Number(params.id)
  if (Number.isNaN(couponId)) return NextResponse.json({ ok: false, error: 'ID_INVALID' }, { status: 400 })

  // Borrar (cascada borra redenciones por FK)
  const { error } = await supabase.from('coupons').delete().eq('id', couponId)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}

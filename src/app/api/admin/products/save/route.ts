import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req: Request) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { id, name, description, kind, is_active, membership_plan_id, variants } = body || {}
    const admin = supabaseAdmin()

    let productId = id
    if (!productId) {
      // crear
      const { data: p, error: e1 } = await admin
        .from('products')
        .insert([{ name, description, kind, is_active, membership_plan_id }])
        .select('id')
        .single()
      if (e1 || !p) return NextResponse.json({ error: e1?.message || 'No se pudo crear' }, { status: 400 })
      productId = p.id
    } else {
      // actualizar
      const { error: e2 } = await admin
        .from('products')
        .update({ name, description, kind, is_active, membership_plan_id })
        .eq('id', productId)
      if (e2) return NextResponse.json({ error: e2.message }, { status: 400 })
    }

    // sincroniza variantes (upsert simple)
    if (Array.isArray(variants)) {
      for (const v of variants) {
        if (v.id) {
          const { error } = await admin
            .from('product_variants')
            .update({
              name: v.name, duration_days: v.duration_days, price: v.price, currency: v.currency,
              is_active: v.is_active, sort_order: v.sort_order
            })
            .eq('id', v.id)
          if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        } else {
          const { error } = await admin
            .from('product_variants')
            .insert([{
              product_id: productId, name: v.name, duration_days: v.duration_days, price: v.price,
              currency: v.currency, is_active: v.is_active, sort_order: v.sort_order
            }])
          if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        }
      }
    }

    return NextResponse.json({ ok: true, id: productId })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

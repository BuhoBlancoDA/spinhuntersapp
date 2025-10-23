// src/app/api/admin/products/save/route.ts
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

    const body = await req.json().catch(() => ({}))
    const { id, name, description, kind, is_active, membership_plan_id, variants } = body || {}
    const admin = supabaseAdmin()

    if (!name || !kind) {
      return NextResponse.json({ error: 'Faltan campos requeridos (name, kind).' }, { status: 400 })
    }

    // Normaliza variantes: fuerza EUR y sort_order secuencial
    const vlist: any[] = Array.isArray(variants) ? variants.map((v: any, idx: number) => ({
      id: v?.id || null,
      name: (v?.name ?? '').trim() || 'Variante',
      duration_days: (kind === 'MEMBERSHIP') ? (v?.duration_days ?? 30) : null,
      price: Number(v?.price ?? 0),
      currency: 'EUR',
      is_active: v?.is_active ?? true,
      sort_order: (idx + 1) * 10,
    })) : []

    // Precio del producto = mínimo precio de las variantes (exige al menos una variante válida)
    const numericPrices = vlist
      .map(v => v.price)
      .filter(p => Number.isFinite(p))
      .sort((a, b) => a - b)

    if (numericPrices.length === 0) {
      return NextResponse.json({ error: 'Debes añadir al menos una variante con precio válido (EUR).' }, { status: 400 })
    }
    const productPrice = numericPrices[0]

    let productId = id

    if (!productId) {
      // crear producto con price NOT NULL (EUR implícito en variantes)
      const { data: p, error: e1 } = await admin
        .from('products')
        .insert([{
          name,
          description,
          kind,
          is_active,
          membership_plan_id: kind === 'MEMBERSHIP' ? (membership_plan_id || null) : null,
          price: productPrice,           // <- asegura NOT NULL
        }])
        .select('id')
        .single()
      if (e1 || !p) return NextResponse.json({ error: e1?.message || 'No se pudo crear' }, { status: 400 })
      productId = p.id
    } else {
      // actualizar producto (incluye recalcular price)
      const { error: e2 } = await admin
        .from('products')
        .update({
          name,
          description,
          kind,
          is_active,
          membership_plan_id: kind === 'MEMBERSHIP' ? (membership_plan_id || null) : null,
          price: productPrice,           // <- asegura NOT NULL
        })
        .eq('id', productId)
      if (e2) return NextResponse.json({ error: e2.message }, { status: 400 })
    }

    // Sincroniza variantes (upsert simple)
    for (const v of vlist) {
      if (v.id) {
        const { error } = await admin
          .from('product_variants')
          .update({
            name: v.name,
            duration_days: v.duration_days,
            price: v.price,
            currency: 'EUR',            // <- siempre EUR
            is_active: v.is_active,
            sort_order: v.sort_order
          })
          .eq('id', v.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      } else {
        const { error } = await admin
          .from('product_variants')
          .insert([{
            product_id: productId,
            name: v.name,
            duration_days: v.duration_days,
            price: v.price,
            currency: 'EUR',            // <- siempre EUR
            is_active: v.is_active,
            sort_order: v.sort_order
          }])
        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json({ ok: true, id: productId })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

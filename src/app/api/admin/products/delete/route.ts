// src/app/api/admin/products/delete/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function DELETE(req: Request) {
  try {
    const supabase = supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // id por query (?id=...) o body JSON { id }
    const url = new URL(req.url)
    let id = url.searchParams.get('id')
    if (!id) {
      const body = await req.json().catch(() => ({}))
      id = body?.id
    }
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    const admin = supabaseAdmin()

    // 1) Borrar variantes primero (evita violaciones de FK)
    const { error: vErr } = await admin
      .from('product_variants')
      .delete()
      .eq('product_id', id)
    if (vErr) return NextResponse.json({ error: vErr.message }, { status: 400 })

    // 2) Borrar producto
    const { error: pErr } = await admin
      .from('products')
      .delete()
      .eq('id', id)
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

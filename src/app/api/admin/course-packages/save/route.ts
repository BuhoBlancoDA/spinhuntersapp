import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

type Payload = {
  id?: number
  code: string
  slug: string
  title: string
  description?: string | null
  is_active: boolean
  default_duration_days?: number | null
  course_ids: number[] // cursos existentes a incluir
}

export async function POST(req: Request) {
  const supabase = supabaseServer()
  const { data:{ user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok:false, error:'NOT_AUTH' }, { status:401 })
  const { data:isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ ok:false, error:'NOT_ADMIN' }, { status:403 })

  const body = await req.json() as Payload
  const row = {
    code: (body.code||'').trim().toUpperCase(),
    slug: (body.slug||'').trim().toLowerCase(),
    title: (body.title||'').trim(),
    description: body.description ?? null,
    is_active: !!body.is_active,
    default_duration_days: body.default_duration_days ?? null
  }
  if (!row.code || !row.slug || !row.title) return NextResponse.json({ ok:false, error:'VALIDATION' }, { status:400 })

  let pkgId = body.id
  if (pkgId) {
    const { error } = await supabase.from('course_packages').update(row).eq('id', pkgId)
    if (error) return NextResponse.json({ ok:false, error:error.message }, { status:400 })
  } else {
    const { data, error } = await supabase.from('course_packages').insert(row).select('id').maybeSingle()
    if (error) return NextResponse.json({ ok:false, error:error.message }, { status:400 })
    pkgId = data?.id as number
  }

  // Reemplazar items del paquete
  await supabase.from('course_package_items').delete().eq('package_id', pkgId!)
  if ((body.course_ids || []).length) {
    const rows = body.course_ids.map(cid => ({ package_id: pkgId!, course_id: cid }))
    const { error: insErr } = await supabase.from('course_package_items').insert(rows)
    if (insErr) return NextResponse.json({ ok:false, error:insErr.message }, { status:400 })
  }

  return NextResponse.json({ ok:true, id: pkgId })
}

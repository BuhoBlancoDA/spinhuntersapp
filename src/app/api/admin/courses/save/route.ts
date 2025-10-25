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
}

export async function POST(req: Request) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
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

  if (!row.code || !row.slug || !row.title) {
    return NextResponse.json({ ok:false, error:'VALIDATION' }, { status:400 })
  }

  if (body.id) {
    const { data, error } = await supabase.from('courses').update(row).eq('id', body.id).select('id').maybeSingle()
    if (error) return NextResponse.json({ ok:false, error:error.message }, { status:400 })
    return NextResponse.json({ ok:true, id:data?.id })
  } else {
    const { data, error } = await supabase.from('courses').insert(row).select('id').maybeSingle()
    if (error) return NextResponse.json({ ok:false, error:error.message }, { status:400 })
    return NextResponse.json({ ok:true, id:data?.id })
  }
}

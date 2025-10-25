import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(_req:Request, { params }:{ params:{ id:string }}) {
  const supabase = supabaseServer()
  const { data:{ user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok:false, error:'NOT_AUTH' }, { status:401 })
  const { data:isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ ok:false, error:'NOT_ADMIN' }, { status:403 })

  const id = Number(params.id)
  const { data, error } = await supabase.from('courses').select('*').eq('id', id).maybeSingle()
  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:400 })
  if (!data) return NextResponse.json({ ok:false, error:'NOT_FOUND' }, { status:404 })
  return NextResponse.json({ ok:true, course:data })
}

export async function DELETE(_req:Request, { params }:{ params:{ id:string }}) {
  const supabase = supabaseServer()
  const { data:{ user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok:false, error:'NOT_AUTH' }, { status:401 })
  const { data:isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ ok:false, error:'NOT_ADMIN' }, { status:403 })

  const id = Number(params.id)
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:400 })
  return NextResponse.json({ ok:true })
}

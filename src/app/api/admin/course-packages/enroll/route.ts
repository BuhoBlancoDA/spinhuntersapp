import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const supabase = supabaseServer()
  const { data:{ user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok:false, error:'NOT_AUTH' }, { status:401 })
  const { data:isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ ok:false, error:'NOT_ADMIN' }, { status:403 })

  const body = await req.json().catch(()=>({})) as {
    package_id: number
    user_id?: string|null
    email?: string|null
    username?: string|null
    no_expiration?: boolean|null
    duration_days?: number|null
    end_at?: string|null
    status?: 'ACTIVE'|'PENDING'|'CANCELLED'|'EXPIRED'
  }
  if (!body.package_id) return NextResponse.json({ ok:false, error:'PACKAGE_ID_REQUIRED' }, { status:400 })

  // Resolver user_id: por id directo, o por email/username en profiles
  let targetUserId = body.user_id || null
  if (!targetUserId && (body.email || body.username)) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('id')
      .or([
        body.email ? `email.eq.${body.email}` : 'id.eq.00000000-0000-0000-0000-000000000000',
        body.username ? `username.eq.${body.username}` : 'id.eq.00000000-0000-0000-0000-000000000000'
      ].join(','))
      .maybeSingle()
    targetUserId = prof?.id || null
  }
  if (!targetUserId && body.email) {
    const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: au } = await service.auth.admin.listUsers({ page:1, perPage:1, email: body.email })
    targetUserId = au?.users?.[0]?.id || null
  }
  if (!targetUserId) return NextResponse.json({ ok:false, error:'USER_NOT_FOUND' }, { status:404 })

  const startAt = new Date().toISOString()
  let endAt: string | null = null
  if (body.no_expiration) endAt = null
  else if (body.end_at) endAt = new Date(body.end_at).toISOString()
  else if (body.duration_days && body.duration_days > 0) {
    const end = new Date(startAt); end.setUTCDate(end.getUTCDate() + body.duration_days); endAt = end.toISOString()
  }

  // Llamar RPC transaccional
  const { data: rpc, error: rpcErr } = await supabase.rpc('enroll_package_user', {
    p_package_id: body.package_id,
    p_user_id: targetUserId,
    p_start_at: startAt,
    p_end_at: endAt,
    p_status: body.status || 'ACTIVE'
  })

  if (rpcErr) return NextResponse.json({ ok:false, error: rpcErr.message }, { status:400 })
  if (!rpc?.ok) return NextResponse.json({ ok:false, error: rpc?.error || 'RPC_FAILED' }, { status:400 })

  return NextResponse.json({ ok:true })
}

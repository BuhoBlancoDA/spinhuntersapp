import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const supabase = supabaseServer()
  const { data:{ user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok:false, error:'NOT_AUTH' }, { status:401 })
  const { data:isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) return NextResponse.json({ ok:false, error:'NOT_ADMIN' }, { status:403 })

  const body = await req.json().catch(() => ({} as any)) as {
    course_id: number
    user_id?: string | null
    email?: string | null
    status?: 'ACTIVE'|'PENDING'|'CANCELLED'|'EXPIRED'
    start_at?: string | null
    duration_days?: number | null     // prioridad sobre end_at
    end_at?: string | null            // si viene, se respeta
    no_expiration?: boolean | null
  }

  if (!body.course_id) return NextResponse.json({ ok:false, error:'COURSE_ID_REQUIRED' }, { status:400 })

  // Resolver usuario: preferimos user_id, luego email
  let targetUserId = body.user_id || null
  if (!targetUserId) {
    const service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: au, error: auErr } = await service.auth.admin.listUsers({ page:1, perPage:1, email: body.email || undefined })
    if (auErr) return NextResponse.json({ ok:false, error:'USER_LOOKUP_FAILED' }, { status:500 })
    const found = (au?.users || [])[0]
    if (!found) return NextResponse.json({ ok:false, error:'USER_NOT_FOUND' }, { status:404 })
    targetUserId = found.id
  }

  // Calcular fechas
  const startAtIso = body.start_at ? new Date(body.start_at).toISOString() : new Date().toISOString()
  let endAtIso: string | null = null

  if (body.no_expiration) {
    endAtIso = null
  } else if (body.end_at) {
    endAtIso = new Date(body.end_at).toISOString()
  } else if (body.duration_days && body.duration_days > 0) {
    const end = new Date(startAtIso)
    end.setUTCDate(end.getUTCDate() + body.duration_days)
    endAtIso = end.toISOString()
  } else {
    endAtIso = null
  }

  const status = body.status || 'ACTIVE'

  // Upsert por uq(course_id, user_id)
  const { data, error } = await supabase
    .from('course_enrollments')
    .upsert({
      course_id: body.course_id,
      user_id: targetUserId,
      status,
      start_at: startAtIso,
      end_at: endAtIso,
      added_by: user.id
    }, { onConflict: 'course_id,user_id' })
    .select('id')
    .maybeSingle()

  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:400 })
  return NextResponse.json({ ok:true, id: data?.id })
}

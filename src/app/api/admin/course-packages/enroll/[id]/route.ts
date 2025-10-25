import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

type Status = 'ACTIVE'|'PENDING'|'CANCELLED'|'EXPIRED'

function toIsoOrNull(v?: string | null) {
  if (v === null) return null
  if (!v) return undefined
  return new Date(v).toISOString()
}

async function guard(sb: ReturnType<typeof supabaseServer>) {
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { err: NextResponse.json({ error: 'NOT_AUTH' }, { status: 401 }) }
  const { data: isAdmin } = await sb.rpc('is_admin')
  if (!isAdmin) return { err: NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) }
  return { ok: true as const }
}

export async function PATCH(req: Request, { params }:{ params:{ id: string }}) {
  const sb = supabaseServer()
  const g = await guard(sb); if ('err' in g) return g.err

  const id = Number(params.id)
  const body = await req.json().catch(()=>({})) as {
    status?: Status
    start_at?: string | null
    end_at?: string | null
    no_expiration?: boolean
    expire_now?: boolean
    duration_days?: number
  }

  const updates: any = {}
  if (body.status) updates.status = body.status

  if (body.expire_now) {
    updates.status = 'EXPIRED'
    updates.end_at = new Date().toISOString()
  } else {
    const s = toIsoOrNull(body.start_at)
    const e = body.no_expiration ? null : toIsoOrNull(body.end_at)
    if (s !== undefined) updates.start_at = s
    if (e !== undefined) updates.end_at = e

    if (!body.no_expiration && body.duration_days && body.duration_days > 0) {
      const base = new Date(
        updates.start_at ||
        (await (async () => {
          const { data } = await sb.from('course_package_enrollments').select('start_at').eq('id', id).maybeSingle()
          return data?.start_at || new Date().toISOString()
        })())
      )
      base.setUTCDate(base.getUTCDate() + body.duration_days)
      updates.end_at = base.toISOString()
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'NO_CHANGES' }, { status: 400 })
  }

  const { error } = await sb.from('course_package_enrollments').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }:{ params:{ id: string }}) {
  const sb = supabaseServer()
  const g = await guard(sb); if ('err' in g) return g.err
  const id = Number(params.id)
  const { error } = await sb.from('course_package_enrollments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

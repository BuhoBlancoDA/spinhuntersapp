import { supabaseServer } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import EnrollmentForm from '@/components/admin/EnrollmentForm'
import EnrollmentRowEditor from '@/components/admin/EnrollmentRowEditor'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function CourseEnrollmentsPage({
  params,
  searchParams
}:{ params:{ id:string }, searchParams?: { q?: string } }) {
  const supabase = supabaseServer()
  const { data:{ user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')
  const { data:isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  const courseId = Number(params.id)
  const q = (searchParams?.q || '').trim()

  const [{ data:course }, { data:enrollsRaw }] = await Promise.all([
    supabase.from('courses').select('id, title, code').eq('id', courseId).maybeSingle(),
    supabase
      .from('course_enrollments')
      .select('id, user_id, status, start_at, end_at, created_at')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
      .limit(200)
  ])
  if (!course) notFound()

  const enrolls = enrollsRaw || []
  const userIds = Array.from(new Set(enrolls.map(e => e.user_id).filter(Boolean))) as string[]

  // Perfiles (username/full_name)
  let profiles: Array<{ user_id: string; username: string | null; full_name: string | null }> = []
  if (userIds.length) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('user_id, username, full_name')
      .in('user_id', userIds)
    profiles = profs || []
  }
  const profMap = new Map(profiles.map(p => [p.user_id, p]))

  // Emails desde auth.users (RPC admin)
  let emails: Array<{ user_id: string; email: string | null }> = []
  if (userIds.length) {
    const { data: emailsData } = await supabase.rpc('admin_emails_for_ids', { uids: userIds })
    emails = (emailsData as any[]) || []
  }
  const emailMap = new Map(emails.map(e => [e.user_id, e.email || null]))

  // Filtrado por email o username (NO por user_id)
  const filtered = q
    ? enrolls.filter(e => {
        const p = profMap.get(e.user_id as string)
        const uname = (p?.username || '').toLowerCase()
        const mail = (emailMap.get(e.user_id as string) || '').toLowerCase()
        const needle = q.toLowerCase()
        return uname.includes(needle) || mail.includes(needle)
      })
    : enrolls

  const fmt = (iso?: string | null) => iso ? new Date(iso).toLocaleString() : ''

  const StatusChip = ({ s }: { s: string }) => {
    const base = 'text-[11px] px-2 py-0.5 rounded border tracking-wide'
    if (s === 'ACTIVE') return <span className={`${base} border-cyan-400/40 text-cyan-300 bg-cyan-500/10`}>{s}</span>
    if (s === 'PENDING') return <span className={`${base} border-amber-400/40 text-amber-300 bg-amber-500/10`}>{s}</span>
    if (s === 'EXPIRED') return <span className={`${base} border-white/20 text-white/70 bg-white/5`}>{s}</span>
    return <span className={`${base} border-white/20 text-white/70 bg-white/5`}>{s}</span>
  }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image src="/Hero/hero-mobile.webp" alt="" fill className="object-cover md:hidden" priority />
        <Image src="/Hero/hero-desktop.webp" alt="" fill className="hidden md:block object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10 md:py-14 space-y-6">
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link href="/admin/courses" className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">← Volver a cursos</Link>
              <h1 className="text-2xl font-bold">Inscripciones — {course.title} <span className="text-white/70 text-base">({course.code})</span></h1>
            </div>
            <Link href={`/admin/courses/${course.id}`} className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">Editar curso</Link>
          </div>

          <form method="get" className="mt-6 flex gap-2">
            <input name="q" defaultValue={q} placeholder="Buscar por email o @usuario…" className="dark-input w-full"/>
            {q && <Link href="?" className="btn-ghost whitespace-nowrap">Limpiar</Link>}
            <button className="btn-brand whitespace-nowrap">Buscar</button>
          </form>

          <div aria-hidden className="mt-6 hud-divider" />
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-5 sm:p-6">
          <h2 className="text-lg font-semibold mb-3">Añadir inscripción</h2>
          <EnrollmentForm courseId={courseId} />
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-3 text-xs uppercase tracking-wider text-white/60 bg-white/5 border-b border-white/10">
            <div className="col-span-6">Usuario / Estado</div>
            <div className="col-span-6 text-right sm:text-left">Controles</div>
          </div>

          <ul className="divide-y divide-white/10">
            {filtered.map(e => {
              const p = profMap.get(e.user_id as string)
              const userMain = p?.username ? `@${p.username}` : (p?.full_name || 'Usuario')
              const userMail = emailMap.get(e.user_id as string) || '—'
              return (
                <li key={e.id} className="px-4 py-3 hover:bg-white/[0.035] transition">
                  <div className="grid grid-cols-12 items-start gap-3">
                    <div className="col-span-6 min-w-0">
                      <div className="text-sm truncate">
                        <b>{userMain}</b> <span className="text-white/60">· {userMail}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/70">
                        <StatusChip s={e.status} />
                        <span>{e.start_at ? new Date(e.start_at).toLocaleString() : ''} — {e.end_at ? new Date(e.end_at).toLocaleString() : 'sin expiración'}</span>
                      </div>
                    </div>
                    <div className="col-span-6">
                      <EnrollmentRowEditor
                        kind="course"
                        id={e.id}
                        initialStatus={e.status as any}
                        startAt={e.start_at}
                        endAt={e.end_at}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
            {filtered.length === 0 && <li className="p-5 text-sm text-white/70">Sin inscripciones.</li>}
          </ul>
        </section>
      </div>
    </main>
  )
}

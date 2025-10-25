import { supabaseServer } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import EnrollmentFormPackage from '@/components/admin/EnrollmentFormPackage'
import EnrollmentRowEditor from '@/components/admin/EnrollmentRowEditor'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function PackageEnrollmentsPage({
  params,
  searchParams
}:{ params:{ id:string }, searchParams?: { q?: string } }) {
  const supabase = supabaseServer()
  const { data:{ user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')
  const { data:isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  const packageId = Number(params.id)
  const q = (searchParams?.q || '').trim()

  const [{ data: pkg }, { data: enrollsRaw }] = await Promise.all([
    supabase.from('course_packages').select('id, title, code').eq('id', packageId).maybeSingle(),
    supabase
      .from('course_package_enrollments')
      .select('id, user_id, status, start_at, end_at, created_at')
      .eq('package_id', packageId)
      .order('created_at', { ascending: false })
      .limit(200)
  ])
  if (!pkg) notFound()

  const enrolls = enrollsRaw || []
  const userIds = Array.from(new Set(enrolls.map(e => e.user_id).filter(Boolean))) as string[]

  // Perfiles
  let profiles: Array<{ user_id: string; username: string | null; full_name: string | null }> = []
  if (userIds.length) {
    const { data: profs } = await supabase
      .from('profiles')
      .select('user_id, username, full_name')
      .in('user_id', userIds)
    profiles = profs || []
  }
  const profMap = new Map(profiles.map(p => [p.user_id, p]))

  // Emails (RPC admin)
  let emails: Array<{ user_id: string; email: string | null }> = []
  if (userIds.length) {
    const { data: emailsData } = await supabase.rpc('admin_emails_for_ids', { uids: userIds })
    emails = (emailsData as any[]) || []
  }
  const emailMap = new Map(emails.map(e => [e.user_id, e.email || null]))

  const filtered = q
    ? enrolls.filter(e => {
        const p = profMap.get(e.user_id as string)
        const uname = (p?.username || '').toLowerCase()
        const mail = (emailMap.get(e.user_id as string) || '').toLowerCase()
        const needle = q.toLowerCase()
        return uname.includes(needle) || mail.includes(needle)
      })
    : enrolls

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
              <Link href="/admin/course-packages" className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">← Volver a paquetes</Link>
              <h1 className="text-2xl font-bold">Inscripciones — {pkg.title} ({pkg.code})</h1>
            </div>
            <Link href={`/admin/course-packages/${packageId}`} className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">Editar paquete</Link>
          </div>

          <form method="get" className="mt-6 flex gap-2">
            <input name="q" defaultValue={q} placeholder="Buscar por email o @usuario…" className="dark-input w-full"/>
            {q && <Link href="?" className="btn-ghost whitespace-nowrap">Limpiar</Link>}
            <button className="btn-brand whitespace-nowrap">Buscar</button>
          </form>

          <div aria-hidden className="mt-6 hud-divider" />
        </section>

        <EnrollmentFormPackage packageId={packageId} />

        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-3 text-xs uppercase tracking-wider text-white/60 bg-white/5 border-b border-white/10">
            <div className="col-span-7">Usuario / Estado</div>
            <div className="col-span-5 text-right sm:text-left">Controles</div>
          </div>

          <ul className="divide-y divide-white/10">
            {filtered.map(e => {
              const p = profMap.get(e.user_id as string)
              const userMain = p?.username ? `@${p.username}` : (p?.full_name || 'Usuario')
              const userMail = emailMap.get(e.user_id as string) || '—'
              return (
                <li key={e.id} className="px-4 py-3 hover:bg-white/[0.035] transition">
                  <div className="grid grid-cols-12 items-center gap-3">
                    <div className="col-span-7 min-w-0">
                      <div className="text-sm truncate">
                        <b>{userMain}</b> <span className="text-white/60">· {userMail}</span>
                      </div>
                      <div className="text-xs text-white/60">
                        {e.status} · desde {new Date(e.start_at).toLocaleString()}
                        {e.end_at ? ` · hasta ${new Date(e.end_at).toLocaleString()}` : ' · sin expiración'}
                      </div>
                    </div>
                    <div className="col-span-5 flex justify-end sm:justify-start">
                      <EnrollmentRowEditor
                        kind="package"
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

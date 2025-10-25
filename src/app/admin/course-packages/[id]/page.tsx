import { supabaseServer } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import PackageEditor from '@/components/admin/PackageEditor'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function AdminPackageEditPage({ params }:{ params:{ id:string }}) {
  const supabase = supabaseServer()
  const { data:{ user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')
  const { data:isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  const pkgId = Number(params.id)
  const [{ data: pkg }, { data: items }, { data: courses }] = await Promise.all([
    supabase
      .from('course_packages')
      .select('id, code, slug, title, description, is_active, default_duration_days')
      .eq('id', pkgId)
      .maybeSingle(),
    supabase.from('course_package_items').select('course_id').eq('package_id', pkgId),
    supabase.from('courses').select('id, title, code, is_active').order('title', { ascending: true })
  ])

  if (!pkg) notFound()

  const pkgWithCourses = { ...pkg, course_ids: (items || []).map(i => i.course_id) }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Fondo hero + overlay */}
      <div className="absolute inset-0 -z-10">
        <Image src="/Hero/hero-mobile.webp" alt="" fill className="object-cover md:hidden" priority />
        <Image src="/Hero/hero-desktop.webp" alt="" fill className="hidden md:block object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 md:py-14 space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/course-packages"
                className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                ← Volver a paquetes
              </Link>
              <h1 className="text-2xl font-bold">Editar paquete</h1>
            </div>
            <Link
              href={`/admin/course-packages/${pkgId}/enrollments`}
              className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Inscripciones
            </Link>
          </div>
          <div aria-hidden className="mt-6 hud-divider" />
        </section>

        {/* Editor */}
        <PackageEditor pkg={pkgWithCourses as any} courses={(courses || []) as any} />
      </div>
    </main>
  )
}

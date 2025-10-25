// src/app/admin/courses/page.tsx
import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function AdminCoursesPage() {
  const supabase = supabaseServer()
  const { data:{ user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')
  const { data:isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  const { data:courses } = await supabase
    .from('courses')
    .select('id, code, slug, title, is_active, default_duration_days, created_at')
    .order('id', { ascending:false })
    .limit(200)

  const StatusChip = ({ active }: { active: boolean }) => (
    <span
      className={[
        'text-[11px] px-2 py-0.5 rounded border tracking-wide',
        active
          ? 'border-cyan-400/40 text-cyan-300 bg-cyan-500/10'
          : 'border-white/20 text-white/60 bg-white/5',
      ].join(' ')}
    >
      {active ? 'Activo' : 'Inactivo'}
    </span>
  )

  const CodeChip = ({ code }: { code: string }) => (
    <span className="text-[11px] px-2 py-0.5 rounded border border-white/15 bg-white/5 text-white/70">
      {code}
    </span>
  )

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Fondo hero */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/Hero/hero-mobile.webp"
          alt=""
          fill
          className="object-cover md:hidden"
          priority
        />
        <Image
          src="/Hero/hero-desktop.webp"
          alt=""
          fill
          className="hidden md:block object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10 md:py-14 space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                ← Volver al panel
              </Link>
              <h1 className="text-2xl font-bold">Cursos</h1>
            </div>

            <Link
              href="/admin/courses/new"
              className="btn-brand"
            >
              Nuevo curso
            </Link>
          </div>
          <div aria-hidden className="mt-6 hud-divider" />
        </section>

        {/* Sección rápida: Paquetes de cursos */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <h2 className="text-lg font-semibold">Paquetes de cursos</h2>
              <p className="text-sm text-white/70 mt-1">
                Agrupa varios cursos en una sola oferta y gestiona sus inscripciones y duraciones por paquete.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/course-packages"
                className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                Gestionar paquetes
              </Link>
              <Link
                href="/admin/course-packages/new"
                className="btn-brand"
              >
                Nuevo paquete
              </Link>
            </div>
          </div>
        </section>

        {/* Lista de cursos */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md overflow-hidden">
          {/* Encabezado tipo tabla */}
          <div className="grid grid-cols-12 px-4 py-3 text-xs uppercase tracking-wider text-white/60 bg-white/5 border-b border-white/10">
            <div className="col-span-7">Curso</div>
            <div className="col-span-3">Estado</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>

          <ul className="divide-y divide-white/10">
            {(courses||[]).map(c => (
              <li key={c.id} className="px-4 py-3 hover:bg-white/[0.035] transition">
                <div className="grid grid-cols-12 items-center gap-3">
                  {/* Curso */}
                  <div className="col-span-7 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <b className="truncate">{c.title}</b>
                      <CodeChip code={c.code} />
                    </div>
                    <div className="text-xs text-white/60 mt-0.5 truncate">
                      slug: {c.slug}
                      {c.default_duration_days ? ` · default: ${c.default_duration_days} días` : ''}
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="col-span-3">
                    <StatusChip active={!!c.is_active} />
                  </div>

                  {/* Acciones */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/courses/${c.id}`}
                      className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
                    >
                      Editar
                    </Link>
                    <Link
                      href={`/admin/courses/${c.id}/enrollments`}
                      className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
                    >
                      Inscripciones
                    </Link>
                  </div>
                </div>
              </li>
            ))}

            {(courses||[]).length === 0 && (
              <li className="p-5 text-sm text-white/70">Sin cursos.</li>
            )}
          </ul>
        </section>
      </div>
    </main>
  )
}

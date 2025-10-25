// src/app/courses/page.tsx
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { supabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import PurchaseButton from '@/app/dashboard/components/PurchaseButton'

export default async function CoursesCatalogPage() {
  const sb = supabaseServer()

  // Cursos activos
  const { data: courses } = await sb
    .from('courses')
    .select('id, title, slug, description, is_active, default_duration_days')
    .eq('is_active', true)
    .order('title', { ascending: true })

  // Paquetes activos (si existen)
  const { data: packages } = await sb
    .from('course_packages')
    .select('id, title, slug, description, is_active, default_duration_days')
    .eq('is_active', true)
    .order('title', { ascending: true })

  // Catálogo para Purchase Modal (mismo flujo que Dashboard)
  const { data: products } = await sb
    .from('products')
    .select('id, name, kind, description, membership_plan_id, is_active')
    .eq('is_active', true)

  let variantsByProduct: Record<string, any[]> = {}
  if (products && products.length) {
    const ids = products.map(p => p.id)
    const { data: variants } = await sb
      .from('product_variants')
      .select('id, product_id, name, duration_days, price, currency, is_active, sort_order')
      .in('product_id', ids)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    variantsByProduct = (variants || []).reduce((acc, v) => {
      (acc[v.product_id] ||= []).push(v)
      return acc
    }, {} as Record<string, any[]>)
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cursos</h1>
        {Array.isArray(products) && products.length > 0 && (
          <PurchaseButton
            products={(products || []).map(p => ({ ...p, variants: variantsByProduct[p.id] || [] }))}
          />
        )}
      </header>

      {/* Cursos */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cursos disponibles</h2>
        {(courses || []).length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
            No hay cursos activos por el momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(courses || []).map(c => (
              <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 flex flex-col gap-3">
                <div className="text-sm font-semibold">{c.title}</div>
                {c.description && <p className="text-xs text-white/70 line-clamp-3">{c.description}</p>}
                <div className="flex justify-between items-center">
                  <Link href={`/courses/${c.slug}`} className="text-sm underline">Ver curso</Link>
                  {/* El flujo de compra está arriba en el botón general */}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Paquetes */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Paquetes de cursos</h2>
        {(packages || []).length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
            No hay paquetes activos por el momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(packages || []).map(p => (
              <div key={p.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-sm font-semibold">{p.title}</div>
                {p.description && <p className="mt-1 text-xs text-white/70 line-clamp-3">{p.description}</p>}
                {/* Si luego quieres páginas públicas de paquete, aquí puedes linkear /course-packages/[slug] */}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

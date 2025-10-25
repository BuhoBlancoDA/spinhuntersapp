// src/app/courses/[slug]/page.tsx
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { supabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'
import PurchaseButton from '@/app/dashboard/components/PurchaseButton'
import { redirect, notFound } from 'next/navigation'

export default async function CoursePage({ params }:{ params:{ slug: string }}) {
  const sb = supabaseServer()
  const { data: { user } } = await sb.auth.getUser().catch(() => ({ data: { user: null } } as any))

  // Curso por slug
  const { data: course } = await sb
    .from('courses')
    .select('id, title, slug, description, is_active')
    .eq('slug', params.slug)
    .maybeSingle()
  if (!course || !course.is_active) notFound()

  // ¿Admin?
  let isAdmin = false
  if (user) {
    try {
      const { data } = await sb.rpc('is_admin')
      isAdmin = !!data
    } catch {}
  }

  // ¿Inscrito?
  let enrolled = false
  if (user) {
    const { data: ok } = await sb.rpc('is_enrolled', { p_course_id: course.id })
    enrolled = !!ok || isAdmin
  }

  // Catálogo para Purchase Modal (mismo flujo)
  const { data: products } = await sb
    .from('products')
    .select('id, name, kind, description, membership_plan_id, is_active')
    .eq('is_active', true)

  let variantsByProduct: Record<string, any[]> = {}
  if (Array.isArray(products) && products.length) {
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
    <main className="mx-auto w-full max-w-3xl px-4 py-10 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        {Array.isArray(products) && products.length > 0 && (
          <PurchaseButton
            products={(products || []).map(p => ({ ...p, variants: variantsByProduct[p.id] || [] }))}
          />
        )}
      </header>

      {!user && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm">
          Para acceder al contenido, <Link href="/auth/sign-in" className="underline">inicia sesión</Link> y si no estás inscrito, adquiere el curso desde el botón.
        </div>
      )}

      {user && !enrolled && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm space-y-2">
          <p className="text-white/85">
            No tienes acceso a este curso todavía.
          </p>
          <p className="text-white/70">
            Puedes adquirirlo con el botón de compra (arriba). Si crees que es un error, abre un <Link href="/support" className="underline">ticket de soporte</Link>.
          </p>
        </div>
      )}

      {(user && enrolled) && (
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-semibold">Contenido del curso</h2>
          <p className="text-sm text-white/80">
            Aquí irá el contenido privado del curso (lecciones, recursos, etc.).<br/>
            Esta página ya está “gateada” con <code>is_enrolled({`{ p_course_id: course.id }`})</code>.
          </p>

          {/* 👇 Ejemplo de secciones futuras (placeholders) */}
          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-sm font-semibold">Módulo 1</div>
              <div className="text-xs text-white/70">Próximamente…</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-sm font-semibold">Recursos</div>
              <div className="text-xs text-white/70">Próximamente…</div>
            </div>
          </div>
        </section>
      )}

      {course.description && (
        <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div className="text-sm font-semibold mb-1">Descripción</div>
          <p className="text-sm text-white/80">{course.description}</p>
        </section>
      )}
    </main>
  )
}

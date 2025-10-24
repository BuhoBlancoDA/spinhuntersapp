// src/app/admin/coupons/page.tsx
import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function AdminCouponsPage() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  const { data: coupons } = await supabase
    .from('coupons')
    .select('id, code, kind, value, is_active, product_id, starts_at, expires_at, max_redemptions')
    .order('id', { ascending: false })
    .limit(200)

  const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : null)

  const StatusChip = ({ active }: { active: boolean }) => (
    <span className={[
      'text-[11px] px-2 py-0.5 rounded border tracking-wide',
      active ? 'border-cyan-400/40 text-cyan-300 bg-cyan-500/10'
             : 'border-white/20 text-white/70 bg-white/5'
    ].join(' ')}>{active ? 'ACTIVO' : 'INACTIVO'}</span>
  )

  const ScopeChip = ({ product }: { product?: string | number | null }) => (
    <span className="text-[11px] px-2 py-0.5 rounded border border-white/15 bg-white/5 text-white/70">
      {product ? 'Solo producto' : 'Global'}
    </span>
  )

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Fondo coherente */}
      <div className="absolute inset-0 -z-10">
        <Image src="/Hero/hero-mobile.webp" alt="" fill className="object-cover md:hidden" priority />
        <Image src="/Hero/hero-desktop.webp" alt="" fill className="hidden md:block object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-10 md:py-14 space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/products"
                className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                ← Volver a productos
              </Link>
              <h1 className="text-2xl font-bold">Cupones</h1>
            </div>
            <Link
              href="/admin/coupons/new"
              className="inline-flex items-center rounded-lg bg-brand text-white px-3 py-2 hover:bg-brand/90 transition shadow-glow text-sm"
            >
              Nuevo cupón
            </Link>
          </div>
          <div aria-hidden className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </section>

        {/* Listado */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md overflow-hidden">
          {(coupons || []).length === 0 ? (
            <div className="p-5 text-sm text-white/70">Sin cupones.</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {(coupons || []).map(c => (
                <li key={c.id} className="px-4 py-3 hover:bg-white/[0.04] transition">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold tracking-wide">{c.code}</span>
                        <StatusChip active={!!c.is_active} />
                        <ScopeChip product={c.product_id} />
                        <span className="text-[11px] px-2 py-0.5 rounded border border-white/15 bg-white/5 text-white/70">
                          {c.kind} · {c.value}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-white/60 flex flex-wrap gap-2">
                        {fmtDate(c.starts_at) && <span>Desde {fmtDate(c.starts_at)}</span>}
                        {fmtDate(c.expires_at) && <span>· Hasta {fmtDate(c.expires_at)}</span>}
                        {c.max_redemptions != null && <span>· Máx {c.max_redemptions}</span>}
                        {c.product_id && <span>· Producto ID: {c.product_id}</span>}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Link
                        href={`/admin/coupons/${c.id}`}
                        className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

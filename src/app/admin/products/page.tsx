// src/app/admin/products/page.tsx
import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import DeleteButton from './DeleteButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function AdminProductsPage() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  const { data: products } = await supabase
    .from('products')
    .select('id, name, kind, is_active')
    .order('name', { ascending: true })

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

  const KindChip = ({ kind }: { kind: 'COURSE' | 'MEMBERSHIP' }) => (
    <span className="text-[11px] px-2 py-0.5 rounded border border-white/15 bg-white/5 text-white/70">
      {kind === 'MEMBERSHIP' ? 'Membresía' : 'Curso'}
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
              <h1 className="text-2xl font-bold">Productos</h1>
            </div>

            <Link
              href="/admin/products/new"
              className="inline-flex items-center rounded-lg bg-brand text-white px-4 py-2 hover:bg-brand/90 transition shadow-glow"
            >
              Nuevo
            </Link>
          </div>
          <div aria-hidden className="mt-6 hud-divider" />
        </section>

        {/* Acceso a Cupones */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5">🏷️</span>
                <h2 className="text-lg font-semibold">Cupones y promociones</h2>
              </div>
              <p className="mt-2 text-sm text-white/75">
                Crea códigos de descuento y asígnalos a productos o aplícalos de forma global.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/coupons" className="btn-ghost">
                Gestionar cupones
              </Link>
              <Link href="/admin/coupons/new" className="btn-brand">
                Crear cupón
              </Link>
            </div>
          </div>
        </section>

        {/* Lista */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md overflow-hidden">
          {/* Encabezado tipo tabla */}
          <div className="grid grid-cols-12 px-4 py-3 text-xs uppercase tracking-wider text-white/60 bg-white/5 border-b border-white/10">
            <div className="col-span-6 sm:col-span-7">Producto</div>
            <div className="col-span-3 sm:col-span-3">Estado</div>
            <div className="col-span-3 sm:col-span-2 text-right">Acciones</div>
          </div>

          {/* Items */}
          <ul className="divide-y divide-white/10">
            {(products || []).map(p => (
              <li key={p.id} className="px-4 py-3 hover:bg-white/[0.035] transition">
                <div className="grid grid-cols-12 items-center gap-3">
                  {/* Producto */}
                  <div className="col-span-6 sm:col-span-7 min-w-0">
                    <div className="flex items-center gap-2">
                      <b className="truncate">{p.name}</b>
                      <KindChip kind={p.kind as any} />
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="col-span-3 sm:col-span-3">
                    <StatusChip active={!!p.is_active} />
                  </div>

                  {/* Acciones */}
                  <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
                    >
                      Editar
                    </Link>
                    <DeleteButton id={String(p.id)} name={p.name} />
                  </div>
                </div>
              </li>
            ))}

            {(products || []).length === 0 && (
              <li className="p-5 text-sm text-white/70">Sin productos.</li>
            )}
          </ul>
        </section>
      </div>
    </main>
  )
}

// src/app/admin/coupons/new/page.tsx
import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import CouponEditor from '@/components/admin/CouponEditor'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function AdminCouponNewPage() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  // Productos activos (para asociar cupón a uno específico)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, is_active')
    .order('name', { ascending: true })

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Fondo coherente */}
      <div className="absolute inset-0 -z-10">
        <Image src="/Hero/hero-mobile.webp" alt="" fill className="object-cover md:hidden" priority />
        <Image src="/Hero/hero-desktop.webp" alt="" fill className="hidden md:block object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10 md:py-14 space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/coupons"
                className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                ← Volver a cupones
              </Link>
              <h1 className="text-2xl font-bold">Nuevo cupón</h1>
            </div>
          </div>
          <div aria-hidden className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </section>

        {/* Editor */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <CouponEditor products={products || []} />
        </section>
      </div>
    </main>
  )
}

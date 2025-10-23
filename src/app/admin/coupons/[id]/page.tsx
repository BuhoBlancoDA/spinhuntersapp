import { supabaseServer } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import CouponEditor from '@/components/admin/CouponEditor' // <-- IMPORT NECESARIO

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function AdminCouponEditPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  const id = Number(params.id)
  if (Number.isNaN(id)) notFound()

  const [
    { data: products },
    { data: coupon, error: couponErr },
    { count: redemptions_count, error: redErr },
  ] = await Promise.all([
    supabase.from('products')
      .select('id, name, is_active')
      .order('name', { ascending: true }),

    supabase.from('coupons')
      .select('id, code, kind, value, is_active, product_id, starts_at, expires_at, max_redemptions')
      .eq('id', id)
      .maybeSingle(),

    supabase.from('coupon_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('coupon_id', id),
  ])

  if (couponErr) throw couponErr
  if (!coupon) notFound()
  if (redErr) throw redErr

  return (
    <main className="min-h-dvh p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Editar cupón</h1>
        <div className="text-sm text-white/70">Redenciones: {redemptions_count ?? 0}</div>
      </div>
      <CouponEditor coupon={coupon} products={products || []} />
    </main>
  )
}

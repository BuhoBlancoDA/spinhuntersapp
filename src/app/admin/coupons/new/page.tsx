import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import CouponEditor from '@/components/admin/CouponEditor'

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
    <main className="min-h-dvh p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Nuevo cupón</h1>
      <CouponEditor products={products || []}/>
    </main>
  )
}

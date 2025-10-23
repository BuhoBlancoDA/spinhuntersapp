import { supabaseServer } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import ProductEditor from '../editor'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function AdminProductEditPage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  const id = params.id
  if (id === 'new') {
    return <ProductEditor mode="new" />
  }

  const { data: product } = await supabase
    .from('products')
    .select('id, name, description, kind, is_active, membership_plan_id')
    .eq('id', id)
    .maybeSingle()

  if (!product) notFound()

  const { data: variants } = await supabase
    .from('product_variants')
    .select('id, name, duration_days, price, currency, is_active, sort_order')
    .eq('product_id', id)
    .order('sort_order', { ascending: true })

  return <ProductEditor mode="edit" product={product} variants={variants || []} />
}

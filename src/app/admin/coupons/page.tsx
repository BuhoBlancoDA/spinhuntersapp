import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

  return (
    <main className="min-h-dvh p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cupones</h1>
        <Link href="/admin/coupons/new" className="underline">Nuevo</Link>
      </div>
      <div className="rounded-lg border border-white/10 divide-y divide-white/10">
        {(coupons || []).map(c => (
          <div key={c.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="text-sm">
                <b>{c.code}</b> — {c.kind} {c.value}
                {c.product_id ? <span className="text-white/60"> (solo producto)</span> : <span className="text-white/60"> (global)</span>}
              </div>
              <div className="text-xs text-white/60">
                {c.is_active ? 'Activo' : 'Inactivo'}
                {c.starts_at && ` · desde ${new Date(c.starts_at).toLocaleDateString()}`}
                {c.expires_at && ` · hasta ${new Date(c.expires_at).toLocaleDateString()}`}
                {c.max_redemptions != null && ` · máx ${c.max_redemptions}`}
              </div>
            </div>
            <Link href={`/admin/coupons/${c.id}`} className="text-sm underline">Editar</Link>
          </div>
        ))}
        {(coupons || []).length === 0 && <div className="p-4 text-sm text-white/70">Sin cupones.</div>}
      </div>
    </main>
  )
}

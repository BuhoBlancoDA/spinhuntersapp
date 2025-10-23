// src/app/admin/products/page.tsx
import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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

  return (
    <main className="min-h-dvh p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">
            ← Volver al panel
          </Link>
          <h1 className="text-2xl font-bold">Productos</h1>
        </div>
        <Link href="/admin/products/new" className="underline">Nuevo</Link>
      </div>

      <div className="rounded-lg border border-white/10 divide-y divide-white/10">
        {(products || []).map(p => (
          <div key={p.id} className="p-3 flex items-center justify-between">
            <div>
              <div className="text-sm"><b>{p.name}</b> — {p.kind}</div>
              <div className="text-xs text-white/60">{p.is_active ? 'Activo' : 'Inactivo'}</div>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/admin/products/${p.id}`} className="text-sm underline">Editar</Link>
              <DeleteButton id={String(p.id)} name={p.name} />
            </div>
          </div>
        ))}
        {(products || []).length === 0 && (
          <div className="p-4 text-sm text-white/70">Sin productos.</div>
        )}
      </div>
    </main>
  )
}

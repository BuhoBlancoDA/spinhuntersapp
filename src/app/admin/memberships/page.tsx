import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import MembershipsTable from './MembershipsTable'
import Link from 'next/link'

export default async function AdminMembershipsPage() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Fondo hero + overlay */}
      <div className="absolute inset-0 -z-10">
        <Image src="/Hero/hero-mobile.webp" alt="" fill className="object-cover md:hidden" priority />
        <Image src="/Hero/hero-desktop.webp" alt="" fill className="hidden md:block object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10 md:py-14 space-y-6">
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Membresía Ultimate</h1>
              <p className="text-sm text-white/70">Gestionar y actualizar los miembros.</p>
            </div>
            <Link href="/admin" className="px-3 py-1.5 rounded border border-white/20 text-white/90 hover:bg-white/5">Volver al panel</Link>
          </div>
          <div aria-hidden className="mt-6 hud-divider" />
        </section>

        <MembershipsTable />
      </div>
    </main>
  )
}

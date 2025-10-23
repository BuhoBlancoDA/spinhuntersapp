// src/app/admin/page.tsx
import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function AdminPage() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  // Contadores de soporte (pendientes = OPEN o IN_PROGRESS) para SUPPORT + PURCHASE
  const { count: openCount } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .in('type', ['SUPPORT', 'PURCHASE'])
    .in('status', ['OPEN', 'IN_PROGRESS'])

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Fondo hero + overlay */}
      <div className="absolute inset-0 -z-10">
        <Image src="/Hero/hero-mobile.webp" alt="" fill className="object-cover md:hidden" priority />
        <Image src="/Hero/hero-desktop.webp" alt="" fill className="hidden md:block object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 md:py-14 space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/80">Admin</span>
            <h1 className="text-2xl font-bold">Panel de administración</h1>
          </div>
          <div aria-hidden className="mt-6 hud-divider" />
        </section>

        {/* Grid de módulos */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Usuarios */}
          <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-5 sm:p-6 flex flex-col">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Usuarios</h2>
              <p className="mt-1 text-sm text-white/70">Editar, modificar o buscar información de los miembros.</p>
            </div>
            <div className="mt-4">
              <Link href="/admin/users" prefetch={false} className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand/90 shadow-glow">
                Gestionar usuarios
              </Link>
            </div>
          </div>

          {/* Membresías */}
          <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-5 sm:p-6 flex flex-col">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Membresías</h2>
              <p className="mt-1 text-sm text-white/70">Gestión y control de miembros activos.</p>
            </div>
            <div className="mt-4">
              <Link href="/admin/memberships" prefetch={false} className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand/90 shadow-glow">
                Gestionar membresías
              </Link>
            </div>
          </div>

          {/* Soporte */}
          <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-5 sm:p-6 flex flex-col">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Soporte</h2>
              <p className="mt-1 text-sm text-white/70">
                Tickets, mensajes y solicitudes pendientes.
              </p>
              <div className="mt-3 text-sm text-white/80">
                Pendientes: <b>{openCount ?? 0}</b>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                href="/admin/tickets"
                prefetch={false}
                className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand/90 shadow-glow"
              >
                Tickets
              </Link>
              <Link
                href="/admin/tickets?pending=1"
                prefetch={false}
                className="inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/15"
                title="Ver OPEN e IN_PROGRESS"
              >
                Pendientes
              </Link>
            </div>
          </div>

          {/* Productos */}
          <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-5 sm:p-6 flex flex-col">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Productos</h2>
              <p className="mt-1 text-sm text-white/70">Crear, editar, activar e inactivar productos y variantes.</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Link href="/admin/products" prefetch={false} className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand/90 shadow-glow">
                Gestionar productos
              </Link>
              <Link href="/admin/products/new" prefetch={false} className="inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/15">
                Nuevo
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

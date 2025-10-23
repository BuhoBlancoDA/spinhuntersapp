// src/app/support/page.tsx
import { supabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import NewTicketForm from './NewTicketForm'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function SupportPage() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Fondo hero + overlay para coherencia visual */}
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

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10 md:py-14 space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5">🛟</span>
              <div>
                <h1 className="text-2xl font-bold">Soporte</h1>
                <p className="text-sm text-white/70">
                  Abre un ticket de ayuda o reporta una compra manual para activación de membresía.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              <span aria-hidden>←</span> Volver al Dashboard
            </Link>
          </div>
          <div aria-hidden className="mt-6 hud-divider" />
        </section>

        {/* Formulario nuevo ticket */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <h2 className="text-lg font-semibold mb-4">Abrir un ticket</h2>
          <NewTicketForm />
        </section>

        {/* Acceso a listado de tickets */}
        <section className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5">🎟️</span>
              <h3 className="font-semibold">Tus tickets</h3>
            </div>
            <Link
              href="/support/my-tickets"
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Ver mis tickets →
            </Link>
          </div>
          <p className="text-xs text-white/70 mt-2">
            Consulta el estado y las respuestas del equipo en tu historial de tickets.
          </p>
        </section>
      </div>
    </main>
  )
}

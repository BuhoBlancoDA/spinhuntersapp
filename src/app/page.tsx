// src/app/page.tsx
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import Link from 'next/link'
import Image from 'next/image'
import { supabaseServer } from '@/lib/supabase'
import { unstable_noStore as noStore } from 'next/cache'

export default async function Home() {
  noStore()

  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-dvh">
      {/* HERO compacto */}
      <section className="relative isolate min-h-[70svh] sm:min-h-[80svh] grid place-items-center overflow-hidden">
        {/* Fondo responsive */}
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
          {/* Overlay más denso para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/50" />
        </div>

        {/* Contenido */}
        <div className="w-full max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs uppercase tracking-widest text-white/65 mb-2">Bienvenido</p>

          <h1 className="text-glow-sm text-4xl sm:text-6xl font-extrabold leading-tight">
            Aprende. <span className="text-brand">Juega.</span> Evoluciona.
          </h1>

          <p className="mt-4 text-sm sm:text-base text-white/85">
            SpinHunters App: aprende conmigo (BuhoBlancoDA), únete a la comunidad y <b>progresemos juntos</b>.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              // ⚠️ Navegación dura
              <a
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-brand px-5 py-3 text-white transition hover:bg-brand/90 shadow-glow"
              >
                Mi cuenta
              </a>
            ) : (
              <>
                <Link
                  href="/auth/sign-up"
                  prefetch={false}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-brand px-5 py-3 text-white transition hover:bg-brand/90 shadow-glow"
                >
                  Crear cuenta
                </Link>
                <Link
                  href="/auth/sign-in"
                  prefetch={false}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-5 py-3 hover:border-white/25"
                >
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>

          {!user && (
            <p className="mt-2 text-xs text-white/70">
              Registro gratis en 30s. Sin compromiso.
            </p>
          )}
        </div>

        {/* Línea HUD animada, ultra ligera */}
        <div aria-hidden className="absolute bottom-0 left-0 right-0 hud-divider" />
      </section>

      {/* BLOQUE DE VALOR (se mantiene ligero) */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass p-5">
            <h3 className="font-semibold mb-1">Contenido gratuito</h3>
            <p className="text-sm text-white/70">Cursos básicos, rangos, transmisiones.</p>
          </div>
          <div className="glass p-5">
            <h3 className="font-semibold mb-1">Comunidad</h3>
            <p className="text-sm text-white/70">Streaming, canal de Discord, pertenecer a algo.</p>
          </div>
          <div className="glass p-5">
            <h3 className="font-semibold mb-1">Membresías y Cursos</h3>
            <p className="text-sm text-white/70">Progresión real junto con BuhoBlancoDA.</p>
          </div>
          <div className="glass p-5">
            <h3 className="font-semibold mb-1">Herramientas exclusivas</h3>
            <p className="text-sm text-white/70">EVA Hand Analyser, ayudas PT4 y Labs en beta.</p>
          </div>
        </div>

        {/* Badges ligeros */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="chip">Ultimate: clases 4×/semana</span>
          <span className="chip">Eventos y retos mensuales</span>
        </div>
      </section>
    </main>
  )
}


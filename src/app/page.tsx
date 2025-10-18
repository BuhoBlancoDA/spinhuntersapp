// src/app/page.tsx
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase'
import { unstable_noStore as noStore } from 'next/cache'

export default async function Home() {
  noStore() // ← evita cache de router para esta página

  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <section className="w-full max-w-3xl text-center">
        <div className="glass p-8 sm:p-10">
          <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Bienvenido</p>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
            SpinHunters <span className="text-brand">—</span> App
          </h1>

          <p className="mt-3 text-sm sm:text-base text-white/70">
            {user
              ? 'Accede a tu cuenta y recursos.'
              : 'Gestiona membresías, recursos, tutoriales y accesos desde un solo lugar.'}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                prefetch={false}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-brand px-5 py-3 text-white transition hover:bg-brand/90 shadow-glow"
              >
                Mi cuenta
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/sign-in"
                  prefetch={false}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-brand px-5 py-3 text-white transition hover:bg-brand/90 shadow-glow"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/auth/sign-up"
                  prefetch={false}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-5 py-3 hover:border-white/25"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

// src/components/Header.tsx
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import Link from 'next/link'
import Image from 'next/image'
import { unstable_noStore as noStore } from 'next/cache'
import { supabaseServer } from '@/lib/supabase-server'
import SignOutButton from '@/components/SignOutButton'
import SalasAfiliadasButton from '@/components/SalasAfiliadasButton'

export default async function Header() {
  noStore()

  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 bg-black/45 backdrop-blur supports-[backdrop-filter]:bg-black/45 border-b border-white/10">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        {/* Izquierda: marca + CTA Salas Afiliadas */}
        <div className="flex items-center gap-3">
          <Link href="/" prefetch={false} className="flex items-center gap-3">
            <Image
              src="/brand/logo-circle.png"
              width={36}
              height={36}
              alt="SpinHunters"
              className="rounded-full"
              priority
            />
            <span className="text-lg sm:text-xl font-semibold tracking-wide text-white">
              SpinHunters
            </span>
          </Link>

          {/* Salas Afiliadas siempre a la izquierda */}
          <div className="hidden sm:block">
            <SalasAfiliadasButton />
          </div>
          <div className="sm:hidden">
            <SalasAfiliadasButton />
          </div>
        </div>

        {/* Derecha: acciones */}
        <nav className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                prefetch={false}
                className="inline-flex items-center rounded-lg bg-brand text-white px-3 py-2 sm:px-4 hover:bg-brand/90 transition shadow-glow text-sm"
              >
                Mi cuenta
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-up"
                prefetch={false}
                className="inline-flex items-center rounded-lg bg-brand text-white px-3 py-2 sm:px-4 hover:bg-brand/90 transition shadow-glow text-sm"
              >
                Crear cuenta
              </Link>
              <Link
                href="/auth/sign-in"
                prefetch={false}
                className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-2 sm:px-4 text-sm hover:bg-white/10"
              >
                Iniciar sesión
              </Link>
            </>
          )}
        </nav>
      </div>

      {/* divisor inferior sutil */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </header>
  )
}

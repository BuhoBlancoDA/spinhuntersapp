// src/components/Header.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { supabaseServer } from '@/lib/supabase'
import SignOutButton from '@/components/SignOutButton'

export default async function Header() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="w-full sticky top-0 z-50 bg-black/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
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

        <nav className="hidden sm:flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="px-3 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
              >
                Mi cuenta
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="px-3 py-2 text-sm rounded border border-white/10 hover:border-white/20"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/sign-up"
                className="px-3 py-2 text-sm rounded bg-brand hover:bg-brand/90 text-white"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </header>
  )
}

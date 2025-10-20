// src/app/auth/sign-in/page.tsx
import Image from 'next/image'
import GoogleButton from '@/components/GoogleButton'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function SignInPage({ searchParams }: { searchParams?: { error?: string } }) {
  const err = searchParams?.error ? decodeURIComponent(searchParams.error) : ''

  return (
    <main className="relative min-h-dvh grid place-items-center overflow-hidden">
      {/* Fondo con tus hero + overlay para legibilidad */}
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

      {/* Card */}
      <form
        action="/api/auth/sign-in"
        method="POST"
        className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-black/70 backdrop-blur-md p-6 sm:p-8 shadow-2xl"
      >
        {/* Marca compacta (visual, sin texto extra) */}
        <div className="flex items-center gap-3">
          <Image
            src="/brand/logo-circle.png"
            width={36}
            height={36}
            alt="SpinHunters"
            className="rounded-full"
            priority
          />
          <h1 className="text-2xl font-bold leading-none">Iniciar sesión</h1>
        </div>

        <div aria-hidden className="hud-divider mt-3" />

        {/* Campos (mismos names y tipos) */}
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          autoComplete="email"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
        />

        <input
          name="password"
          type="password"
          required
          placeholder="Contraseña"
          autoComplete="current-password"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-brand px-4 py-2 text-white transition-colors hover:bg-brand/90 shadow-glow"
        >
          Ingresar
        </button>

        {/* Separador */}
        <div className="flex items-center gap-3 text-xs text-white/50">
          <div className="h-px flex-1 bg-white/10" />
          o
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Botón Google (misma ruta) */}
        <GoogleButton href="/api/auth/oauth?provider=google" />

        {err && <p className="text-red-500 text-sm">{err}</p>}
      </form>
    </main>
  )
}


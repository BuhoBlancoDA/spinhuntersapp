// src/app/auth/sign-in/page.tsx
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function SignInPage({ searchParams }: { searchParams?: { error?: string } }) {
  const err = searchParams?.error ? decodeURIComponent(searchParams.error) : ''

  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <form action="/api/auth/sign-in" method="POST" className="w-full max-w-md space-y-4 glass p-6">
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>

        <input name="email" type="email" required placeholder="Email" className="w-full rounded bg-black/30 border border-white/10 px-3 py-2" />
        <input name="password" type="password" required placeholder="Contraseña" className="w-full rounded bg-black/30 border border-white/10 px-3 py-2" />

        <button type="submit" className="w-full px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Ingresar</button>

        {/* Separador */}
        <div className="flex items-center gap-3 text-xs text-white/50">
          <div className="h-px flex-1 bg-white/10" />
          o
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Botón Google → navegación dura */}
        <a
          href="/api/auth/oauth?provider=google"
          className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-5 py-3 hover:border-white/25"
        >
          Continuar con Google
        </a>

        {err && <p className="text-red-500 text-sm">{err}</p>}
      </form>
    </main>
  )
}

import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase'

export default async function Home() {
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
            {user ? 'Accede a tu cuenta y recursos.' : 'Gestiona membresías, recursos, tutoriales y accesos desde un solo lugar.'}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-brand px-5 py-3 text-white transition hover:bg-brand/90 shadow-glow"
                >
                  Mi cuenta
                </Link>
                <form action="/api/auth/sign-out" method="post">
                  <button 
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-5 py-3 hover:border-white/25"
                  >
                    Cerrar sesión
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/auth/sign-in"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-brand px-5 py-3 text-white transition hover:bg-brand/90 shadow-glow"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-5 py-3 hover:border-white/25"
                >
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 opacity-80">
          <div className="glass p-3 text-xs text-white/70">Membresías</div>
          <div className="glass p-3 text-xs text-white/70">Recursos</div>
          <div className="glass p-3 text-xs text-white/70">Tutoriales</div>
          <div className="glass p-3 text-xs text-white/70">Integraciones</div>
        </div>
      </section>
    </main>
  )
}

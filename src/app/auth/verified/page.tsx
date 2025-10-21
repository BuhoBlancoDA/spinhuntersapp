import { supabaseServer } from '@/lib/supabase-server'

function AutoRedirect({ to }: { to: string }) {
  // Componente cliente para redirigir después de un segundo
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const React = require('react')
  const { useEffect } = React
  const { useRouter } = require('next/navigation')
  const router = useRouter()
  useEffect(() => {
    const t = setTimeout(() => router.replace(to), 1200)
    return () => clearTimeout(t)
  }, [to, router])
  return null
}

export default async function VerifiedPage() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const target = user ? '/dashboard' : '/auth/sign-in?verified=1'

  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold">¡Cuenta verificada con éxito! ✅</h1>
        <p className="text-gray-600">
          Preparando tu acceso{user ? '…' : '. Inicia sesión para continuar.'}
        </p>
        <a href={target} className="inline-block px-4 py-2 rounded bg-black text-white">
          Continuar
        </a>
      </div>
      {/* redirección suave */}
      {/* @ts-expect-error Server/Client split */}
      <AutoRedirect to={target} />
    </main>
  )
}
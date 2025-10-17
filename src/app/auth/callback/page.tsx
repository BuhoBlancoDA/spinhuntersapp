import { supabaseServer } from '@/lib/supabase'
import Link from 'next/link'

export default async function CallbackPage() {
  // Nota: en confirmación de email, Supabase no crea sesión automáticamente.
  // Esta página solo confirma visualmente el éxito y guía al login.
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="max-w-md w-full text-center space-y-3">
        <h1 className="text-2xl font-bold">Correo verificado ✅</h1>
        {user
          ? <p className="text-gray-600">Tu correo fue verificado y ya tienes sesión activa.</p>
          : <p className="text-gray-600">Tu correo fue verificado. Ahora inicia sesión para continuar.</p>
        }
        <Link href="/auth/sign-in" className="inline-block px-4 py-2 rounded bg-black text-white">
          Ir a iniciar sesión
        </Link>
      </div>
    </main>
  )
}
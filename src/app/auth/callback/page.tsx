// src/app/auth/callback/page.tsx
import { supabaseServer } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function CallbackPage() {
  const supabase = supabaseServer()
  // Lectura de sesión robusta (no rompe si hay tokens inválidos)
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } } as any))

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-bold">Revisa tu correo</h1>
      <p className="text-white/70">
        Te enviamos un enlace de verificación. Ábrelo para completar el inicio de sesión.
      </p>

      {user && (
        <p className="text-sm text-green-500">
          Sesión detectada para <b>{user.email}</b>
        </p>
      )}

      <div className="pt-2">
        <Link href="/" className="underline text-brand">Volver al inicio</Link>
      </div>
    </main>
  )
}

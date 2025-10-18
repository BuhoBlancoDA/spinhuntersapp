'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setErr(null)

    const form = e.currentTarget
    const fd = new FormData(form)
    const email = String(fd.get('email') || '')
    const password = String(fd.get('password') || '')

    try {
      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // ← clave
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(json?.error || 'No se pudo iniciar sesión')
        return
      }

      // Éxito: cookies httpOnly ya están. Navega + refresca SSR.
      router.replace('/dashboard')
      router.refresh()
    } catch (e) {
      setErr('Error de red. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 glass p-6">
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>

        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded bg-black/30 border border-white/10 px-3 py-2"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Contraseña"
          className="w-full rounded bg-black/30 border border-white/10 px-3 py-2"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>

        {err && <p className="text-red-500 text-sm">{err}</p>}
      </form>
    </main>
  )
}


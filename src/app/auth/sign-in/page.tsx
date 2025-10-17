'use client'
import { useState } from 'react'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setErr(null)
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')
    const res = await fetch('/api/auth/sign-in', { method: 'POST', body: JSON.stringify({ email, password }) })
    const json = await res.json()
    if (!res.ok) { setErr(json.error || 'Error'); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  async function signOut() {
    await fetch('/api/auth/sign-out', { method: 'POST' })
    window.location.href = '/auth/sign-in'
  }

  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>
        <input className="w-full border p-2 rounded" name="email" type="email" required placeholder="Email" />
        <input className="w-full border p-2 rounded" name="password" type="password" required placeholder="Contraseña" />
        <button disabled={loading} className="w-full px-4 py-2 rounded bg-black text-white">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button type="button" onClick={signOut} className="w-full px-4 py-2 rounded border">Cerrar sesión</button>
      </form>
    </main>
  )
}
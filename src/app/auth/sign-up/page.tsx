'use client'
import { useState } from 'react'

export default function SignUpPage() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setErr(null); setMsg(null)
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')
    const confirm = String(form.get('confirm') || '')

    if (password.length < 8) { setErr('La contraseña debe tener al menos 8 caracteres'); setLoading(false); return }
    if (password !== confirm) { setErr('Las contraseñas no coinciden'); setLoading(false); return }

    const res = await fetch('/api/auth/sign-up', { method: 'POST', body: JSON.stringify({ email, password }) })
    const json = await res.json()
    if (!res.ok) { setErr(json.error || 'Error'); setLoading(false); return }
    setMsg('Registro creado. Revisa tu correo para confirmar la cuenta.')
    setLoading(false)
  }

  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-bold">Crear cuenta</h1>
        <input className="w-full border p-2 rounded" name="email" type="email" required placeholder="Email" />
        <input className="w-full border p-2 rounded" name="password" type="password" required placeholder="Contraseña (min 8)" />
        <input className="w-full border p-2 rounded" name="confirm" type="password" required placeholder="Confirmar contraseña" />
        <button disabled={loading} className="w-full px-4 py-2 rounded bg-black text-white">
          {loading ? 'Creando...' : 'Registrarme'}
        </button>
        {msg && <p className="text-green-600 text-sm">{msg}</p>}
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <p className="text-xs text-gray-500">Algunos recursos externos requieren email de Gmail.</p>
      </form>
    </main>
  )
}
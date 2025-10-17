'use client'
import { useState, useEffect } from 'react'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('verified') === '1') {
      setInfo('Tu correo fue verificado. Inicia sesión para continuar.')
    }
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setErr(null)
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')
    const res = await fetch('/api/auth/sign-in', { method: 'POST', body: JSON.stringify({ email, password }) })
    const json = await res.json()
    if (!res.ok) {
      let message = json.error || 'Error'
      if (typeof message === 'string' && message.toLowerCase().includes('invalid login')) {
        message = 'Credenciales inválidas. Revisa tu email y contraseña.'
      }
      setErr(message); setLoading(false); return
    }
    window.location.href = '/dashboard'
  }

  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm glass p-6 space-y-3">
        <h1 className="text-xl font-semibold">Iniciar sesión</h1>
        {info && <p className="text-green-400 text-sm">{info}</p>}
        <input className="w-full bg-transparent border border-white/15 focus:border-brand/80 outline-none rounded p-2 text-white placeholder:text-white/40" name="email" type="email" required placeholder="Email" />
        <input className="w-full bg-transparent border border-white/15 focus:border-brand/80 outline-none rounded p-2 text-white placeholder:text-white/40" name="password" type="password" required placeholder="Contraseña" />
        <button disabled={loading} className="w-full px-4 py-2 rounded bg-brand text-white hover:bg-brand/90">
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
        {err && <p className="text-red-400 text-sm">{err}</p>}
      </form>
    </main>
  )
}

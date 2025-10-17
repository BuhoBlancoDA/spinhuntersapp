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
    if (!res.ok) { 
      // Translate common Supabase error messages to user-friendly Spanish messages
      let errorMessage = json.error || 'Error desconocido';

      if (errorMessage.toLowerCase().includes('rate limit')) {
        errorMessage = 'Se ha alcanzado el límite de intentos, espera unos minutos antes de reintentar.';
      } else if (errorMessage.includes('User already registered')) {
        errorMessage = 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
      } else if (errorMessage.includes('Invalid email')) {
        errorMessage = 'El correo electrónico no es válido.';
      } else if (errorMessage.includes('Password should be')) {
        errorMessage = 'La contraseña no cumple con los requisitos de seguridad.';
      }

      setErr(errorMessage); 
      setLoading(false); 
      return; 
    }
    setMsg('Registro creado. Revisa tu correo para confirmar la cuenta.')
    setLoading(false)
  }

  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm glass p-6 space-y-3">
        <h1 className="text-xl font-semibold">Crear cuenta</h1>
        <input className="w-full bg-transparent border border-white/15 focus:border-brand/80 outline-none rounded p-2 text-white placeholder:text-white/40" name="email" type="email" required placeholder="Email" />
        <input className="w-full bg-transparent border border-white/15 focus:border-brand/80 outline-none rounded p-2 text-white placeholder:text-white/40" name="password" type="password" required placeholder="Contraseña (min 8)" />
        <input className="w-full bg-transparent border border-white/15 focus:border-brand/80 outline-none rounded p-2 text-white placeholder:text-white/40" name="confirm" type="password" required placeholder="Confirmar contraseña" />
        <button disabled={loading} className="w-full px-4 py-2 rounded bg-brand text-white hover:bg-brand/90">
          {loading ? 'Creando…' : 'Registrarme'}
        </button>
        {msg && <p className="text-green-400 text-sm">{msg}</p>}
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <p className="text-xs text-white/50">Algunos recursos externos requieren email de Gmail.</p>
      </form>
    </main>
  )
}

// src/app/auth/onboarding/page.tsx
'use client'

import { useState } from 'react'
import { COUNTRIES } from '@/lib/countries'

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setErr(null)

    try {
      const fd = new FormData(e.currentTarget)
      const res = await fetch('/api/profile/upsert', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(json?.error || 'No se pudo guardar')
        setLoading(false)
        return
      }
      // listo → al dashboard
      window.location.assign('/dashboard')
    } catch {
      setErr('Error de red')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-xl space-y-4 glass p-6">
        <h1 className="text-2xl font-bold">Completa tu perfil</h1>
        <p className="text-sm text-white/70">Un paso más para personalizar tu acceso.</p>

        <input
          name="full_name"
          required
          placeholder="Nombre completo"
          className="w-full rounded bg-black/30 border border-white/10 px-3 py-2"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            name="country_code"
            required
            defaultValue=""
            className="w-full rounded bg-black/30 border border-white/10 px-3 py-2"
          >
            <option value="" disabled>Selecciona tu país</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>

          <input
            name="discord_user"
            required
            placeholder="Usuario de Discord"
            className="w-full rounded bg-black/30 border border-white/10 px-3 py-2"
          />
        </div>

        <input
          name="whatsapp"
          placeholder="WhatsApp (opcional)"
          className="w-full rounded bg-black/30 border border-white/10 px-3 py-2"
        />
        <input
          name="email_alt"
          type="email"
          placeholder="Email alterno (opcional)"
          className="w-full rounded bg-black/30 border border-white/10 px-3 py-2"
        />

        <select
          name="how_heard"
          className="w-full rounded bg-black/30 border border-white/10 px-3 py-2"
          defaultValue=""
        >
          <option value="">¿Cómo nos conociste? (opcional)</option>
          <option>Youtube</option>
          <option>Discord</option>
          <option>Twitch</option>
          <option>Google</option>
          <option>Un amigo</option>
          <option>Otros</option>
        </select>

        <input
          name="how_heard_other"
          placeholder="Si elegiste Otros, cuéntanos"
          className="w-full rounded bg-black/30 border border-white/10 px-3 py-2"
        />

        <button
          disabled={loading}
          className="w-full px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? 'Guardando…' : 'Continuar'}
        </button>

        {err && <p className="text-red-500 text-sm">{err}</p>}
      </form>
    </main>
  )
}

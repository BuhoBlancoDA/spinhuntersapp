// src/app/auth/onboarding/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { COUNTRIES } from '@/lib/countries'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [hasUsername, setHasUsername] = useState<boolean | null>(null)
  const [prefilledUsername, setPrefilledUsername] = useState<string>('')

  // Cargar si el perfil ya tiene username (si existe, ocultamos el campo)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const sb = supabaseBrowser()
        const { data: { user } } = await sb.auth.getUser()
        if (!user) {
          window.location.assign('/auth/sign-in')
          return
        }
        const { data } = await sb
          .from('profiles')
          .select('username')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!mounted) return
        const has = !!data?.username
        setHasUsername(has)
        setPrefilledUsername(data?.username ?? '')
      } catch {
        // si falla, asumimos que NO tiene username para forzar captura
        if (!mounted) return
        setHasUsername(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setErr(null)

    try {
      const fd = new FormData(e.currentTarget)

      // Si ya tiene username, NO lo volvemos a enviar (evitamos error del trigger)
      if (hasUsername) {
        fd.delete('username')
      }

      const res = await fetch('/api/profile/upsert', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })
      const json = await res.json().catch(() => ({} as any))

      if (!res.ok) {
        // Mensaje más claro en caso de username repetido o inválido
        let m = json?.error || 'No se pudo guardar'
        if (typeof m === 'string') {
          if (m.toLowerCase().includes('uniq_profiles_username_lower')) {
            m = 'Ese username ya está en uso. Prueba con otro.'
          } else if (m.toLowerCase().includes('username')) {
            m = 'Revisa el username: usa 3–20 caracteres (a–z, A–Z, 0–9, _).'
          }
        }
        setErr(m)
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

  // Mientras detectamos si tiene username, mostramos el formulario igualmente.
  // El campo de username aparece solo cuando hasUsername === false.
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-xl space-y-4 glass p-6 border border-white/10 bg-black/60 backdrop-blur-md rounded-2xl">
        <h1 className="text-2xl font-bold">Completa tu perfil</h1>
        <p className="text-sm text-white/70">Un paso más para personalizar tu acceso.</p>

        {/* Username (solo si NO existe aún) */}
        {hasUsername === false && (
          <div className="space-y-1">
            <input
              name="username"
              required
              placeholder="Username (a-z, A-Z, 0-9, _)"
              pattern="^[A-Za-z0-9_]{3,20}$"
              title="3–20 caracteres: a–z, A–Z, 0–9 y _"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full rounded bg-white/5 text-white placeholder-white/50 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
            <p className="text-xs text-white/60">
              Tu username será público y no podrás cambiarlo después.
            </p>
          </div>
        )}

        {/* Si ya tiene username, lo mostramos de referencia (sin enviar al servidor) */}
        {hasUsername === true && (
          <div className="space-y-1">
            <input
              value={prefilledUsername}
              readOnly
              aria-label="Username"
              className="w-full rounded bg-white/5 text-white placeholder-white/50 border border-white/10 px-3 py-2"
            />
            <p className="text-xs text-white/60">
              Ya tienes un username asignado.
            </p>
          </div>
        )}

        <input
          name="full_name"
          required
          placeholder="Nombre completo"
          className="w-full rounded bg-white/5 text-white placeholder-white/50 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            name="country_code"
            required
            defaultValue=""
            className="w-full rounded bg-white/5 text-white placeholder-white/50 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
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
            className="w-full rounded bg-white/5 text-white placeholder-white/50 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
        </div>

        <input
          name="whatsapp"
          placeholder="WhatsApp (opcional)"
          className="w-full rounded bg-white/5 text-white placeholder-white/50 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />
        <input
          name="email_alt"
          type="email"
          placeholder="Email alterno (opcional)"
          className="w-full rounded bg-white/5 text-white placeholder-white/50 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />

        <select
          name="how_heard"
          className="w-full rounded bg-white/5 text-white placeholder-white/50 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
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
          className="w-full rounded bg-white/5 text-white placeholder-white/50 border border-white/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />

        <button
          disabled={loading}
          className="w-full px-4 py-2 rounded bg-brand text-white hover:bg-brand/90 disabled:opacity-60"
        >
          {loading ? 'Guardando…' : 'Continuar'}
        </button>

        {err && <p className="text-red-500 text-sm">{err}</p>}
      </form>
    </main>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { COUNTRIES } from '@/lib/countries'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm: z.string().min(8),
  full_name: z.string().min(2, 'Nombre requerido'),
  country_code: z.string().trim().length(2, 'Selecciona tu país'),
  discord_user: z.string().min(2, 'Usuario de Discord requerido'),
  whatsapp: z.string().optional(),
  email_alt: z.string().email().optional().or(z.literal('')),
  how_heard: z.string().optional(),
  how_heard_other: z.string().optional()
}).superRefine((d, ctx) => {
  if (d.how_heard === 'Otros' && !d.how_heard_other?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['how_heard_other'],
      message: 'Cuéntanos cómo nos conociste'
    })
  }
}).refine(d => d.password === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm']
})

export default function SignUpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [how, setHow] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setErr(null)
    setMsg(null)

    // --- FIX: guardar referencia al formulario ANTES de cualquier await ---
    const form = e.currentTarget
    const fd = new FormData(form)

    const raw = {
      email: String(fd.get('email') || ''),
      password: String(fd.get('password') || ''),
      confirm: String(fd.get('confirm') || ''),
      full_name: String(fd.get('full_name') || ''),
      country_code: String(fd.get('country_code') || '').trim().toUpperCase(),
      discord_user: String(fd.get('discord_user') || ''),
      whatsapp: String(fd.get('whatsapp') || ''),
      email_alt: String(fd.get('email_alt') || ''),
      how_heard: String(fd.get('how_heard') || ''),
      how_heard_other: String(fd.get('how_heard_other') || '')
    }

    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      const m = parsed.error.issues[0]?.message || 'Datos inválidos'
      setErr(m)
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      })

      const json = await res.json().catch(() => ({} as any))

      if (!res.ok) {
        let m = json?.error || 'Error'
        if (typeof m === 'string' && m.toLowerCase().includes('rate limit')) {
          m = 'Se alcanzó el límite de envíos. Espera 1–2 min e inténtalo de nuevo.'
        }
        setErr(m)
        return
      }

      setMsg('¡Revisa tu bandeja para verificar tu cuenta!')
      form.reset()
      const name = encodeURIComponent(parsed.data.full_name || '')
      router.replace(`/auth/verify?name=${name}`)
    } catch (error) {
      console.error(error)
      setErr('Error de red. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center p-6 bg-gray-900">
      <form onSubmit={onSubmit} className="w-full max-w-xl space-y-4 p-8 rounded-lg bg-black border border-red-800 shadow-xl">
        <h1 className="text-3xl font-bold text-white">Crear cuenta</h1>

        <div className="p-4 rounded border border-red-800 bg-gray-900 text-sm text-gray-300">
          Para acceder a algunos recursos externos recomendamos <b className="text-red-500">usar un correo Gmail</b>.
        </div>

        <input
          className="w-full border border-gray-700 p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
          name="full_name"
          required
          placeholder="Nombre completo"
        />
        <input
          className="w-full border border-gray-700 p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
          name="email"
          type="email"
          required
          placeholder="Email (ideal Gmail)"
        />
        <input
          className="w-full border border-gray-700 p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
          name="email_alt"
          type="email"
          placeholder="Email alterno (opcional)"
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            className="w-full border border-gray-700 p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
            name="password"
            type="password"
            required
            placeholder="Contraseña (min 8)"
          />
          <input
            className="w-full border border-gray-700 p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
            name="confirm"
            type="password"
            required
            placeholder="Confirmar contraseña"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <select
              className="w-full border border-gray-700 p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
              name="country_code"
              required
              defaultValue=""
            >
              <option value="" disabled>Selecciona tu país</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
          <input
            className="w-full border border-gray-700 p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
            name="discord_user"
            required
            placeholder="Usuario de Discord"
          />
        </div>

        <input
          className="w-full border border-gray-700 p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
          name="whatsapp"
          placeholder="WhatsApp (opcional)"
        />

        <select
          className="w-full border border-gray-700 p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
          name="how_heard"
          value={how}
          onChange={(e) => setHow(e.target.value)}
        >
          <option value="">¿Cómo nos conociste? (opcional)</option>
          <option>Youtube</option>
          <option>Discord</option>
          <option>Twitch</option>
          <option>Google</option>
          <option>Un amigo</option>
          <option>Otros</option>
        </select>

        {how === 'Otros' && (
          <input
            className="w-full border border-gray-700 p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
            name="how_heard_other"
            placeholder="Cuéntanos cómo nos conociste"
          />
        )}

        <div className="text-xs text-gray-400 mt-2">
          Al registrarte aceptas los términos y condiciones de Spinhunters
        </div>

        <button
          disabled={loading}
          className="w-full px-5 py-3 rounded bg-red-800 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {loading ? 'Creando...' : 'Registrarme'}
        </button>

        {/* Separador */}
        <div className="flex items-center gap-3 text-xs text-white/50">
          <div className="h-px flex-1 bg-white/10" />
          o
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <a
          href="/api/auth/oauth?provider=google"
          className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-5 py-3 hover:border-white/25"
        >
          Continuar con Google
        </a>

        {msg && <p className="text-green-500 text-sm">{msg}</p>}
        {err && <p className="text-red-500 text-sm">{err}</p>}
      </form>
    </main>
  )
}

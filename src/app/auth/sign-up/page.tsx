'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { z } from 'zod'
import { COUNTRIES } from '@/lib/countries'
import GoogleButton from '@/components/GoogleButton'

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
    <main className="relative min-h-dvh overflow-hidden">
      {/* Fondo con tus hero + overlay */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/Hero/hero-mobile.webp"
          alt=""
          fill
          className="object-cover md:hidden"
          priority
        />
        <Image
          src="/Hero/hero-desktop.webp"
          alt=""
          fill
          className="hidden md:block object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
      </div>

      {/* Contenedor 1 columna */}
      <div className="relative z-10 mx-auto w-full max-w-xl px-4 py-10 md:py-14">
        {/* Encabezado compacto */}
        <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo-circle.png"
              alt="SpinHunters"
              width={36}
              height={36}
              className="rounded-full"
              priority
            />
            <p className="text-sm text-white/70">SpinHunters App</p>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight">
            Crear cuenta
          </h1>
          <p className="mt-1 text-white/85">
            Aprende conmigo (BuhoBlancoDA) y <b>progresemos juntos</b>.
          </p>
          <p className="mt-2 text-xs text-white/60">
            Registro gratis en 30s. Sin compromiso.
          </p>

          {/* Animación ligera */}
          <div aria-hidden className="mt-4 hud-divider" />
        </div>

        {/* === FORMULARIO (misma estructura y names) === */}
        <form
          onSubmit={onSubmit}
          className="w-full rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 p-6 sm:p-8 shadow-2xl space-y-4"
        >
          <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-sm text-white/80">
            Para acceder a algunos recursos externos recomendamos{' '}
            <b className="text-brand">usar un correo Gmail</b>.
          </div>

          <input
            className="w-full border border-white/10 p-3 rounded bg-white/5 text-white placeholder-white/40 focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none transition"
            name="full_name"
            required
            placeholder="Nombre completo"
          />
          <input
            className="w-full border border-white/10 p-3 rounded bg-white/5 text-white placeholder-white/40 focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none transition"
            name="email"
            type="email"
            required
            placeholder="Email (ideal Gmail)"
          />
          <input
            className="w-full border border-white/10 p-3 rounded bg-white/5 text-white placeholder-white/40 focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none transition"
            name="email_alt"
            type="email"
            placeholder="Email alterno (opcional)"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              className="w-full border border-white/10 p-3 rounded bg-white/5 text-white placeholder-white/40 focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none transition"
              name="password"
              type="password"
              required
              placeholder="Contraseña (min 8)"
            />
            <input
              className="w-full border border-white/10 p-3 rounded bg-white/5 text-white placeholder-white/40 focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none transition"
              name="confirm"
              type="password"
              required
              placeholder="Confirmar contraseña"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <select
                className="dark-select w-full border border-white/10 p-3 rounded bg-white/5 text-white placeholder-white/40 focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none transition"
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
              className="w-full border border-white/10 p-3 rounded bg-white/5 text-white placeholder-white/40 focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none transition"
              name="discord_user"
              required
              placeholder="Usuario de Discord"
            />
          </div>

          <input
            className="w-full border border-white/10 p-3 rounded bg-white/5 text-white placeholder-white/40 focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none transition"
            name="whatsapp"
            placeholder="WhatsApp (opcional)"
          />

          <select
            className="dark-select w-full border border-white/10 p-3 rounded bg-white/5 text-white placeholder-white/40 focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none transition"
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
              className="w-full border border-white/10 p-3 rounded bg-white/5 text-white placeholder-white/40 focus:border-brand focus:ring-2 focus:ring-brand/30 outline-none transition"
              name="how_heard_other"
              placeholder="Cuéntanos cómo nos conociste"
            />
          )}

          <div className="text-xs text-white/60 mt-2">
            Al registrarte aceptas los términos y condiciones de Spinhunters
          </div>

          <button
            disabled={loading}
            className="w-full px-5 py-3 rounded bg-brand text-white hover:bg-brand/90 transition-colors disabled:opacity-60 shadow-glow"
          >
            {loading ? 'Creando...' : 'Registrarme'}
          </button>

          {/* Separador */}
          <div className="flex items-center gap-3 text-xs text-white/50">
            <div className="h-px flex-1 bg-white/10" />
            o
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <GoogleButton href="/api/auth/oauth?provider=google" label="Crear cuenta con Google" />

          {msg && <p className="text-green-500 text-sm">{msg}</p>}
          {err && <p className="text-red-500 text-sm">{err}</p>}
        </form>
      </div>
    </main>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfileForm({
  defaultFullName,
  defaultCountryCode,
  defaultDiscordUser,
  defaultWhatsapp,
  defaultEmailAlt,
  defaultHowHeard,
  defaultHowHeardOther,
}: {
  defaultFullName?: string
  defaultCountryCode?: string
  defaultDiscordUser?: string
  defaultWhatsapp?: string
  defaultEmailAlt?: string
  defaultHowHeard?: string
  defaultHowHeardOther?: string
}) {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setMsg(null)
    setErr(null)

    const form = e.currentTarget
    const fd = new FormData(form)

    try {
      const res = await fetch('/api/profile/upsert', {
        method: 'POST',
        body: fd,
        credentials: 'include', // ← envía cookies httpOnly
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(json?.error || 'Error al guardar')
      } else {
        setMsg('Cambios guardados correctamente.')
        router.refresh() // refresca SSR (Header/Home/Dashboard/Profile)
      }
    } catch {
      setErr('Error de red. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="glass p-6 space-y-4">
      <div>
        <label className="block text-sm mb-1">Nombre completo</label>
        <input
          name="full_name"
          defaultValue={defaultFullName ?? ''}
          className="w-full rounded bg-black/30 border border-white/10 px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">País (ISO-2)</label>
        <input
          name="country_code"
          maxLength={2}
          defaultValue={(defaultCountryCode ?? '').toUpperCase()}
          className="w-28 rounded bg-black/30 border border-white/10 px-3 py-2 uppercase"
        />
      </div>

      {/* Campos extra (si quieres mostrarlos) */}
      {/*
      <div>
        <label className="block text-sm mb-1">Usuario de Discord</label>
        <input name="discord_user" defaultValue={defaultDiscordUser ?? ''} className="w-full rounded bg-black/30 border border-white/10 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm mb-1">WhatsApp</label>
        <input name="whatsapp" defaultValue={defaultWhatsapp ?? ''} className="w-full rounded bg-black/30 border border-white/10 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm mb-1">Email alterno</label>
        <input name="email_alt" type="email" defaultValue={defaultEmailAlt ?? ''} className="w-full rounded bg-black/30 border border-white/10 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm mb-1">¿Cómo nos conociste?</label>
        <input name="how_heard" defaultValue={defaultHowHeard ?? ''} className="w-full rounded bg-black/30 border border-white/10 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm mb-1">Otros (detalle)</label>
        <input name="how_heard_other" defaultValue={defaultHowHeardOther ?? ''} className="w-full rounded bg-black/30 border border-white/10 px-3 py-2" />
      </div>
      */}

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
      >
        {loading ? 'Guardando…' : 'Guardar cambios'}
      </button>

      {msg && <p className="text-green-500 text-sm">{msg}</p>}
      {err && <p className="text-red-500 text-sm">{err}</p>}
    </form>
  )
}

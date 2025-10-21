// src/app/auth/update-password/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Link from 'next/link'

type Phase = 'checking' | 'form' | 'done' | 'error'

export default function UpdatePasswordPage() {
  const [phase, setPhase] = useState<Phase>('checking')
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  // Intenta establecer sesión a partir del hash (#access_token & refresh_token)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const sb = supabaseBrowser()

      // 1) ¿ya hay usuario?
      const { data: { user } } = await sb.auth.getUser()
      if (user) {
        if (!mounted) return
        setPhase('form')
        return
      }

      // 2) intentar capturar tokens del hash
      const hash = typeof window !== 'undefined' ? window.location.hash : ''
      const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
      const access_token = params.get('access_token') || ''
      const refresh_token = params.get('refresh_token') || ''

      if (access_token && refresh_token) {
        // Establece sesión en el cliente
        const { data, error } = await sb.auth.setSession({ access_token, refresh_token })
        if (!mounted) return
        if (error || !data.session) {
          setErr('No se pudo validar el enlace de recuperación. Solicita uno nuevo.')
          setPhase('error')
          return
        }
        // Limpia el hash de la URL
        window.history.replaceState({}, document.title, window.location.pathname)
        setPhase('form')
        return
      }

      // 3) sin sesión y sin tokens
      if (!mounted) return
      setErr('Enlace inválido o expirado. Solicita un nuevo correo de restablecimiento.')
      setPhase('error')
    })()
    return () => { mounted = false }
  }, [])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    setPending(true); setErr(null); setMsg(null)

    const fd = new FormData(e.currentTarget)
    const p1 = String(fd.get('password') || '')
    const p2 = String(fd.get('confirm') || '')

    if (p1.length < 8) {
      setErr('La contraseña debe tener al menos 8 caracteres.')
      setPending(false)
      return
    }
    if (p1 !== p2) {
      setErr('Las contraseñas no coinciden.')
      setPending(false)
      return
    }

    try {
      const sb = supabaseBrowser()
      const { error } = await sb.auth.updateUser({ password: p1 })
      if (error) {
        setErr(error.message || 'No se pudo actualizar la contraseña.')
        setPending(false)
        return
      }
      setMsg('¡Contraseña actualizada correctamente!')
      setPhase('done')
    } catch {
      setErr('Error inesperado al actualizar la contraseña.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/70 backdrop-blur-md p-6 space-y-4">
        <h1 className="text-2xl font-bold">Actualizar contraseña</h1>

        {phase === 'checking' && (
          <p className="text-white/70">Validando enlace…</p>
        )}

        {phase === 'form' && (
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-white/70 mb-1">Nueva contraseña</label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full border border-white/10 p-3 rounded bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Confirmar contraseña</label>
              <input
                name="confirm"
                type="password"
                required
                minLength={8}
                className="w-full border border-white/10 p-3 rounded bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </div>

            <button
              disabled={pending}
              className="w-full px-4 py-2 rounded bg-brand text-white hover:bg-brand/90 disabled:opacity-60"
            >
              {pending ? 'Guardando…' : 'Actualizar contraseña'}
            </button>

            {msg && <p className="text-green-500 text-sm">{msg}</p>}
            {err && <p className="text-red-500 text-sm">{err}</p>}
          </form>
        )}

        {phase === 'done' && (
          <div className="space-y-3">
            <p className="text-green-500 text-sm">Tu contraseña se actualizó.</p>
            <Link href="/auth/sign-in" className="inline-block px-4 py-2 rounded bg-brand text-white hover:bg-brand/90">
              Iniciar sesión
            </Link>
          </div>
        )}

        {phase === 'error' && (
          <div className="space-y-3">
            <p className="text-red-500 text-sm">{err}</p>
            <Link href="/auth/sign-in" className="inline-block px-4 py-2 rounded border border-white/20 text-white/90 hover:bg-white/5">
              Volver a iniciar sesión
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}

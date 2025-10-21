'use client'

import { useEffect, useMemo, useState } from 'react'
import { COUNTRIES } from '@/lib/countries'

type Details = {
  user_id: string
  email: string | null
  username: string | null
  full_name: string | null
  country_code: string | null
  discord_user: string | null
  whatsapp: string | null
  email_alt: string | null
  how_heard: string | null
  how_heard_other: string | null
  ggpoker_nick: string | null
  created_at: string | null
  updated_at: string | null
  auth_created_at?: string | null
}

export default function UserModal({ userId, onClose }: { userId: string, onClose: () => void }) {
  const [recoveryLink, setRecoveryLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [d, setD] = useState<Details | null>(null)
  const [showSetPass, setShowSetPass] = useState(false)
  const countryName = useMemo(
    () => (code?: string | null) => code ? (COUNTRIES.find(c => c.code === code)?.name ?? code) : '',
    []
  )

  useEffect(() => {
    let abort = false
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, { credentials: 'include' })
        const json = await res.json()
        if (!abort) setD(json)
      } catch {
        if (!abort) setErr('No se pudo cargar el usuario')
      } finally {
        if (!abort) setLoading(false)
      }
    })()
    return () => { abort = true }
  }, [userId])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!d) return
    setSaving(true); setMsg(null); setErr(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: d.full_name,
          country_code: d.country_code,
          discord_user: d.discord_user,
          whatsapp: d.whatsapp,
          email_alt: d.email_alt,
          how_heard: d.how_heard,
          how_heard_other: d.how_heard_other,
          ggpoker_nick: d.ggpoker_nick
        })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Error al guardar')
      setMsg('Datos actualizados correctamente.')
    } catch (e:any) {
      setErr(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function onResetPassword() {
    setErr(null); setMsg(null); setRecoveryLink(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'No se pudo iniciar el restablecimiento')

      if (json?.sent === 'supabase') {
        setMsg('Se envió el correo de restablecimiento desde Supabase.')
        return
      }
      if (json?.sent === 'manual' && json?.action_link) {
        setMsg('Enlace de recuperación generado. Cópialo y envíalo al usuario.')
        setRecoveryLink(json.action_link)
        return
      }
      setMsg('Solicitud completada.')
    } catch (e:any) {
      setErr(e.message || 'No se pudo iniciar el restablecimiento')
    }
  }



  async function onSetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const p1 = String(fd.get('password') || '')
    const p2 = String(fd.get('confirm') || '')
    if (p1.length < 8) { setErr('La contraseña debe tener al menos 8 caracteres.'); return }
    if (p1 !== p2) { setErr('Las contraseñas no coinciden.'); return }
    setErr(null); setMsg(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: p1 })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'No se pudo establecer la contraseña')
      setMsg('Contraseña actualizada correctamente.')
      setShowSetPass(false)
      ;(e.currentTarget as HTMLFormElement).reset()
    } catch (e:any) {
      setErr(e.message || 'No se pudo establecer la contraseña')
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-x-0 top-10 mx-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-black/80 p-5 backdrop-blur-md">
        {loading && <p className="text-white/70">Cargando…</p>}
        {!loading && d && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Detalles del usuario</h2>
                <p className="text-sm text-white/70">
                  Creado: {d.auth_created_at ? new Date(d.auth_created_at).toLocaleString() : '—'}
                </p>
              </div>
              <button onClick={onClose} className="px-3 py-1.5 rounded border border-white/20 text-white/80 hover:bg-white/5">Cerrar</button>
            </div>

            <form onSubmit={onSave} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-sm text-white/70 mb-1">Username</label>
                <input value={d.username ?? ''} readOnly className="w-full border border-white/10 p-3 rounded bg-white/5 text-white" />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm text-white/70 mb-1">Email</label>
                <input value={d.email ?? ''} readOnly className="w-full border border-white/10 p-3 rounded bg-white/5 text-white" />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm text-white/70 mb-1">Nombre completo</label>
                <input
                  value={d.full_name ?? ''}
                  onChange={(e) => setD({ ...d, full_name: e.target.value })}
                  className="w-full border border-white/10 p-3 rounded bg-white/5 text-white"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm text-white/70 mb-1">País</label>
                <select
                  value={d.country_code ?? ''}
                  onChange={(e) => setD({ ...d, country_code: e.target.value })}
                  className="w-full border border-white/10 p-3 rounded bg-white/5 text-white"
                >
                  <option value="">—</option>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm text-white/70 mb-1">Discord</label>
                <input
                  value={d.discord_user ?? ''}
                  onChange={(e) => setD({ ...d, discord_user: e.target.value })}
                  className="w-full border border-white/10 p-3 rounded bg-white/5 text-white"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm text-white/70 mb-1">WhatsApp</label>
                <input
                  value={d.whatsapp ?? ''}
                  onChange={(e) => setD({ ...d, whatsapp: e.target.value })}
                  className="w-full border border-white/10 p-3 rounded bg-white/5 text-white"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm text-white/70 mb-1">Email alterno</label>
                <input
                  value={d.email_alt ?? ''}
                  onChange={(e) => setD({ ...d, email_alt: e.target.value })}
                  className="w-full border border-white/10 p-3 rounded bg-white/5 text-white"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm text-white/70 mb-1">GGpoker Nick</label>
                <input
                  value={d.ggpoker_nick ?? ''}
                  onChange={(e) => setD({ ...d, ggpoker_nick: e.target.value })}
                  className="w-full border border-white/10 p-3 rounded bg-white/5 text-white"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm text-white/70 mb-1">¿Cómo nos conoció?</label>
                <input
                  value={d.how_heard ?? ''}
                  onChange={(e) => setD({ ...d, how_heard: e.target.value })}
                  className="w-full border border-white/10 p-3 rounded bg-white/5 text-white"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm text-white/70 mb-1">Detalle (Otros)</label>
                <input
                  value={d.how_heard_other ?? ''}
                  onChange={(e) => setD({ ...d, how_heard_other: e.target.value })}
                  className="w-full border border-white/10 p-3 rounded bg-white/5 text-white"
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between mt-2">
                <div className="space-x-2">
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-brand text-white hover:bg-brand/90 disabled:opacity-60">
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                  <button type="button" onClick={onResetPassword} className="px-4 py-2 rounded border border-white/20 text-white/90 hover:bg-white/5">
                    Restablecer contraseña
                  </button>
                  <button type="button" onClick={() => setShowSetPass(v => !v)} className="px-4 py-2 rounded border border-white/20 text-white/90 hover:bg-white/5">
                    Establecer nueva contraseña
                  </button>
                </div>
                <div className="text-right">
                  {msg && <p className="text-green-500 text-sm">{msg}</p>}
                  {err && <p className="text-red-500 text-sm">{err}</p>}
                  {recoveryLink && (
                    <div className="mt-2 space-y-2">
                      <div className="text-xs text-white/70">Enlace de recuperación:</div>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={recoveryLink}
                          className="flex-1 border border-white/10 p-2 rounded bg-white/5 text-white text-xs break-all"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(recoveryLink)
                              setMsg('Enlace copiado al portapapeles.')
                            } catch { /* no-op */ }
                          }}
                          className="px-3 py-1.5 rounded border border-white/20 text-white/90 hover:bg-white/5 text-sm"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </form>

            {showSetPass && (
              <form onSubmit={onSetPassword} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-white/10 pt-3">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Nueva contraseña</label>
                  <input name="password" type="password" className="w-full border border-white/10 p-3 rounded bg-white/5 text-white" />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Confirmar contraseña</label>
                  <input name="confirm" type="password" className="w-full border border-white/10 p-3 rounded bg-white/5 text-white" />
                </div>
                <div className="sm:col-span-2">
                  <button className="px-4 py-2 rounded bg-brand text-white hover:bg-brand/90">Actualizar contraseña</button>
                </div>
              </form>
            )}

            <div className="mt-4 text-sm text-white/60">
              País: <b>{countryName(d.country_code)}</b> · Última actualización: {d.updated_at ? new Date(d.updated_at).toLocaleString() : '—'}
            </div>
          </>
        )}
        {!loading && !d && <p className="text-red-500">No se pudo cargar el usuario.</p>}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Status = 'ACTIVE'|'PENDING'|'CANCELLED'|'EXPIRED'

function toLocalInput(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 16) // yyyy-MM-ddTHH:mm
}

export default function EnrollmentRowEditor({
  kind,
  id,
  initialStatus,
  startAt,
  endAt,
}:{
  kind: 'course' | 'package'
  id: number
  initialStatus: Status
  startAt?: string | null
  endAt?: string | null
}) {
  const router = useRouter()
  const base = kind === 'course'
    ? '/api/admin/courses/enroll'
    : '/api/admin/course-packages/enroll'

  const [status, setStatus] = useState<Status>(initialStatus)
  const [start_at, setStartAt] = useState<string>(toLocalInput(startAt))
  const [noExp, setNoExp] = useState<boolean>(!endAt)
  const [end_at, setEndAt] = useState<string>(toLocalInput(endAt))
  const [dur, setDur] = useState<number | ''>('') // opcional: recalcula end_at
  const [loading, setLoading] = useState(false)

  async function apply() {
    setLoading(true)
    const payload:any = {
      status,
      no_expiration: noExp,
      start_at: start_at ? new Date(start_at).toISOString() : undefined,
      end_at: noExp ? null : (end_at ? new Date(end_at).toISOString() : undefined),
    }
    if (!noExp && dur) payload.duration_days = Number(dur)

    const res = await fetch(`${base}/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    })
    setLoading(false)
    if (!res.ok) { alert('No se pudo guardar'); return }
    router.refresh()
  }

  async function expireNow() {
    if (!confirm('¿Marcar como EXPIRED ahora mismo?')) return
    setLoading(true)
    const res = await fetch(`${base}/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ expire_now: true })
    })
    setLoading(false)
    if (!res.ok) { alert('No se pudo expirar'); return }
    setStatus('EXPIRED')
    setNoExp(false)
    setEndAt(toLocalInput(new Date().toISOString()))
    router.refresh()
  }

  async function remove() {
    if (!confirm('¿Eliminar esta inscripción?')) return
    setLoading(true)
    const res = await fetch(`${base}/${id}`, { method: 'DELETE' })
    setLoading(false)
    if (!res.ok) { alert('No se pudo eliminar'); return }
    router.refresh()
  }

  return (
    <div className="glass rounded-xl p-3 sm:p-4">
      {/* Fila flexible: se parte en 2+ líneas si falta espacio */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Estado */}
        <select
          className="dark-select text-xs h-9 rounded-lg px-2 w-[130px]"
          disabled={loading}
          value={status}
          onChange={e => setStatus(e.target.value as Status)}
          aria-label="Estado"
        >
          <option value="ACTIVE">ACTIVE</option>
          <option value="PENDING">PENDING</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="EXPIRED">EXPIRED</option>
        </select>

        {/* Inicio */}
        <input
          type="datetime-local"
          className="dark-input text-xs h-9 rounded-lg px-2 w-[200px]"
          disabled={loading}
          value={start_at}
          onChange={e => setStartAt(e.target.value)}
          aria-label="Inicio"
        />

        {/* Sin expiración */}
        <label className="inline-flex items-center gap-2 text-xs h-9 px-3 rounded-lg border border-white/10 bg-white/5 whitespace-nowrap">
          <input
            type="checkbox"
            checked={noExp}
            disabled={loading}
            onChange={e=>setNoExp(e.target.checked)}
          />
          <span>Sin expiración</span>
        </label>

        {/* Fin */}
        <input
          type="datetime-local"
          className="dark-input text-xs h-9 rounded-lg px-2 w-[200px] disabled:opacity-60"
          disabled={loading || noExp}
          value={end_at}
          onChange={e => setEndAt(e.target.value)}
          aria-label="Fin"
        />

        {/* +días (recalcula fin) */}
        <input
          type="number"
          className="dark-input text-xs h-9 rounded-lg px-2 w-[90px] disabled:opacity-60"
          disabled={loading || noExp}
          value={dur}
          onChange={e => setDur(e.target.value === '' ? '' : Number(e.target.value))}
          placeholder="+días"
          title="Duración (recalcula fin desde inicio)"
        />

        {/* Acciones: empuja a la derecha cuando haya espacio */}
        <div className="ms-auto flex flex-wrap gap-1">
          <button
            onClick={apply}
            disabled={loading}
            className="btn-ghost text-xs h-9 px-3"
            title="Guardar cambios"
          >
            Guardar
          </button>

          <button
            onClick={expireNow}
            disabled={loading}
            className="inline-flex items-center rounded-lg border border-amber-500/40 bg-white/5 px-3 h-9 text-xs text-amber-300 hover:bg-amber-500/10 transition"
            title="Marcar como EXPIRED ahora"
          >
            Expirar ahora
          </button>

          <button
            onClick={remove}
            disabled={loading}
            className="inline-flex items-center rounded-lg border border-red-500/40 bg-white/5 px-3 h-9 text-xs text-red-300 hover:bg-red-500/10 transition"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

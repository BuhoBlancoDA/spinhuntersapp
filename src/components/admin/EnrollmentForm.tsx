'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import UserPicker, { FoundUser } from '@/components/admin/UserPicker'

export default function EnrollmentForm({ courseId }:{ courseId:number }) {
  const router = useRouter()
  const [selected, setSelected] = useState<FoundUser | null>(null)
  const [durationDays, setDurationDays] = useState<number | ''>('')
  const [noExp, setNoExp] = useState(true)
  const [status, setStatus] = useState<'ACTIVE'|'PENDING'|'CANCELLED'|'EXPIRED'>('ACTIVE')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string| null>(null)

  async function onEnroll(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!selected) { setMsg('Selecciona un usuario.'); return }

    const label = selected.username ? `@${selected.username}` : (selected.email || selected.user_id)
    const durLabel = noExp ? 'sin expiración' : `${durationDays || 0} días`
    if (!confirm(`¿Confirmas inscribir a ${label} en este curso (${durLabel}) con estado ${status}?`)) {
      return
    }

    setSaving(true)
    const payload:any = {
      course_id: courseId,
      user_id: selected.user_id,
      status,
      no_expiration: noExp
    }
    if (!noExp && durationDays) payload.duration_days = Number(durationDays)

    const res = await fetch('/api/admin/courses/enroll', {
      method:'POST',
      headers:{ 'content-type':'application/json' },
      body: JSON.stringify(payload)
    })
    const j = await res.json().catch(()=>({}))
    setSaving(false)
    if (!res.ok || !j.ok) { setMsg(j?.error || 'No se pudo inscribir'); return }

    setMsg('Inscripción guardada.')
    setSelected(null); setDurationDays(''); setNoExp(true)

    // Refresca la lista de inscripciones del Server Component
    router.refresh()
  }

  return (
    <form onSubmit={onEnroll} className="glass rounded-xl p-5 space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <UserPicker onChange={setSelected} />
        </div>

        <div>
          <label className="text-xs text-white/60">Estado</label>
          <select className="dark-input w-full" value={status} onChange={e=>setStatus(e.target.value as any)}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING">PENDING</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>

        <div className="sm:col-span-3 flex items-center gap-3">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={noExp} onChange={e=>setNoExp(e.target.checked)} />
            <span className="text-sm">Sin expiración</span>
          </label>
          {!noExp && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/60">Duración (días)</label>
              <input
                type="number"
                className="dark-input w-28"
                value={durationDays}
                onChange={e=>setDurationDays(e.target.value===''? '' : Number(e.target.value))}
                placeholder="Ej: 90"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-white/70">{msg}</span>
        <button disabled={saving || !selected} className="btn-brand">
          {saving ? 'Guardando…' : 'Inscribir'}
        </button>
      </div>
    </form>
  )
}

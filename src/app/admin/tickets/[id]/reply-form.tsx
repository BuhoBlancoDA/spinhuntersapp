'use client'

import { useState } from 'react'

export default function ReplyForm({ ticketId }: { ticketId: number }) {
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'OPEN' | 'IN_PROGRESS' | 'CLOSED'>('IN_PROGRESS')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setOk('')
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body, new_status: status }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Error')
      setOk('Respuesta enviada al usuario.')
      setBody('')
    } catch (e: any) {
      alert(e?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1">
          <label className="text-sm block mb-1">Nuevo estado</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as any)}
            className="dark-select w-full text-sm rounded-lg p-3"
          >
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <label className="text-sm block mb-1">Respuesta al usuario</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            required
            rows={6}
            className="dark-input w-full text-sm rounded-lg p-3"
            placeholder="Escribe tu respuesta…"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-white/70">{ok}</span>
        <button
          disabled={loading}
          className="inline-flex items-center rounded-lg bg-brand text-white px-4 py-2 hover:bg-brand/90 transition disabled:opacity-50 shadow-glow"
        >
          {loading ? 'Enviando…' : 'Responder'}
        </button>
      </div>
    </form>
  )
}

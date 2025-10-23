'use client'

import { useState } from 'react'

export default function ReplyFormUser({ ticketId }: { ticketId: number }) {
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setOk('')
    try {
      const res = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      const ct = res.headers.get('content-type') || ''
      const j = ct.includes('application/json') ? await res.json() : { error: await res.text() }
      if (!res.ok) throw new Error(j?.error || 'Error')
      setOk('Tu respuesta fue enviada.')
      setBody('')
      // mantenemos el comportamiento actual
      location.reload()
    } catch (e: any) {
      alert(e?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={5}
          className="dark-input w-full text-sm rounded-lg p-3"
          placeholder="Escribe tu mensaje…"
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/70">{ok}</span>
        <button
          disabled={loading}
          className="inline-flex items-center rounded-lg bg-brand text-white px-4 py-2 hover:bg-brand/90 transition disabled:opacity-50 shadow-glow"
        >
          {loading ? 'Enviando…' : 'Enviar respuesta'}
        </button>
      </div>
    </form>
  )
}

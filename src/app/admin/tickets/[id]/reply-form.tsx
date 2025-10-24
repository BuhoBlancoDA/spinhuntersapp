'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReplyForm({
  ticketId,
  ticketType, // 'SUPPORT' | 'PURCHASE' (opcional)
}: {
  ticketId: number
  ticketType?: 'SUPPORT' | 'PURCHASE'
}) {
  const router = useRouter()
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
        body: JSON.stringify({
          body: body.trim() || '',  // puede ir vacío
          new_status: status || '', // opcional
        }),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok) throw new Error(j?.error || 'Error')

      setOk(j?.message || 'Acción realizada.')
      setBody('')
      router.refresh()
    } catch (e: any) {
      alert(e?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  // Enviar confirmación de recepción (recibo) — SOLO para PURCHASE
  const sendReceipt = async () => {
    if (!confirm('¿Enviar confirmación de recepción (recibo) al usuario?')) return
    setLoading(true); setOk('')
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          send_receipt: true,
          new_status: status || '', // aplica el estado elegido en el selector
        }),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok) throw new Error(j?.error || 'No se pudo enviar el recibo')

      setOk(j?.message || 'Recibo enviado.')
      setBody('')
      router.refresh()
    } catch (e: any) {
      alert(e?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const btnLabel = body.trim() ? 'Responder' : 'Actualizar estado'

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
          <label className="text-sm block mb-1">Respuesta al usuario (opcional)</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={6}
            className="dark-input w-full text-sm rounded-lg p-3"
            placeholder="Escribe tu respuesta… (puedes dejarlo vacío para solo actualizar el estado)"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-white/70">{ok}</span>

        <div className="flex gap-2">
          {ticketType === 'PURCHASE' && (
            <button
              type="button"
              onClick={sendReceipt}
              disabled={loading}
              className="inline-flex items-center rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm hover:bg-emerald-500/15 transition disabled:opacity-50 shadow-glow"
              title="Enviar confirmación de recepción como factura en el hilo del ticket"
            >
              {loading ? 'Enviando…' : 'Enviar recibo'}
            </button>
          )}

          <button
            disabled={loading}
            className="inline-flex items-center rounded-lg bg-brand text-white px-4 py-2 hover:bg-brand/90 transition disabled:opacity-50 shadow-glow"
          >
            {loading ? 'Enviando…' : btnLabel}
          </button>
        </div>
      </div>
    </form>
  )
}

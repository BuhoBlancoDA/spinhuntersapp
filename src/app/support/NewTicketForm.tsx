'use client'

import { useState } from 'react'

export default function NewTicketForm() {
  const [type, setType] = useState<'SUPPORT' | 'PURCHASE'>('SUPPORT')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [purchaseMethod, setPurchaseMethod] = useState('')
  const [transactionCode, setTransactionCode] = useState('')
  const [amount, setAmount] = useState<number | ''>('')
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState<string>('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setOk('')
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type, subject, message,
          purchase_method: type === 'PURCHASE' ? purchaseMethod : undefined,
          transaction_code: type === 'PURCHASE' ? transactionCode : undefined,
          amount: type === 'PURCHASE' ? (amount === '' ? undefined : Number(amount)) : undefined,
          currency: type === 'PURCHASE' ? currency : undefined,
        })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Error')
      setOk(`Ticket creado correctamente (#${j.id}). Te escribiremos por correo.`)
      setSubject(''); setMessage('')
      setPurchaseMethod(''); setTransactionCode(''); setAmount(''); setCurrency('USD')
      setType('SUPPORT')
    } catch (err: any) {
      alert(err?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-white/10 p-5 bg-black/50 backdrop-blur-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-sm block mb-1">Tipo</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as any)}
            className="dark-select w-full text-sm rounded-lg p-3"
          >
            <option value="SUPPORT">Soporte</option>
            <option value="PURCHASE">Compra manual</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm block mb-1">Asunto</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
            className="dark-input w-full text-sm rounded-lg p-3"
            placeholder={type === 'PURCHASE' ? 'Activación de membresía por transferencia' : 'Describe tu problema'}
          />
        </div>

        {type === 'PURCHASE' && (
          <>
            <div>
              <label className="text-sm block mb-1">Método de pago</label>
              <input
                value={purchaseMethod}
                onChange={e => setPurchaseMethod(e.target.value)}
                required
                className="dark-input w-full text-sm rounded-lg p-3"
                placeholder="Transferencia bancaria, PayPal, etc."
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Código transacción</label>
              <input
                value={transactionCode}
                onChange={e => setTransactionCode(e.target.value)}
                required
                className="dark-input w-full text-sm rounded-lg p-3"
                placeholder="ID / referencia del pago"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:col-span-2">
              <div>
                <label className="text-sm block mb-1">Monto</label>
                <input
                  type="number" min="0" step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="dark-input w-full text-sm rounded-lg p-3"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm block mb-1">Moneda</label>
                <input
                  value={currency}
                  onChange={e => setCurrency(e.target.value.toUpperCase())}
                  required
                  className="dark-input w-full text-sm rounded-lg p-3"
                  placeholder="USD"
                />
              </div>
            </div>
          </>
        )}

        <div className="sm:col-span-2">
          <label className="text-sm block mb-1">Mensaje</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            rows={6}
            className="dark-input w-full text-sm rounded-lg p-3"
            placeholder={type === 'PURCHASE' ? 'Comparte detalles del pago y lo que necesitas activar.' : 'Cuéntanos qué ocurre.'}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-white/70">{ok}</span>
        <button
          disabled={loading}
          className="inline-flex items-center rounded-lg bg-brand text-white px-4 py-2 hover:bg-brand/90 transition disabled:opacity-50 shadow-glow"
        >
          {loading ? 'Enviando…' : 'Crear ticket'}
        </button>
      </div>
    </form>
  )
}

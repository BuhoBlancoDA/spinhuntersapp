'use client'

import { useMemo, useState } from 'react'

type Variant = {
  id: number
  name: string
  duration_days: number | null
  price: number
  currency: string
}
type Product = {
  id: string
  name: string
  kind: 'COURSE' | 'MEMBERSHIP'
  description?: string | null
  membership_plan_id?: number | null
  variants: Variant[]
}

export default function PurchaseFlow({ products }: { products: Product[] }) {
  const [productId, setProductId] = useState(products[0]?.id || '')
  const selectedProduct = useMemo(
    () => products.find(p => p.id === productId),
    [products, productId]
  )
  const [variantId, setVariantId] = useState<number | ''>(selectedProduct?.variants[0]?.id || '')
  const [couponCode, setCouponCode] = useState('')
  const [priceInfo, setPriceInfo] = useState<null | { originalAmount: number; discount: number; finalAmount: number; currency: string; couponId?: number }>(null)

  const [method, setMethod] = useState<'CARD'|'SKRILL'|'NETELLER'|'BINANCE'|'CRYPTO'|''>('')
  const [form, setForm] = useState<{ senderEmail?: string; reference?: string; hash?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [ok, setOk] = useState('')

  const variants = selectedProduct?.variants || []

  // Si cambia de producto, resetea selección
  function onChangeProduct(id: string) {
    setProductId(id)
    const first = products.find(p => p.id === id)?.variants[0]
    setVariantId(first?.id || '')
    setCouponCode('')
    setPriceInfo(null)
    setMethod('')
    setForm({})
    setOk('')
  }

  async function applyCoupon() {
    if (!productId || !variantId || !couponCode) return
    const res = await fetch('/api/coupons/apply', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productId, variantId, code: couponCode.trim() })
    })
    const j = await res.json().catch(() => null)
    if (!res.ok) {
      alert(j?.error || 'Cupón inválido')
      setPriceInfo(null)
      return
    }
    setPriceInfo(j)
  }

  async function submitPurchase() {
    if (!productId || !variantId || !selectedProduct) return
    if (!method) {
      alert('Selecciona un método de pago')
      return
    }

    const v = variants.find(v => v.id === variantId)
    if (!v) return

    const finalAmount = priceInfo?.finalAmount ?? v.price
    const currency = v.currency

    // Construir resumen
    const summaryLines: string[] = []
    summaryLines.push(`Solicitud de compra:`)
    summaryLines.push(`Producto: ${selectedProduct.name} (${selectedProduct.kind})`)
    summaryLines.push(`Variante: ${v.name}${v.duration_days ? ` (${v.duration_days} días)` : ''}`)
    if (priceInfo?.discount) {
      summaryLines.push(`Precio: ${v.price} ${currency}`)
      summaryLines.push(`Descuento: -${priceInfo.discount} ${currency}`)
    }
    summaryLines.push(`Total a pagar: ${finalAmount} ${currency}`)
    summaryLines.push(`Método de pago: ${method}`)
    if (method === 'SKRILL' || method === 'NETELLER') {
      summaryLines.push(`Correo del remitente: ${form.senderEmail || '-'}`)
      summaryLines.push(`Referencia del pago: ${form.reference || '-'}`)
    }
    if (method === 'BINANCE' || method === 'CRYPTO') {
      summaryLines.push(`Hash de la transacción: ${form.hash || '-'}`)
    }
    summaryLines.push('')
    summaryLines.push('Una vez el pago sea verificado se activarán los accesos (puede tardar hasta 24 horas).')

    setSubmitting(true); setOk('')
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'PURCHASE',
          subject: `Compra: ${selectedProduct.name} - ${v.name}`,
          message: summaryLines.join('\n'),
          purchase_method: method,
          transaction_code: (method === 'SKRILL' || method === 'NETELLER') ? (form.reference || null)
                            : (method === 'BINANCE' || method === 'CRYPTO') ? (form.hash || null)
                            : null,
          amount: finalAmount,
          currency,
          plan_id: selectedProduct.kind === 'MEMBERSHIP' ? (selectedProduct.membership_plan_id || null) : null,
          // extras ya soportados por schema:
          product_id: selectedProduct.id,     // será ignorado por el endpoint si no lo mapeaste; se incluirá en el body
          variant_id: v.id,                   // idem
        })
      })
      const j = await res.json().catch(() => null)
      if (!res.ok) throw new Error(j?.error || 'No se pudo enviar la solicitud')

      setOk('Solicitud enviada. Una vez el pago sea verificado se activarán los accesos (hasta 24 horas).')
      setMethod(''); setForm({}); setCouponCode(''); setPriceInfo(null)
    } catch (e: any) {
      alert(e?.message || 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Selección de producto */}
      <div className="flex flex-col gap-3">
        <label className="text-sm">Producto</label>
        <div className="flex flex-wrap gap-2">
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => onChangeProduct(p.id)}
              className={`px-3 py-2 rounded border text-sm ${p.id === productId ? 'border-brand bg-brand/10 text-white' : 'border-white/15 hover:bg-white/5'}`}
            >
              {p.name} <span className="text-white/60 text-xs">({p.kind === 'MEMBERSHIP' ? 'Membresía' : 'Curso'})</span>
            </button>
          ))}
        </div>
        {selectedProduct?.description && (
          <p className="text-xs text-white/70">{selectedProduct.description}</p>
        )}
      </div>

      {/* Variante / Duración */}
      <div className="flex flex-col gap-2">
        <label className="text-sm">Duración / Variante</label>
        <select
          className="w-full text-sm rounded border border-white/20 bg-neutral-900 px-2 py-2"
          value={variantId}
          onChange={e => { setVariantId(Number(e.target.value)); setPriceInfo(null) }}
        >
          {(variants || []).map(v => (
            <option key={v.id} value={v.id}>
              {v.name} — {v.price} {v.currency}
            </option>
          ))}
        </select>
      </div>

      {/* Cupón */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/70">¿Tienes un código promocional?</span>
        <input
          className="flex-1 text-sm rounded border border-white/20 bg-neutral-900 px-2 py-1"
          placeholder="Código"
          value={couponCode}
          onChange={e => setCouponCode(e.target.value)}
        />
        <button
          onClick={applyCoupon}
          className="text-sm rounded bg-white/10 px-3 py-1.5 hover:bg-white/15"
          type="button"
        >
          Aplicar
        </button>
      </div>

      {/* Resumen de precio */}
      <div className="text-sm text-white/90">
        {(() => {
          const v = variants.find(v => v.id === variantId)
          if (!v) return null
          if (!priceInfo) return <div>Precio: <b>{v.price} {v.currency}</b></div>
          return (
            <div className="space-y-1">
              <div>Precio: <s className="opacity-70">{priceInfo.originalAmount} {priceInfo.currency}</s></div>
              <div>Descuento: -{priceInfo.discount} {priceInfo.currency}</div>
              <div>Total: <b>{priceInfo.finalAmount} {priceInfo.currency}</b></div>
            </div>
          )
        })()}
      </div>

      {/* Instrucciones / Métodos */}
      <div className="rounded-xl border border-white/10 p-4 bg-white/[0.04] space-y-3">
        <h3 className="text-sm font-semibold">Instrucciones de compra</h3>
        <p className="text-xs text-white/70">El pago es manual. Tras enviar el formulario, soporte verificará el pago (hasta 24 horas).</p>

        {/* Métodos de pago */}
        <div className="flex flex-wrap gap-2">
          {(['CARD','SKRILL','NETELLER','BINANCE','CRYPTO'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMethod(m); setForm({}); }}
              className={`text-sm rounded px-3 py-1.5 border ${method === m ? 'border-brand bg-brand/10' : 'border-white/15 hover:bg-white/5'}`}
            >
              {m === 'CARD' ? 'Tarjeta de Crédito' :
               m === 'SKRILL' ? 'Skrill' :
               m === 'NETELLER' ? 'Neteller' :
               m === 'BINANCE' ? 'Binance' :
               'Criptomonedas'}
            </button>
          ))}
        </div>

        {/* Campos por método */}
        {method === 'CARD' && (
          <div className="text-sm space-y-2">
            <p>Se enviará un ticket automático con el motivo <b>“Quiero pagar con tarjeta de crédito”</b> incluyendo producto, tiempo y precio.</p>
          </div>
        )}

        {method === 'SKRILL' && (
          <div className="text-sm space-y-2">
            <p>Para pagar con <b>Skrill</b> envía el importe exacto (sin comisiones) a <b>angel3.6.0@hotmail.com</b>.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input label="Correo de quien envía" value={form.senderEmail} onChange={v => setForm(s => ({ ...s, senderEmail: v }))} />
              <Input label="Referencia del pago" value={form.reference} onChange={v => setForm(s => ({ ...s, reference: v }))} />
            </div>
          </div>
        )}

        {method === 'NETELLER' && (
          <div className="text-sm space-y-2">
            <p>Para pagar con <b>Neteller</b> envía el importe exacto (sin comisiones) a <b>grupoangel360@gmail.com</b>.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input label="Correo de quien envía" value={form.senderEmail} onChange={v => setForm(s => ({ ...s, senderEmail: v }))} />
              <Input label="Referencia del pago" value={form.reference} onChange={v => setForm(s => ({ ...s, reference: v }))} />
            </div>
          </div>
        )}

        {method === 'BINANCE' && (
          <div className="text-sm space-y-2">
            <p>Para pagar con <b>Binance</b> utiliza <b>grupoangel360@gmail.com</b>. Ingresa el <b>hash</b> de la transacción:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input label="Hash de la transacción" value={form.hash} onChange={v => setForm(s => ({ ...s, hash: v }))} />
            </div>
          </div>
        )}

        {method === 'CRYPTO' && (
          <div className="text-sm space-y-2">
            <p><b>Criptomonedas</b></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>USDT TRC20: <code className="text-xs">TKSrWyXgg5VuKiiCVGGTUXtSsZBr6cjs8b</code></li>
              <li>USDT ERC20: <code className="text-xs break-all">0x26a1fb283de104bde578b79185fd602bcc72ebbc</code></li>
            </ul>
            <p className="text-xs text-white/70">¿Otra cripto? Contacta soporte mediante un ticket.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input label="Hash de la transacción" value={form.hash} onChange={v => setForm(s => ({ ...s, hash: v }))} />
            </div>
          </div>
        )}

        <div className="text-xs text-white/70">
          UNA VEZ EL PAGO SEA VERIFICADO SE ACTIVARÁN LOS ACCESOS, ESTO PUEDE TARDAR 24 HORAS.
        </div>

        <div className="text-right">
          <button
            onClick={submitPurchase}
            disabled={submitting || !method || !variantId}
            className="inline-flex items-center rounded bg-brand text-white px-4 py-2 hover:bg-brand/90 transition disabled:opacity-50"
          >
            {submitting ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </div>

        {ok && <div className="text-xs text-emerald-400">{ok}</div>}
      </div>
    </div>
  )
}

function Input({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) {
  return (
    <label className="text-xs flex flex-col gap-1">
      <span className="text-white/80">{label}</span>
      <input
        className="text-sm rounded border border-white/20 bg-neutral-900 px-2 py-1"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  )
}

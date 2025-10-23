// src/app/dashboard/components/PurchaseModal.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type Variant = { id: number; name: string; duration_days: number | null; price: number; currency: string }
type Product = {
  id: string; name: string; kind: 'COURSE'|'MEMBERSHIP';
  description?: string | null; membership_plan_id?: number | null;
  variants: Variant[];
}

export default function PurchaseModal({ products, onClose }: { products: Product[]; onClose: () => void }) {
  // ---- PORTAL + bloqueo scroll ----
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Paso: 1 selección, 2 instrucciones/formulario
  const [step, setStep] = useState<1|2>(1)

  // Selección
  const [productId, setProductId] = useState(products[0]?.id || '')
  const selectedProduct = useMemo(() => products.find(p => p.id === productId), [products, productId])
  const variants = selectedProduct?.variants || []
  const [variantId, setVariantId] = useState<number | ''>(variants[0]?.id || '')

  // Cupón y precio
  const [couponCode, setCouponCode] = useState('')
  const [priceInfo, setPriceInfo] = useState<null | { originalAmount: number; discount: number; finalAmount: number; currency: string }>(null)

  // Método + formularios
  const [method, setMethod] = useState<'CARD'|'SKRILL'|'NETELLER'|'BINANCE'|'CRYPTO'|''>('')
  const [form, setForm] = useState<{ senderEmail?: string; reference?: string; hash?: string }>({})
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState('')

  // Equivalentes: USD (principal) y COP (opcional)
  const [showUSD, setShowUSD] = useState(false)
  const [usdRate, setUsdRate] = useState<number | null>(null)
  const [usdLoading, setUsdLoading] = useState(false)
  const [usdError, setUsdError] = useState<string | null>(null)

  const [showCOP, setShowCOP] = useState(false)
  const [copRate, setCopRate] = useState<number | null>(null)
  const [copLoading, setCopLoading] = useState(false)
  const [copError, setCopError] = useState<string | null>(null)

  function resetState() {
    setCouponCode(''); setPriceInfo(null)
    setMethod(''); setForm({})
    setStep(1)
    setShowUSD(false); setUsdRate(null); setUsdError(null); setUsdLoading(false)
    setShowCOP(false); setCopRate(null); setCopError(null); setCopLoading(false)
  }

  function onChangeProduct(id: string) {
    setProductId(id)
    const first = products.find(p => p.id === id)?.variants[0]
    setVariantId(first?.id || '')
    resetState()
  }

  async function applyCoupon() {
    if (!productId || !variantId || !couponCode) return
    const res = await fetch('/api/coupons/apply', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ productId, variantId, code: couponCode.trim() })
    })
    const j = await res.json().catch(() => null)
    if (!res.ok) { alert(j?.error || 'Cupón inválido'); setPriceInfo(null); return }
    setPriceInfo(j)
  }

  const activeVariant = useMemo(() => variants.find(v => v.id === variantId), [variants, variantId])
  const finalAmount = useMemo(() => priceInfo ? priceInfo.finalAmount : (activeVariant?.price ?? 0), [priceInfo, activeVariant])
  const currency = activeVariant?.currency || 'USD'

  const usdApprox = useMemo(() => (!usdRate ? null : +(finalAmount * usdRate).toFixed(2)), [finalAmount, usdRate])
  const copApprox = useMemo(() => (!copRate ? null : Math.round(finalAmount * copRate)), [finalAmount, copRate])

  async function ensureRate(to: 'USD'|'COP') {
    const state = to === 'USD'
      ? { rate: usdRate, setRate: setUsdRate, setLoading: setUsdLoading, setError: setUsdError }
      : { rate: copRate, setRate: setCopRate, setLoading: setCopLoading, setError: setCopError }

    if (state.rate || (to === 'USD' ? usdLoading : copLoading)) return
    state.setLoading(true); state.setError(null)
    try {
      const res = await fetch(`/api/rates/convert?base=${encodeURIComponent(currency)}&to=${to}`, { cache: 'no-store' })
      const j = await res.json().catch(() => null)
      if (!res.ok || !j?.rate) throw new Error('No disponible')
      state.setRate(Number(j.rate))
    } catch (e: any) {
      state.setError(`${to} no disponible`)
    } finally {
      state.setLoading(false)
    }
  }

  function toggleUSD() { if (!showUSD) ensureRate('USD'); setShowUSD(s => !s) }
  function toggleCOP() { if (!showCOP) ensureRate('COP'); setShowCOP(s => !s) }

  function goStep2() {
    if (!productId || !variantId) { alert('Selecciona una opción'); return }
    if (!method) { alert('Selecciona un método de pago'); return }
    setStep(2)
  }

  async function submitTicket() {
    if (!selectedProduct || !activeVariant) return
    if (method === 'SKRILL' || method === 'NETELLER') {
      if (!form.senderEmail || !form.reference) { alert('Completa correo del remitente y referencia.'); return }
    }
    if (method === 'BINANCE' || method === 'CRYPTO') {
      if (!form.hash) { alert('Completa el hash de la transacción.'); return }
    }

    const lines: string[] = []
    lines.push('Solicitud de compra (pago manual):')
    lines.push(`Producto: ${selectedProduct.name} (${selectedProduct.kind})`)
    lines.push(`Opción: ${activeVariant.name}${activeVariant.duration_days ? ` (${activeVariant.duration_days} días)` : ''}`)
    if (priceInfo?.discount) {
      lines.push(`Precio: ${activeVariant.price} ${currency}`)
      lines.push(`Descuento: -${priceInfo.discount} ${currency}`)
    }
    lines.push(`Total a pagar: ${finalAmount} ${currency}`)
    if (showUSD && usdApprox != null) lines.push(`Equivalente aprox: ~${usdApprox.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`)
    if (showCOP && copApprox != null) lines.push(`Equivalente aprox: ~${copApprox.toLocaleString()} COP`)
    lines.push(`Método: ${labelMethod(method)}`)
    if (method === 'SKRILL' || method === 'NETELLER') {
      lines.push(`Correo del remitente: ${form.senderEmail}`)
      lines.push(`Referencia del pago: ${form.reference}`)
    }
    if (method === 'BINANCE' || method === 'CRYPTO') {
      lines.push(`Hash de la transacción: ${form.hash}`)
    }
    lines.push('')
    lines.push('Una vez el pago sea verificado se activarán los accesos (puede tardar hasta 24 horas).')

    setBusy(true); setOk('')
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'PURCHASE',
          subject: method === 'CARD'
            ? `Solicitar link de pago: ${selectedProduct.name} - ${activeVariant.name}`
            : `Compra: ${selectedProduct.name} - ${activeVariant.name}`,
          message: lines.join('\n'),
          purchase_method: method,
          transaction_code:
            (method === 'SKRILL' || method === 'NETELLER') ? (form.reference || null)
            : (method === 'BINANCE' || method === 'CRYPTO') ? (form.hash || null)
            : null,
          amount: finalAmount,
          currency,
          plan_id: selectedProduct.kind === 'MEMBERSHIP' ? (selectedProduct.membership_plan_id || null) : null,
          product_id: selectedProduct.id,
          variant_id: activeVariant.id,
        })
      })
      const j = await res.json().catch(() => null)
      if (!res.ok) throw new Error(j?.error || 'No se pudo enviar la solicitud')
      setOk('Solicitud enviada. Una vez el pago sea verificado se activarán los accesos (hasta 24 horas).')
      setTimeout(() => onClose(), 1200)
    } catch (e: any) {
      alert(e?.message || 'Error')
    } finally {
      setBusy(false)
    }
  }

  const modal = (
    <div className="fixed inset-0 z-[999] grid place-items-center bg-black/70 p-4">
      <div className="w-[min(96vw,760px)] rounded-xl border border-white/12 bg-neutral-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-base font-semibold">Adquirir producto</h3>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded bg-red-600/90 hover:bg-red-500 text-white transition"
          >
            Cerrar
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 space-y-4">
          {step === 1 && (
            <Step1
              products={products}
              selectedProduct={selectedProduct}
              productId={productId}
              onChangeProduct={onChangeProduct}
              variants={variants}
              variantId={variantId}
              setVariantId={setVariantId}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              applyCoupon={applyCoupon}
              priceInfo={priceInfo}
              activeVariant={activeVariant}
              method={method}
              setMethod={setMethod}
              goStep2={goStep2}
            />
          )}

          {step === 2 && selectedProduct && activeVariant && (
            <Step2
              selectedProduct={selectedProduct}
              activeVariant={activeVariant}
              finalAmount={finalAmount}
              currency={currency}
              showUSD={showUSD}
              usdApprox={usdApprox}
              usdLoading={usdLoading}
              usdError={usdError}
              onToggleUSD={toggleUSD}
              showCOP={showCOP}
              copApprox={copApprox}
              copLoading={copLoading}
              copError={copError}
              onToggleCOP={toggleCOP}
              method={method}
              form={form}
              setForm={setForm}
              busy={busy}
              ok={ok}
              onBack={() => setStep(1)}
              submitTicket={submitTicket}
            />
          )}
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(modal, document.body)
}

function Step1(props: any) {
  const {
    products, productId, onChangeProduct,
    variants, variantId, setVariantId,
    couponCode, setCouponCode, applyCoupon,
    priceInfo, activeVariant, method, setMethod, goStep2
  } = props

  const amount = priceInfo
    ? { label: 'Total', value: `${priceInfo.finalAmount} ${priceInfo.currency}`, strike: `${priceInfo.originalAmount} ${priceInfo.currency}`, discount: priceInfo.discount }
    : activeVariant
      ? { label: 'Precio', value: `${activeVariant.price} ${activeVariant.currency}`, strike: null, discount: null }
      : null

  return (
    <div className="space-y-4">
      {/* Producto / Opción */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Producto">
          <select
            className="field"
            value={productId}
            onChange={(e) => onChangeProduct(e.target.value)}
          >
            {props.products.map((p: Product) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.kind === 'MEMBERSHIP' ? 'Membresía' : 'Curso'})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Opción">
          <select
            className="field"
            value={variantId}
            onChange={(e) => { setVariantId(Number(e.target.value)); /* reset precio si quieres */ }}
          >
            {(variants || []).map((v: Variant) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Precio grande + Cupón */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs text-white/70">{amount?.label}</div>
          <div className="text-2xl font-bold">{amount?.value}</div>
          {amount?.strike && (
            <div className="text-xs text-white/60">
              <s>{amount.strike}</s> {amount.discount ? ` · desc ${amount.discount}` : ''}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            className="field"
            placeholder="Código promocional"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
          <button onClick={applyCoupon} className="btn-ghost" type="button">Aplicar</button>
        </div>
      </div>

      {/* Método */}
      <div className="grid sm:grid-cols-2 gap-2">
        <SelectMethod value={method} onChange={setMethod} />
      </div>

      <div className="text-right">
        <button onClick={goStep2} className="btn-brand">Pagar</button>
      </div>
    </div>
  )
}

function Step2(props: any) {
  const {
    selectedProduct, finalAmount, currency,
    showUSD, usdApprox, usdLoading, usdError, onToggleUSD,
    showCOP, copApprox, copLoading, copError, onToggleCOP,
    method, form, setForm, busy, ok, onBack, submitTicket
  } = props

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm">
        <b>ATENCIÓN:</b> Estás a punto de realizar un pago manual para <b>{selectedProduct.name}</b> por <b>{finalAmount} {currency}</b>.
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {/* Equivalente USD principal si la moneda no es USD */}
          {currency !== 'USD' && (
            <>
              <button type="button" onClick={onToggleUSD} className="px-2 py-1 rounded border border-white/20 hover:bg-white/10">
                {showUSD ? 'Ocultar equivalente USD' : 'Mostrar equivalente USD'}
              </button>
              {showUSD && (
                <span>
                  {usdLoading && 'Cargando…'}
                  {usdError && <span className="text-red-400">{usdError}</span>}
                  {!usdLoading && !usdError && usdApprox != null && <>≈ <b>{usdApprox.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</b></>}
                </span>
              )}
            </>
          )}

          {/* COP opcional */}
          <button type="button" onClick={onToggleCOP} className="px-2 py-1 rounded border border-white/20 hover:bg-white/10">
            {showCOP ? 'Ocultar equivalente COP' : 'Mostrar equivalente COP'}
          </button>
          {showCOP && (
            <span>
              {copLoading && 'Cargando…'}
              {copError && <span className="text-red-400">{copError}</span>}
              {!copLoading && !copError && copApprox != null && <>≈ <b>{copApprox.toLocaleString()} COP</b></>}
            </span>
          )}
        </div>
      </div>

      {/* Instrucciones por método */}
      {method === 'CARD' && (
        <div className="space-y-2 text-sm">
          <p>- Para pagar con <b>Tarjeta de Crédito</b>, se solicitará un <b>link de pago</b> al soporte.</p>
          <p>- Una vez recibido podrás realizar el pago.</p>
          <p>- <b>IMPORTANTE:</b> El cobro se realiza en <b>PESOS COLOMBIANOS</b> al TRM actual.</p>
          <p>- Cuando completes el pago, responde el ticket donde te enviaron el link.</p>
        </div>
      )}

      {(method === 'SKRILL' || method === 'NETELLER') && (
        <div className="space-y-2 text-sm">
          <p>- Este pago es <b>manual</b> por <b>{method === 'SKRILL' ? 'Skrill' : 'Neteller'}</b> (importe exacto, sin comisiones).</p>
          <p>- Correo de destino: <b>{method === 'SKRILL' ? 'angel3.6.0@hotmail.com' : 'grupoangel360@gmail.com'}</b></p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input label="Correo de quien envía" value={form.senderEmail} onChange={(v: string) => setForm((s: any) => ({ ...s, senderEmail: v }))} />
            <Input label="Referencia del pago" value={form.reference} onChange={(v: string) => setForm((s: any) => ({ ...s, reference: v }))} />
          </div>
          <p className="text-xs text-white/70">Adjunta el correo del remitente y el código de transacción.</p>
        </div>
      )}

      {method === 'BINANCE' && (
        <div className="space-y-2 text-sm">
          <p>- Pago <b>manual</b> con <b>Binance</b>.</p>
          <p>- Cuenta/Correo: <b>grupoangel360@gmail.com</b></p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input label="Hash de la transacción" value={form.hash} onChange={(v: string) => setForm((s: any) => ({ ...s, hash: v }))} />
          </div>
          <p className="text-xs text-white/70">Incluye el <b>hash</b> para verificar el pago.</p>
        </div>
      )}

      {method === 'CRYPTO' && (
        <div className="space-y-2 text-sm">
          <p>- Pago <b>manual</b> con <b>Criptomonedas</b>.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>USDT TRC20: <code className="text-xs">TKSrWyXgg5VuKiiCVGGTUXtSsZBr6cjs8b</code></li>
            <li>USDT ERC20: <code className="text-xs break-all">0x26a1fb283de104bde578b79185fd602bcc72ebbc</code></li>
          </ul>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input label="Hash de la transacción" value={form.hash} onChange={(v: string) => setForm((s: any) => ({ ...s, hash: v }))} />
          </div>
          <p className="text-xs text-white/70">Si necesitas otra cripto, abre un ticket de soporte.</p>
        </div>
      )}

      <div className="text-xs text-white/70">
        UNA VEZ EL PAGO SEA VERIFICADO SE ACTIVARÁN LOS ACCESOS, ESTO PUEDE TARDAR 24 HORAS.
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost">Volver</button>
        <button onClick={submitTicket} disabled={busy} className="btn-brand">
          {busy ? 'Enviando…' : (method === 'CARD' ? 'Solicitar link' : 'Confirmar pago')}
        </button>
      </div>

      {ok && <div className="text-xs text-emerald-400">{ok}</div>}
    </div>
  )
}

/* ---------- UI helpers ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-xs flex flex-col gap-1">
      <span className="text-white/80">{label}</span>
      {children}
    </label>
  )
}

function SelectMethod({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  return (
    <label className="text-xs flex flex-col gap-1">
      <span className="text-white/80">Método de pago</span>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value as any)}>
        <option value="">Selecciona…</option>
        <option value="CARD">Tarjeta de Crédito</option>
        <option value="SKRILL">Skrill</option>
        <option value="NETELLER">Neteller</option>
        <option value="BINANCE">Binance</option>
        <option value="CRYPTO">Criptomonedas</option>
      </select>
    </label>
  )
}

function Input({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) {
  return (
    <label className="text-xs flex flex-col gap-1">
      <span className="text-white/80">{label}</span>
      <input className="field" value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

function labelMethod(m: string) {
  return m === 'CARD' ? 'Tarjeta de Crédito'
    : m === 'SKRILL' ? 'Skrill'
    : m === 'NETELLER' ? 'Neteller'
    : m === 'BINANCE' ? 'Binance'
    : 'Criptomonedas'
}

/* ---------- estilos utilitarios tailwind ---------- */
/* Usa estas clases en tu globals si quieres:
.field { @apply text-sm rounded border border-white/20 bg-neutral-900 px-2 py-2; }
.btn-ghost { @apply text-sm rounded bg-white/10 px-3 py-2 hover:bg-white/15; }
.btn-brand { @apply inline-flex items-center rounded bg-brand text-white px-4 py-2 hover:bg-brand/90 transition disabled:opacity-50; }
*/

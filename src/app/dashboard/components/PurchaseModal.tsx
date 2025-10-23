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
  // ---- PORTAL + bloqueo scroll + ESC para cerrar ----
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

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
    <div className="fixed inset-0 z-[999]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className="absolute inset-x-0 top-10 mx-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-neutral-950/95 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <div className="space-y-0.5">
            <h3 className="text-lg font-semibold">Adquirir producto</h3>
            <div className="flex items-center gap-2 text-[11px]">
              <span className={`px-2 py-0.5 rounded border ${step === 1 ? 'border-brand/50 text-brand/90 bg-brand/10' : 'border-white/20 text-white/60'}`}>Paso 1: Selección</span>
              <span className={`px-2 py-0.5 rounded border ${step === 2 ? 'border-brand/50 text-brand/90 bg-brand/10' : 'border-white/20 text-white/60'}`}>Paso 2: Confirmación</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded bg-red-600/90 hover:bg-red-500 text-white transition"
            aria-label="Cerrar"
          >
            Cerrar
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5">
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

/* ---------- Step 1 ---------- */
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
    <div className="space-y-5">
      {/* Producto / Opción */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Producto">
          <select
            className={FIELD}
            value={productId}
            onChange={(e) => onChangeProduct(e.target.value)}
          >
            {products.map((p: Product) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.kind === 'MEMBERSHIP' ? 'Membresía' : 'Curso'})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Opción">
          <select
            className={FIELD}
            value={variantId}
            onChange={(e) => { const v = Number(e.target.value); setVariantId(isNaN(v) ? '' : v) }}
          >
            {(variants || []).map((v: Variant) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Precio + Cupón */}
      <div className="grid md:grid-cols-2 gap-4 items-end">
        <div className="rounded-xl border border-white/12 bg-white/[0.04] p-4">
          <div className="text-xs text-white/70">{amount?.label}</div>
          <div className="mt-0.5 text-2xl font-bold">{amount?.value}</div>
          {amount?.strike && (
            <div className="text-xs text-white/60 mt-1">
              <s>{amount.strike}</s> {amount.discount ? ` · desc ${amount.discount}` : ''}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <label className="text-xs flex-1">
            <span className="block text-white/80 mb-1">Código promocional</span>
            <input
              className={FIELD}
              placeholder="Escribe tu cupón"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
          </label>
          <button onClick={applyCoupon} type="button" className="btn-ghost h-[38px] sm:h-[40px]">Aplicar</button>
        </div>
      </div>

      {/* Método de pago */}
      <div className="grid sm:grid-cols-2 gap-4">
        <SelectMethod value={method} onChange={setMethod} />
        <div className="sm:text-right">
          <button onClick={goStep2} className="btn-brand mt-6 sm:mt-0 w-full sm:w-auto">Continuar</button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Step 2 ---------- */
function Step2(props: any) {
  const {
    selectedProduct, finalAmount, currency,
    showUSD, usdApprox, usdLoading, usdError, onToggleUSD,
    showCOP, copApprox, copLoading, copError, onToggleCOP,
    method, form, setForm, busy, ok, onBack, submitTicket
  } = props

  return (
    <div className="space-y-5">
      {/* Banner de confirmación + equivalencias */}
      <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm">
        <b>Confirmación:</b> Pago para <b>{selectedProduct.name}</b> por <b>{finalAmount} {currency}</b>.
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
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
        <CardSection title="Tarjeta de crédito">
          <p>- Se solicitará un <b>link de pago</b> al soporte.</p>
          <p>- El cobro se realiza en <b>PESOS COLOMBIANOS</b> al TRM actual.</p>
          <p>- Tras pagar, responde el ticket con la confirmación.</p>
        </CardSection>
      )}

      {(method === 'SKRILL' || method === 'NETELLER') && (
        <CardSection title={method === 'SKRILL' ? 'Skrill' : 'Neteller'}>
          <p>- Pago <b>manual</b> (importe exacto, sin comisiones).</p>
          <p>- Correo de destino: <b>{method === 'SKRILL' ? 'angel3.6.0@hotmail.com' : 'grupoangel360@gmail.com'}</b></p>
          <div className="grid gap-2 sm:grid-cols-2 mt-2">
            <Input label="Correo del remitente" value={form.senderEmail} onChange={(v: string) => setForm((s: any) => ({ ...s, senderEmail: v }))} />
            <Input label="Referencia del pago" value={form.reference} onChange={(v: string) => setForm((s: any) => ({ ...s, reference: v }))} />
          </div>
          <p className="text-xs text-white/70 mt-1">Incluye remitente y referencia para verificar más rápido.</p>
        </CardSection>
      )}

      {method === 'BINANCE' && (
        <CardSection title="Binance">
          <p>- Pago <b>manual</b> con Binance.</p>
          <p>- Cuenta/Correo: <b>grupoangel360@gmail.com</b></p>
          <div className="grid gap-2 sm:grid-cols-2 mt-2">
            <Input label="Hash de la transacción" value={form.hash} onChange={(v: string) => setForm((s: any) => ({ ...s, hash: v }))} />
          </div>
        </CardSection>
      )}

      {method === 'CRYPTO' && (
        <CardSection title="Criptomonedas">
          <ul className="list-disc pl-5 space-y-1">
            <li>USDT TRC20: <code className="text-xs">TKSrWyXgg5VuKiiCVGGTUXtSsZBr6cjs8b</code></li>
            <li>USDT ERC20: <code className="text-xs break-all">0x26a1fb283de104bde578b79185fd602bcc72ebbc</code></li>
          </ul>
          <div className="grid gap-2 sm:grid-cols-2 mt-2">
            <Input label="Hash de la transacción" value={form.hash} onChange={(v: string) => setForm((s: any) => ({ ...s, hash: v }))} />
          </div>
          <p className="text-xs text-white/70 mt-1">¿Otra red/cripto? Abre un ticket de soporte.</p>
        </CardSection>
      )}

      <div className="text-[11px] text-white/60">
        Al verificar el pago se activarán los accesos (hasta 24 horas).
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

const FIELD =
  'w-full rounded-lg bg-neutral-900/90 text-white placeholder-white/50 ' +
  'border border-white/15 px-3 py-2 outline-none ' +
  'focus:ring-2 focus:ring-brand/30 focus:border-brand/60'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-xs flex flex-col gap-1">
      <span className="text-white/80">{label}</span>
      {children}
    </label>
  )
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <h4 className="text-sm font-semibold tracking-wide text-white/90 mb-1">{title}</h4>
      <div className="space-y-1 text-sm">{children}</div>
    </section>
  )
}

function SelectMethod({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  return (
    <label className="text-xs flex flex-col gap-1">
      <span className="text-white/80">Método de pago</span>
      <select className={FIELD} value={value} onChange={(e) => onChange(e.target.value as any)}>
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
      <input className={FIELD} value={value || ''} onChange={(e) => onChange(e.target.value)} />
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

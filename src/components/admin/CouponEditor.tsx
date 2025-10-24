// src/components/admin/CouponEditor.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Product = { id: string; name: string; is_active: boolean }
type Coupon = {
  id?: number
  code: string
  kind: 'PERCENT' | 'AMOUNT'
  value: number
  is_active: boolean
  product_id?: string | null
  starts_at?: string | null
  expires_at?: string | null
  max_redemptions?: number | null
}

/* Helpers fecha: solo día en UI, ISO al guardar */
const toDateInput = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const dateStartISO = (yyyyMMdd: string) => {
  const [y, m, d] = yyyyMMdd.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
}
const dateEndISO = (yyyyMMdd: string) => {
  const [y, m, d] = yyyyMMdd.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
}

export default function CouponEditor({
  coupon,
  products
}: {
  coupon?: Coupon
  products: Product[]
}) {
  const router = useRouter()
  const [form, setForm] = useState(() => ({
    id: coupon?.id,
    code: coupon?.code || '',
    kind: (coupon?.kind || 'PERCENT') as Coupon['kind'],
    value: coupon?.value ?? 10,
    is_active: coupon?.is_active ?? true,
    product_id: coupon?.product_id ?? null,
    starts_on: toDateInput(coupon?.starts_at || null),
    expires_on: toDateInput(coupon?.expires_at || null),
    max_redemptions: coupon?.max_redemptions ?? null
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSave() {
    setSaving(true); setError(null)
    const payload = {
      id: form.id,
      code: form.code,
      kind: form.kind,
      value: Number(form.value),
      is_active: !!form.is_active,
      product_id: form.product_id || null,
      starts_at: form.starts_on ? dateStartISO(form.starts_on) : null,
      expires_at: form.expires_on ? dateEndISO(form.expires_on) : null,
      max_redemptions:
        form.max_redemptions === null ||
        form.max_redemptions === undefined ||
        (form.max_redemptions as unknown as string) === ''
          ? null
          : Number(form.max_redemptions),
    }

    const res = await fetch('/api/admin/coupons/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok || !data?.ok) {
      setError(data?.error || 'Error al guardar')
      return
    }
    router.push('/admin/coupons')
    router.refresh()
  }

  async function onDelete() {
    if (!form.id) return
    if (!confirm('¿Eliminar este cupón? Se borrarán también sus redenciones.')) return
    const res = await fetch(`/api/admin/coupons/${form.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.ok) {
      setError(data?.error || 'No se pudo eliminar')
      return
    }
    router.push('/admin/coupons')
    router.refresh()
  }

  return (
    <div className="glass rounded-2xl p-6 sm:p-8 space-y-6 shadow-glow">
      {error && (
        <div className="rounded border border-red-500/30 bg-red-500/10 text-red-200 text-sm px-3 py-2">
          {error}
        </div>
      )}

      {/* Básicos */}
      <section className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="text-[11px] uppercase tracking-wide text-white/60">Código</label>
          <input
            className="dark-input w-full rounded-lg px-3 py-2 mt-1"
            value={form.code}
            onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
            placeholder="EJ: ULTIMATE30"
          />
          <p className="text-[11px] text-white/50 mt-1">
            Se guarda en MAYÚSCULAS. 3–40 caracteres (A-Z, 0-9, guion).
          </p>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wide text-white/60">Tipo de descuento</label>
          <select
            className="dark-select w-full rounded-lg px-3 py-2 mt-1"
            value={form.kind}
            onChange={(e) => setForm(f => ({ ...f, kind: e.target.value as Coupon['kind'] }))}
          >
            <option value="PERCENT">Porcentaje (%)</option>
            <option value="AMOUNT">Monto fijo</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wide text-white/60">
            Valor {form.kind === 'PERCENT' ? '(1–100)' : '(>0)'}
          </label>
          <input
            type="number"
            step="0.01"
            className="dark-input w-full rounded-lg px-3 py-2 mt-1"
            value={form.value}
            onChange={(e) => setForm(f => ({ ...f, value: Number(e.target.value) }))}
          />
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wide text-white/60">Estado</label>
          <select
            className="dark-select w-full rounded-lg px-3 py-2 mt-1"
            value={form.is_active ? '1' : '0'}
            onChange={(e) => setForm(f => ({ ...f, is_active: e.target.value === '1' }))}
          >
            <option value="1">Activo</option>
            <option value="0">Inactivo</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-[11px] uppercase tracking-wide text-white/60">
            Producto específico (opcional)
          </label>
          <select
            className="dark-select w-full rounded-lg px-3 py-2 mt-1"
            value={form.product_id || ''}
            onChange={(e) => setForm(f => ({ ...f, product_id: e.target.value || null }))}
          >
            <option value="">— Global (aplica a todos) —</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}{p.is_active ? '' : ' (inactivo)'}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-white/50 mt-1">
            Si eliges un producto, el cupón solo funcionará con ese producto.
          </p>
        </div>
      </section>

      {/* Vigencia (fecha sin hora, modo oscuro) */}
      <section className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="text-[11px] uppercase tracking-wide text-white/60">Empieza (opcional)</label>
          <input
            type="date"
            className="dark-input w-full rounded-lg px-3 py-2 mt-1"
            value={form.starts_on}
            onChange={(e) => setForm(f => ({ ...f, starts_on: e.target.value }))}
          />
          <p className="text-[11px] text-white/50 mt-1">Se guardará al <b>inicio</b> del día.</p>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wide text-white/60">Termina (opcional)</label>
          <input
            type="date"
            className="dark-input w-full rounded-lg px-3 py-2 mt-1"
            value={form.expires_on}
            onChange={(e) => setForm(f => ({ ...f, expires_on: e.target.value }))}
          />
          <p className="text-[11px] text-white/50 mt-1">Se guardará al <b>final</b> del día.</p>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wide text-white/60">
            Máximo de redenciones (opcional)
          </label>
          <input
            type="number"
            className="dark-input w-full rounded-lg px-3 py-2 mt-1"
            value={form.max_redemptions ?? ''}
            onChange={(e) => {
              const v = e.target.value
              setForm(f => ({ ...f, max_redemptions: v === '' ? null : Number(v) }))
            }}
            placeholder="Ej: 100"
          />
        </div>
      </section>

      {/* Acciones */}
      <section className="flex flex-col sm:flex-row gap-3 justify-end">
        {form.id && (
          <button
            onClick={onDelete}
            className="inline-flex items-center rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200 hover:bg-red-500/15"
          >
            Eliminar
          </button>
        )}
        <button
          onClick={onSave}
          disabled={saving}
          className="btn-brand text-sm"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </section>
    </div>
  )
}

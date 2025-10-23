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

function toLocalInput(iso: string) {
  const d = new Date(iso)
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 16) // yyyy-MM-ddTHH:mm
}

export default function CouponEditor({ coupon, products }: {
  coupon?: Coupon
  products: Product[]
}) {
  const router = useRouter()
  const [form, setForm] = useState<Coupon>(() => ({
    id: coupon?.id,
    code: coupon?.code || '',
    kind: coupon?.kind || 'PERCENT',
    value: coupon?.value ?? 10,
    is_active: coupon?.is_active ?? true,
    product_id: coupon?.product_id ?? null,
    starts_at: coupon?.starts_at ? toLocalInput(coupon.starts_at) : '',
    expires_at: coupon?.expires_at ? toLocalInput(coupon.expires_at) : '',
    max_redemptions: coupon?.max_redemptions ?? null
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSave() {
    setSaving(true); setError(null)
    const payload = {
      ...form,
      // normalizamos para el API: ISO UTC o null
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      product_id: form.product_id || null,
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
    const data = await res.json()
    setSaving(false)
    if (!res.ok || !data.ok) {
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
    const data = await res.json()
    if (!res.ok || !data.ok) {
      setError(data?.error || 'No se pudo eliminar')
      return
    }
    router.push('/admin/coupons')
    router.refresh()
  }

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      {error && <div className="text-red-300 text-sm">{error}</div>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/60">Código</label>
          <input
            className="w-full mt-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            value={form.code}
            onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))}
            placeholder="EJ: ULTIMATE30"
          />
          <p className="text-[11px] text-white/50 mt-1">
            Se guarda en MAYÚSCULAS. 3–40 caracteres (A-Z, 0-9, guion).
          </p>
        </div>

        <div>
          <label className="text-xs text-white/60">Tipo de descuento</label>
          <select
            className="w-full mt-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            value={form.kind}
            onChange={(e) => setForm(f => ({ ...f, kind: e.target.value as Coupon['kind'] }))}
          >
            <option value="PERCENT">Porcentaje (%)</option>
            <option value="AMOUNT">Monto fijo</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-white/60">
            Valor {form.kind === 'PERCENT' ? '(1–100)' : '(>0)'}
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full mt-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            value={form.value}
            onChange={(e) => setForm(f => ({ ...f, value: Number(e.target.value) }))}
          />
        </div>

        <div>
          <label className="text-xs text-white/60">Estado</label>
          <select
            className="w-full mt-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            value={form.is_active ? '1' : '0'}
            onChange={(e) => setForm(f => ({ ...f, is_active: e.target.value === '1' }))}
          >
            <option value="1">Activo</option>
            <option value="0">Inactivo</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-white/60">Producto específico (opcional)</label>
          <select
            className="w-full mt-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2"
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

        <div>
          <label className="text-xs text-white/60">Empieza (opcional)</label>
          <input
            type="datetime-local"
            className="w-full mt-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            value={form.starts_at || ''}
            onChange={(e) => setForm(f => ({ ...f, starts_at: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-xs text-white/60">Termina (opcional)</label>
          <input
            type="datetime-local"
            className="w-full mt-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            value={form.expires_at || ''}
            onChange={(e) => setForm(f => ({ ...f, expires_at: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-xs text-white/60">Máximo de redenciones (opcional)</label>
          <input
            type="number"
            className="w-full mt-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2"
            value={form.max_redemptions ?? ''}
            onChange={(e) => {
              const v = e.target.value
              setForm(f => ({ ...f, max_redemptions: v === '' ? null : Number(v) }))
            }}
            placeholder="Ej: 100"
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        {form.id && (
          <button
            onClick={onDelete}
            className="px-4 py-2 rounded border border-red-500/50 text-red-200 hover:bg-red-500/10"
          >
            Eliminar
          </button>
        )}
        <button
          onClick={onSave}
          disabled={saving}
          className="btn-brand"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

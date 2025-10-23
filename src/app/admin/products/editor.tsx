'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ProductEditor({
  mode,
  product,
  variants
}: {
  mode: 'new' | 'edit'
  product?: any
  variants?: any[]
}) {
  const router = useRouter()
  const [name, setName] = useState(product?.name || '')
  const [description, setDescription] = useState(product?.description || '')
  const [kind, setKind] = useState<'COURSE'|'MEMBERSHIP'>(product?.kind || 'COURSE')
  const [isActive, setIsActive] = useState<boolean>(product?.is_active ?? true)
  const [planId, setPlanId] = useState<number | ''>(product?.membership_plan_id || '')

  const [vs, setVs] = useState<(any)[]>(variants || [
    { id: null, name: kind === 'MEMBERSHIP' ? '1 mes' : 'Acceso completo', duration_days: kind === 'MEMBERSHIP' ? 30 : null, price: 0, currency: 'USD', is_active: true, sort_order: 10 }
  ])
  const [saving, setSaving] = useState(false)

  function setVariant(i: number, patch: Partial<any>) {
    setVs(arr => arr.map((v, idx) => idx === i ? { ...v, ...patch } : v))
  }
  function addVariant() {
    setVs(arr => [...arr, { id: null, name: 'Nueva', duration_days: kind === 'MEMBERSHIP' ? 30 : null, price: 0, currency: 'USD', is_active: true, sort_order: (arr[arr.length-1]?.sort_order || 90) + 10 }])
  }
  function removeVariant(i: number) {
    setVs(arr => arr.filter((_, idx) => idx !== i))
  }

  async function save() {
    setSaving(true)
    try {
      // Upsert product
      const res = await fetch('/api/admin/products/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: product?.id || null,
          name, description, kind, is_active: isActive, membership_plan_id: kind === 'MEMBERSHIP' ? (planId || null) : null,
          variants: vs
        })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Error al guardar')
      router.push('/admin/products')
    } catch (e: any) {
      alert(e?.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-dvh p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{mode === 'new' ? 'Nuevo producto' : 'Editar producto'}</h1>

      <div className="rounded-lg border border-white/10 p-4 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Nombre" value={name} onChange={setName} />
          <Select label="Tipo" value={kind} onChange={v => setKind(v as any)} options={[['COURSE','Curso'], ['MEMBERSHIP','Membresía']]} />
        </div>
        <Textarea label="Descripción" value={description} onChange={setDescription} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Checkbox label="Activo" checked={isActive} onChange={setIsActive} />
          {kind === 'MEMBERSHIP' && (
            <Input label="Plan de membresía (id)" value={String(planId)} onChange={v => setPlanId(v ? Number(v) : '')} placeholder="ID en membership_plans (ULTIMATE)" />
          )}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 p-4 space-y-3">
        <h2 className="text-lg font-semibold">Variantes / Duraciones</h2>
        {vs.map((v, i) => (
          <div key={i} className="grid sm:grid-cols-6 gap-2 items-end border border-white/10 p-3 rounded">
            <Input label="Nombre" value={v.name} onChange={val => setVariant(i, { name: val })} />
            <Input label="Días (opcional)" value={v.duration_days ?? ''} onChange={val => setVariant(i, { duration_days: val === '' ? null : Number(val) })} />
            <Input label="Precio" value={v.price} onChange={val => setVariant(i, { price: Number(val) })} />
            <Input label="Moneda" value={v.currency} onChange={val => setVariant(i, { currency: val.toUpperCase() })} />
            <Input label="Orden" value={v.sort_order} onChange={val => setVariant(i, { sort_order: Number(val) })} />
            <Checkbox label="Activa" checked={v.is_active} onChange={val => setVariant(i, { is_active: val })} />
            <div className="sm:col-span-6 text-right">
              <button onClick={() => removeVariant(i)} className="text-xs px-2 py-1 rounded bg-red-600/90 hover:bg-red-500">Eliminar</button>
            </div>
          </div>
        ))}
        <button onClick={addVariant} className="text-sm px-3 py-1.5 rounded bg-white/10 hover:bg-white/15">Añadir variante</button>
      </div>

      <div className="text-right">
        <button onClick={save} disabled={saving} className="inline-flex items-center rounded bg-brand text-white px-4 py-2 hover:bg-brand/90 disabled:opacity-50">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </main>
  )
}

function Input({ label, value, onChange, placeholder }: any) {
  return (
    <label className="text-xs flex flex-col gap-1">
      <span className="text-white/80">{label}</span>
      <input className="text-sm rounded border border-white/20 bg-neutral-900 px-2 py-1" value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
function Textarea({ label, value, onChange }: any) {
  return (
    <label className="text-xs flex flex-col gap-1">
      <span className="text-white/80">{label}</span>
      <textarea className="text-sm rounded border border-white/20 bg-neutral-900 px-2 py-2" rows={4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
function Select({ label, value, onChange, options }: any) {
  return (
    <label className="text-xs flex flex-col gap-1">
      <span className="text-white/80">{label}</span>
      <select className="text-sm rounded border border-white/20 bg-neutral-900 px-2 py-1" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, label]: any) => <option key={v} value={v}>{label}</option>)}
      </select>
    </label>
  )
}
function Checkbox({ label, checked, onChange }: any) {
  return (
    <label className="text-xs flex items-center gap-2">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-white/80">{label}</span>
    </label>
  )
}

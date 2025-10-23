'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

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

  const [vs, setVs] = useState<any[]>(
    (variants && variants.length > 0)
      ? variants.map((v, idx) => ({
          id: v.id ?? null,
          name: v.name ?? (kind === 'MEMBERSHIP' ? '1 mes' : 'Acceso completo'),
          duration_days: kind === 'MEMBERSHIP' ? (v.duration_days ?? 30) : null,
          price: Number(v.price ?? 0),
          // currency siempre EUR
          currency: 'EUR',
          is_active: v.is_active ?? true,
          // sort_order lo calculamos al guardar; aquí no es editable
          sort_order: v.sort_order ?? ((idx + 1) * 10),
        }))
      : [{
          id: null,
          name: kind === 'MEMBERSHIP' ? '1 mes' : 'Acceso completo',
          duration_days: kind === 'MEMBERSHIP' ? 30 : null,
          price: 0,
          currency: 'EUR',
          is_active: true,
          sort_order: 10,
        }]
  )

  // Si cambia el kind, ajustar duration de las variantes nuevas
  useEffect(() => {
    setVs(arr => arr.map((v, idx) => ({
      ...v,
      duration_days: kind === 'MEMBERSHIP' ? (v.duration_days ?? 30) : null,
    })))
  }, [kind])

  function setVariant(i: number, patch: Partial<any>) {
    setVs(arr => arr.map((v, idx) => idx === i ? { ...v, ...patch } : v))
  }
  function addVariant() {
    setVs(arr => [
      ...arr,
      {
        id: null,
        name: 'Nueva',
        duration_days: kind === 'MEMBERSHIP' ? 30 : null,
        price: 0,
        currency: 'EUR',
        is_active: true,
        sort_order: ((arr[arr.length-1]?.sort_order || 10) + 10),
      }
    ])
  }
  function removeVariant(i: number) {
    setVs(arr => arr.filter((_, idx) => idx !== i))
  }

  async function save() {
    // Normaliza variantes: fuerza EUR y sort_order secuencial
    const normalized = vs.map((v, idx) => ({
      ...v,
      price: Number(v.price ?? 0),
      currency: 'EUR',
      sort_order: (idx + 1) * 10
    }))

    try {
      // Validación básica: al menos una variante con precio > 0
      const withPrice = normalized.filter(v => Number.isFinite(v.price))
      if (withPrice.length === 0) {
        alert('Debes añadir al menos una variante con precio válido (en EUR).')
        return
      }

      const res = await fetch('/api/admin/products/save', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: product?.id || null,
          name,
          description,
          kind,
          is_active: isActive,
          membership_plan_id: kind === 'MEMBERSHIP' ? (planId || null) : null,
          variants: normalized
        })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Error al guardar')
      router.push('/admin/products')
    } catch (e: any) {
      alert(e?.message || 'Error')
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
          <div key={i} className="grid sm:grid-cols-5 gap-2 items-end border border-white/10 p-3 rounded">
            <Input label="Nombre" value={v.name} onChange={val => setVariant(i, { name: val })} />
            <Input
              label="Días (opcional)"
              value={v.duration_days ?? ''}
              onChange={val => setVariant(i, { duration_days: val === '' ? null : Number(val) })}
            />
            <NumberInput
              label="Precio (€)"
              value={v.price}
              onChange={val => setVariant(i, { price: val })}
            />
            <Readonly label="Moneda" value="EUR" />
            <Checkbox label="Activa" checked={v.is_active} onChange={val => setVariant(i, { is_active: val })} />
            <div className="sm:col-span-5 text-right">
              <button onClick={() => removeVariant(i)} className="text-xs px-2 py-1 rounded bg-red-600/90 hover:bg-red-500">Eliminar</button>
            </div>
          </div>
        ))}
        <button onClick={addVariant} className="text-sm px-3 py-1.5 rounded bg-white/10 hover:bg-white/15">Añadir variante</button>
      </div>

      <div className="text-right">
        <button onClick={save} className="inline-flex items-center rounded bg-brand text-white px-4 py-2 hover:bg-brand/90">
          Guardar
        </button>
      </div>
    </main>
  )
}

function Input({ label, value, onChange, placeholder }: any) {
  return (
    <label className="text-xs flex flex-col gap-1">
      <span className="text-white/80">{label}</span>
      <input
        className="text-sm rounded border border-white/20 bg-neutral-900 px-2 py-1"
        value={value ?? ''} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
function NumberInput({ label, value, onChange }: any) {
  return (
    <label className="text-xs flex flex-col gap-1">
      <span className="text-white/80">{label}</span>
      <input
        type="number" step="0.01" min="0"
        className="text-sm rounded border border-white/20 bg-neutral-900 px-2 py-1"
        value={value ?? 0}
        onChange={(e) => onChange(parseFloat(e.target.value || '0'))} />
    </label>
  )
}
function Readonly({ label, value }: any) {
  return (
    <label className="text-xs flex flex-col gap-1 opacity-80">
      <span className="text-white/80">{label}</span>
      <input className="text-sm rounded border border-white/20 bg-neutral-900/60 px-2 py-1" value={value} readOnly />
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

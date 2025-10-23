'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
          currency: 'EUR',
          is_active: v.is_active ?? true,
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

  useEffect(() => {
    setVs(arr => arr.map(v => ({
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
    const normalized = vs.map((v, idx) => ({
      ...v,
      price: Number(v.price ?? 0),
      currency: 'EUR',
      sort_order: (idx + 1) * 10
    }))

    try {
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
    <main className="relative min-h-dvh overflow-hidden">
      {/* Fondo hero coherente */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/Hero/hero-mobile.webp"
          alt=""
          fill
          className="object-cover md:hidden"
          priority
        />
        <Image
          src="/Hero/hero-desktop.webp"
          alt=""
          fill
          className="hidden md:block object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/90" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10 md:py-14 space-y-6">
        {/* Header con volver */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/products"
                className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
              >
                ← Volver a productos
              </Link>
              <h1 className="text-2xl font-bold">
                {mode === 'new' ? 'Nuevo producto' : 'Editar producto'}
              </h1>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded border border-white/15 bg-white/5 text-white/70">
              {kind === 'MEMBERSHIP' ? 'Membresía' : 'Curso'}
            </span>
          </div>
          <div aria-hidden className="mt-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </section>

        {/* Datos básicos */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Nombre" value={name} onChange={setName} />
            <Select
              label="Tipo"
              value={kind}
              onChange={(v: string) => setKind(v as any)}
              options={[['COURSE','Curso'], ['MEMBERSHIP','Membresía']]}
            />
          </div>
          <Textarea label="Descripción" value={description} onChange={setDescription} />

          <div className="grid sm:grid-cols-2 gap-4">
            <Checkbox label="Activo" checked={isActive} onChange={setIsActive} />
            {kind === 'MEMBERSHIP' && (
              <Input
                label="Plan de membresía (id)"
                value={String(planId)}
                onChange={(v: string) => setPlanId(v ? Number(v) : '')}
                placeholder="ID en membership_plans (ULTIMATE)"
              />
            )}
          </div>
        </section>

        {/* Variantes */}
        <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Variantes / Duraciones</h2>
            <button
              onClick={addVariant}
              className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              + Añadir variante
            </button>
          </div>

          <div className="space-y-3">
            {vs.map((v, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                  <div className="text-sm text-white/80">Variante #{i + 1}</div>
                  <button
                    onClick={() => removeVariant(i)}
                    className="text-xs px-2 py-1 rounded bg-red-600/90 hover:bg-red-500"
                  >
                    Eliminar
                  </button>
                </div>

                <div className="grid sm:grid-cols-5 gap-3 p-3">
                  <Input label="Nombre" value={v.name} onChange={(val: string) => setVariant(i, { name: val })} />
                  <Input
                    label="Días (opcional)"
                    value={v.duration_days ?? ''}
                    onChange={(val: string) => setVariant(i, { duration_days: val === '' ? null : Number(val) })}
                  />
                  <NumberInput
                    label="Precio (€)"
                    value={v.price}
                    onChange={(val: number) => setVariant(i, { price: val })}
                  />
                  <Readonly label="Moneda" value="EUR" />
                  <Checkbox label="Activa" checked={v.is_active} onChange={(val: boolean) => setVariant(i, { is_active: val })} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Acciones */}
        <div className="flex items-center justify-end">
          <button
            onClick={save}
            className="inline-flex items-center rounded-lg bg-brand text-white px-4 py-2 hover:bg-brand/90 transition shadow-glow"
          >
            Guardar
          </button>
        </div>
      </div>
    </main>
  )
}

/* ---------- Controles estilizados ---------- */

function Input({ label, value, onChange, placeholder }: any) {
  return (
    <label className="text-xs flex flex-col gap-1">
      <span className="text-white/80">{label}</span>
      <input
        className="text-sm rounded border border-white/15 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        value={value ?? ''} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
function NumberInput({ label, value, onChange }: any) {
  return (
    <label className="text-xs flex flex-col gap-1">
      <span className="text-white/80">{label}</span>
      <input
        type="number" step="0.01" min="0"
        className="text-sm rounded border border-white/15 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        value={value ?? 0}
        onChange={(e) => onChange(parseFloat(e.target.value || '0'))}
      />
    </label>
  )
}
function Readonly({ label, value }: any) {
  return (
    <label className="text-xs flex flex-col gap-1 opacity-90">
      <span className="text-white/80">{label}</span>
      <input
        className="text-sm rounded border border-white/15 bg-neutral-900/70 px-3 py-2"
        value={value}
        readOnly
      />
    </label>
  )
}
function Textarea({ label, value, onChange }: any) {
  return (
    <label className="text-xs flex flex-col gap-1">
      <span className="text-white/80">{label}</span>
      <textarea
        className="text-sm rounded border border-white/15 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        rows={4}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
function Select({ label, value, onChange, options }: any) {
  return (
    <label className="text-xs flex flex-col gap-1">
      <span className="text-white/80">{label}</span>
      <select
        className="text-sm rounded border border-white/15 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, l]: any) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )
}
function Checkbox({ label, checked, onChange }: any) {
  return (
    <label className="text-xs flex items-center gap-2">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-white/20 bg-neutral-900"
      />
      <span className="text-white/80">{label}</span>
    </label>
  )
}

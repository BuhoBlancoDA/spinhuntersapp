// src/components/admin/CourseEditor.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Course = {
  id?: number
  code: string
  slug: string
  title: string
  description?: string | null
  is_active: boolean
  default_duration_days?: number | null
}

export default function CourseEditor({ course }: { course?: Course }) {
  const router = useRouter()
  const [form, setForm] = useState<Course>({
    id: course?.id,
    code: course?.code || '',
    slug: course?.slug || '',
    title: course?.title || '',
    description: course?.description || '',
    is_active: course?.is_active ?? true,
    default_duration_days: course?.default_duration_days ?? null
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSave() {
    setSaving(true); setError(null)
    const res = await fetch('/api/admin/courses/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...form,
        code: form.code.trim().toUpperCase(),
        slug: form.slug.trim().toLowerCase(),
        default_duration_days:
          form.default_duration_days === null ||
          form.default_duration_days === undefined ||
          (form.default_duration_days as any) === ''
            ? null
            : Number(form.default_duration_days)
      })
    })
    const j = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok || !j.ok) { setError(j?.error || 'Error al guardar'); return }
    router.push('/admin/courses'); router.refresh()
  }

  return (
    <div className="glass rounded-2xl p-6 sm:p-7 space-y-5">
      {error && <div className="text-red-300 text-sm">{error}</div>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/60">Código</label>
          <input
            className="dark-input w-full rounded-lg px-3 py-2 mt-1"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
            placeholder="PRE-FLOP-101"
          />
          <p className="text-[11px] text-white/50 mt-1">Se guarda en MAYÚSCULAS (A–Z, 0–9, guiones).</p>
        </div>

        <div>
          <label className="text-xs text-white/60">Slug</label>
          <input
            className="dark-input w-full rounded-lg px-3 py-2 mt-1"
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            placeholder="pre-flop-101"
          />
          <p className="text-[11px] text-white/50 mt-1">Usa minúsculas y guiones.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-white/60">Título</label>
          <input
            className="dark-input w-full rounded-lg px-3 py-2 mt-1"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Curso de Preflop 101"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-white/60">Descripción</label>
          <textarea
            rows={4}
            className="dark-input w-full rounded-lg px-3 py-2 mt-1"
            value={form.description || ''}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Breve descripción del curso…"
          />
        </div>

        <div>
          <label className="text-xs text-white/60">Estado</label>
          <select
            className="dark-select w-full rounded-lg px-3 py-2 mt-1"
            value={form.is_active ? '1':'0'}
            onChange={e => setForm(f => ({ ...f, is_active: e.target.value === '1' }))}
          >
            <option value="1">Activo</option>
            <option value="0">Inactivo</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-white/60">Duración por defecto (días, opcional)</label>
          <input
            type="number"
            className="dark-input w-full rounded-lg px-3 py-2 mt-1"
            value={form.default_duration_days ?? ''}
            onChange={e => {
              const v = e.target.value
              setForm(f => ({ ...f, default_duration_days: v === '' ? null : Number(v) }))
            }}
            placeholder="Ej: 90"
          />
          <p className="text-[11px] text-white/50 mt-1">
            Se asigna a nuevas inscripciones si no se especifica una duración.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <a href="/admin/courses" className="btn-ghost">Cancelar</a>
        <button onClick={onSave} disabled={saving} className="btn-brand">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

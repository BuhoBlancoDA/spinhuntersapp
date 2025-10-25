'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Course = { id:number; title:string; code:string; is_active:boolean }
type Package = {
  id?: number; code:string; slug:string; title:string;
  description?:string|null; is_active:boolean; default_duration_days?: number | null;
  course_ids: number[]
}

export default function PackageEditor({ pkg, courses }:{ pkg?:Package, courses:Course[] }) {
  const router = useRouter()
  const [form, setForm] = useState<Package>({
    id: pkg?.id, code: pkg?.code || '', slug: pkg?.slug || '',
    title: pkg?.title || '', description: pkg?.description || '',
    is_active: pkg?.is_active ?? true,
    default_duration_days: pkg?.default_duration_days ?? null,
    course_ids: pkg?.course_ids || []
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string|null>(null)

  // Filtro visual (no altera flujos)
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return courses
    return courses.filter(c =>
      c.title.toLowerCase().includes(t) ||
      c.code.toLowerCase().includes(t)
    )
  }, [q, courses])

  function toggleCourse(id:number) {
    setForm(f => f.course_ids.includes(id)
      ? { ...f, course_ids: f.course_ids.filter(x => x !== id) }
      : { ...f, course_ids: [...f.course_ids, id] })
  }

  async function onSave() {
    setSaving(true); setError(null)
    const res = await fetch('/api/admin/course-packages/save', {
      method:'POST',
      headers:{ 'content-type':'application/json' },
      body: JSON.stringify({
        ...form,
        code: form.code.trim().toUpperCase(),
        slug: form.slug.trim().toLowerCase(),
        default_duration_days:
          form.default_duration_days === null ||
          form.default_duration_days === undefined ||
          (form.default_duration_days as any)===''
            ? null
            : Number(form.default_duration_days)
      })
    })
    const j = await res.json().catch(()=>({}))
    setSaving(false)
    if (!res.ok || !j.ok) { setError(j?.error || 'Error al guardar'); return }
    router.push('/admin/course-packages'); router.refresh()
  }

  const selectedCount = form.course_ids.length

  return (
    <div className="glass rounded-2xl p-6 sm:p-7 space-y-6">
      {error && <div className="text-red-300 text-sm">{error}</div>}

      {/* Datos del paquete */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/60">Código</label>
          <input
            className="dark-input w-full rounded-lg px-3 py-2 mt-1"
            value={form.code}
            onChange={e=>setForm(f=>({...f, code:e.target.value}))}
            placeholder="BUNDLE-STARTER"
          />
          <p className="text-[11px] text-white/50 mt-1">Se guarda en MAYÚSCULAS (A–Z, 0–9, guiones).</p>
        </div>

        <div>
          <label className="text-xs text-white/60">Slug</label>
          <input
            className="dark-input w-full rounded-lg px-3 py-2 mt-1"
            value={form.slug}
            onChange={e=>setForm(f=>({...f, slug:e.target.value}))}
            placeholder="bundle-starter"
          />
          <p className="text-[11px] text-white/50 mt-1">Usa minúsculas y guiones.</p>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-white/60">Título</label>
          <input
            className="dark-input w-full rounded-lg px-3 py-2 mt-1"
            value={form.title}
            onChange={e=>setForm(f=>({...f, title:e.target.value}))}
            placeholder="Paquete Inicial"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-white/60">Descripción</label>
          <textarea
            rows={3}
            className="dark-input w-full rounded-lg px-3 py-2 mt-1"
            value={form.description||''}
            onChange={e=>setForm(f=>({...f, description:e.target.value}))}
            placeholder="Breve descripción del paquete…"
          />
        </div>

        <div>
          <label className="text-xs text-white/60">Estado</label>
          <select
            className="dark-select w-full rounded-lg px-3 py-2 mt-1"
            value={form.is_active ? '1':'0'}
            onChange={e=>setForm(f=>({...f, is_active: e.target.value==='1'}))}
          >
            <option value="1">Activo</option>
            <option value="0">Inactivo</option>
          </select>
        </div>

        <div>
          <label className="text-xs text-white/60">Duración por defecto (días)</label>
          <input
            type="number"
            className="dark-input w-full rounded-lg px-3 py-2 mt-1"
            value={form.default_duration_days ?? ''}
            onChange={e=>{
              const v = e.target.value
              setForm(f=>({...f, default_duration_days: v===''? null : Number(v)}))
            }}
            placeholder="Ej: 90"
          />
          <p className="text-[11px] text-white/50 mt-1">Si se omite, la inscripción no expira.</p>
        </div>
      </div>

      {/* Cursos incluidos */}
      <div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <label className="text-xs text-white/60">Cursos incluidos</label>
            <div className="mt-1 text-[12px] text-white/60">
              Seleccionados: <b>{selectedCount}</b> / {courses.length}
            </div>
          </div>
          <div className="w-56">
            <input
              className="dark-input w-full rounded-lg px-3 py-2"
              placeholder="Buscar curso…"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-3 grid sm:grid-cols-2 gap-2 max-h-[380px] overflow-auto dark-scroll">
          {filtered.map(c => {
            const selected = form.course_ids.includes(c.id)
            return (
              <label
                key={c.id}
                className={[
                  'flex items-center gap-2 rounded-lg px-3 py-2 border transition',
                  selected
                    ? 'border-brand bg-white/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/8'
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  className="accent-brand"
                  checked={selected}
                  onChange={()=>toggleCourse(c.id)}
                />
                <span className="text-sm">
                  {c.title} <span className="text-white/50">({c.code})</span>
                  {!c.is_active && <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded border border-white/15 bg-white/5 text-white/60">inactivo</span>}
                </span>
              </label>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-sm text-white/60 col-span-2 py-6 text-center">
              No hay resultados para “{q}”.
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-3">
        <a href="/admin/course-packages" className="btn-ghost">Cancelar</a>
        <button onClick={onSave} disabled={saving} className="btn-brand">
          {saving ? 'Guardando…':'Guardar'}
        </button>
      </div>
    </div>
  )
}

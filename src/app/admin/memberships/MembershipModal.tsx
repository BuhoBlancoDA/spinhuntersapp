'use client'
import { useEffect, useMemo, useRef, useState } from 'react'

const SOURCES = ['PAYMENT','BETKINGS','BANKING'] as const

type Plan = { id: number, code: string, name: string }
type Details = {
  id?: number
  user_id?: string
  email?: string|null
  username?: string|null
  plan_id?: number
  plan_code?: string|null
  plan_name?: string|null
  status?: 'ACTIVE'|'EXPIRED'|'CANCELLED'|'PENDING'
  start_at?: string|null
  end_at?: string|null
  source?: (typeof SOURCES)[number] | null
  ggpoker_username?: string|null
  discord_nickname?: string|null
  notes?: string|null
  eva?: boolean
}

type UserHit = {
  user_id: string
  email: string | null
  username: string | null
  discord_user?: string | null
  whatsapp?: string | null
}

/** Devuelve 'YYYY-MM-DD' para input[type=date] */
function toDateInput(dt?: string|null) {
  if (!dt) return ''
  const d = new Date(dt)
  const p = (n:number) => String(n).padStart(2,'0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`
}
/** Convierte 'YYYY-MM-DD' a ISO al INICIO del día (local tz) */
function dateStartISO(yyyyMMdd: string) {
  const [y,m,d] = yyyyMMdd.split('-').map(Number)
  const dt = new Date(y, (m-1), d, 0, 0, 0, 0)
  return dt.toISOString()
}
/** Convierte 'YYYY-MM-DD' a ISO al FIN del día (local tz) */
function dateEndISO(yyyyMMdd: string) {
  const [y,m,d] = yyyyMMdd.split('-').map(Number)
  const dt = new Date(y, (m-1), d, 23, 59, 59, 999)
  return dt.toISOString()
}

/* =======================
   DatePicker oscuro custom
   ======================= */

function formatISOToYYYYMMDD(iso?: string|null) {
  return toDateInput(iso ?? '')
}
function pad2(n:number){ return String(n).padStart(2,'0') }
function toYYYYMMDD(d: Date){
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`
}
function startOfMonth(d: Date){ return new Date(d.getFullYear(), d.getMonth(), 1) }
function addMonths(d: Date, n:number){ return new Date(d.getFullYear(), d.getMonth()+n, 1) }
function isSameDay(a:Date, b:Date){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate() }

type DarkDatePickerProps = {
  value: string // 'YYYY-MM-DD' o ''
  onChange: (yyyyMMdd: string) => void
  placeholder?: string
  required?: boolean
  endHint?: 'start' | 'end' // solo para mostrar hint de inicio/fin del día
}
function DarkDatePicker({ value, onChange, placeholder, required, endHint }: DarkDatePickerProps){
  const [open, setOpen] = useState(false)
  const [anchorMonth, setAnchorMonth] = useState(()=> {
    const base = value ? new Date(value) : new Date()
    return startOfMonth(base)
  })
  const containerRef = useRef<HTMLDivElement|null>(null)

  const today = new Date()
  const selected = value ? new Date(value) : null

  // cerrar al hacer click fuera
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // teclado: ESC cierra
  useEffect(() => {
    function onKey(e: KeyboardEvent){
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // generar cuadrícula de días
  const weeks = (() => {
    const first = startOfMonth(anchorMonth)
    const startWeekDay = (first.getDay()+6)%7 // 0=Lunes
    const gridStart = new Date(first); gridStart.setDate(first.getDate()-startWeekDay)
    const days: Date[] = []
    for (let i=0;i<42;i++){ const d=new Date(gridStart); d.setDate(gridStart.getDate()+i); days.push(d) }
    const rows: Date[][] = []
    for (let i=0;i<6;i++) rows.push(days.slice(i*7,(i+1)*7))
    return rows
  })()

  const monthLabel = anchorMonth.toLocaleString('es-ES',{ month:'long', year:'numeric' })

  function pick(d: Date){
    onChange(toYYYYMMDD(d))
    setOpen(false)
  }
  function clear(){
    onChange('')
    setOpen(false)
  }
  function setToday(){
    const t = new Date()
    onChange(toYYYYMMDD(t))
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <input
          readOnly
          required={required}
          value={value ? new Date(value).toLocaleDateString('es-ES') : ''}
          placeholder={placeholder || 'Selecciona fecha'}
          className="dark-input w-full p-3 rounded-lg cursor-pointer"
          onClick={()=>setOpen(v=>!v)}
        />
        <button
          type="button"
          className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
          onClick={()=>setOpen(v=>!v)}
          aria-label="Abrir calendario"
        >📅</button>
      </div>
      {endHint && (
        <p className="text-xs text-white/50 mt-1">
          {endHint === 'start' ? 'Se guardará al inicio del día.' : 'Se guardará al final del día.'}
        </p>
      )}
      {open && (
        <div className="datepicker-popover absolute z-20 mt-2 w-[320px] rounded-xl p-3 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <button type="button" className="nav-btn" onClick={()=>setAnchorMonth(addMonths(anchorMonth,-1))}>←</button>
            <div className="text-sm font-semibold capitalize">{monthLabel}</div>
            <button type="button" className="nav-btn" onClick={()=>setAnchorMonth(addMonths(anchorMonth,1))}>→</button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs text-white/60 mb-1">
            <div>LU</div><div>MA</div><div>MI</div><div>JU</div><div>VI</div><div>SA</div><div>DO</div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weeks.flat().map((d, idx) => {
              const inMonth = d.getMonth() === anchorMonth.getMonth()
              const isToday = isSameDay(d, today)
              const isSelected = selected ? isSameDay(d, selected) : false
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={()=>pick(d)}
                  className={[
                    'day-btn',
                    inMonth ? '' : 'out',
                    isToday ? 'today' : '',
                    isSelected ? 'selected' : ''
                  ].join(' ')}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <button type="button" className="link-btn" onClick={clear}>Borrar</button>
            <button type="button" className="link-btn" onClick={setToday}>Hoy</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* =======================
   Modal
   ======================= */

export default function MembershipModal({ membershipId, onClose }:{
  membershipId: number | 'new',
  onClose: () => void
}) {
  const isNew = membershipId === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [d, setD] = useState<Details>({})
  const [plans, setPlans] = useState<Plan[]>([])

  // búsqueda
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<UserHit[]>([])
  const [searching, setSearching] = useState(false)
  const [openList, setOpenList] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const canSubmit = useMemo(() => (
    d.plan_id && d.end_at && (d.user_id || d.email)
  ), [d.plan_id, d.end_at, d.user_id, d.email])

  // planes
  useEffect(() => {
    let abort = false
    ;(async () => {
      try {
        const res = await fetch('/api/public/membership-plans')
        const json = await res.json().catch(()=>({items:[]}))
        if (!abort) setPlans(json.items || [])
      } catch {}
    })()
    return () => { abort = true }
  }, [])

  // detalle (edición)
  useEffect(() => {
    if (isNew) return
    let abort = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/memberships/${membershipId}`, { credentials: 'include' })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'No se pudo cargar la membresía')
        if (!abort) setD(json)
      } catch(e:any) {
        if (!abort) setErr(e.message || 'Error al cargar')
      } finally {
        if (!abort) setLoading(false)
      }
    })()
    return () => { abort = true }
  }, [membershipId, isNew])

  // búsqueda de usuarios
  useEffect(() => {
    if (!isNew) return
    const q = query.trim()
    if (q.length < 2) { setHits([]); return }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q, page: '1', pageSize: '5' })
        const res = await fetch(`/api/admin/users/search?${params}`, { credentials: 'include' })
        const json = await res.json().catch(()=>({}))
        if (!res.ok) throw new Error(json?.error || 'No se pudo buscar')
        const items: UserHit[] = (json?.items || []).map((it:any) => ({
          user_id: it.user_id,
          email: it.email,
          username: it.username,
          discord_user: it.discord_user,
          whatsapp: it.whatsapp
        }))
        setHits(items)
        setOpenList(true)
      } catch {
        setHits([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query, isNew])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!listRef.current) return
      if (!listRef.current.contains(e.target as Node) && e.target !== inputRef.current) {
        setOpenList(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  function selectHit(hit: UserHit) {
    setD(prev => ({
      ...prev,
      user_id: hit.user_id,
      email: hit.email ?? prev.email ?? null,
      username: hit.username ?? prev.username ?? null,
      discord_nickname: (prev.discord_nickname && prev.discord_nickname.trim() !== '')
        ? prev.discord_nickname
        : (hit.discord_user ?? null),
    }))
    setQuery(hit.username || hit.email || '')
    setOpenList(false)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); if (saving || !canSubmit) return
    setSaving(true); setMsg(null); setErr(null)
    try {
      if (isNew) {
        const payload: any = {
          user_id: d.user_id || undefined,
          email: d.email || query || undefined,
          plan_id: d.plan_id,
          status: d.status || 'ACTIVE',
          start_at: d.start_at,  // ISO inicio del día
          end_at: d.end_at,      // ISO fin del día
          source: d.source || null,
          ggpoker_username: d.ggpoker_username || null,
          discord_nickname: d.discord_nickname || null,
          notes: d.notes || null,
          eva: !!d.eva,
        }
        const res = await fetch('/api/admin/memberships', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include'
        })
        const json = await res.json().catch(()=>({}))
        if (!res.ok) throw new Error(json?.error || 'No se pudo crear')
        setMsg('Membresía creada correctamente.')
      } else {
        const payload: any = {
          plan_id: d.plan_id,
          status: d.status,
          start_at: d.start_at,
          end_at: d.end_at,
          source: d.source,
          ggpoker_username: d.ggpoker_username,
          discord_nickname: d.discord_nickname,
          notes: d.notes,
          eva: d.eva,
        }
        const res = await fetch(`/api/admin/memberships/${d.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include'
        })
        const json = await res.json().catch(()=>({}))
        if (!res.ok) throw new Error(json?.error || 'No se pudo actualizar')
        setMsg('Membresía actualizada correctamente.')
      }
    } catch (e:any) {
      setErr(e.message || 'Operación fallida')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Fondo y blur para foco */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Contenedor modal */}
      <div className="absolute inset-x-0 top-8 mx-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-black/80 p-5 sm:p-6 backdrop-blur-md shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{isNew ? 'Nueva membresía' : 'Editar membresía'}</h2>
            {!isNew && (
              <p className="text-sm text-white/70">
                Usuario: {d.username ?? '—'} · {d.email ?? '—'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-white/90 hover:bg-white/10"
          >
            Cerrar
          </button>
        </div>
        <div aria-hidden className="mt-4 hud-divider" />

        {/* Cuerpo */}
        {loading ? (
          <p className="text-white/70 mt-4">Cargando…</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* selector/búsqueda de usuario */}
            {isNew && (
              <div className="sm:col-span-2 relative" ref={listRef}>
                <label className="block text-sm text-white/70 mb-1">Usuario o email</label>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e)=>{ setQuery(e.target.value); setD(p=>({ ...p, email: e.target.value })) }}
                  placeholder="Buscar por username o email…"
                  className="dark-input w-full p-3 rounded-lg"
                />
                {openList && (
                  <div className="dark-dropdown dark-scroll absolute z-10 mt-1 w-full rounded-xl max-h-64 overflow-auto">
                    {searching && <div className="px-3 py-2 text-sm text-white/70">Buscando…</div>}
                    {!searching && hits.length === 0 && query.trim().length >= 2 && (
                      <div className="px-3 py-2 text-sm text-white/60">Sin resultados</div>
                    )}
                    {!searching && hits.map(h => (
                      <button
                        key={h.user_id}
                        type="button"
                        onClick={() => selectHit(h)}
                        className="w-full text-left px-3 py-2 hover:bg-white/5"
                      >
                        <div className="text-sm">
                          <b>{h.username ?? '—'}</b> · {h.email ?? '—'}
                        </div>
                        {!!h.discord_user && <div className="text-xs text-white/60">Discord: {h.discord_user}</div>}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-white/50 mt-1">Puedes escribir el email directamente o seleccionar de la lista.</p>
              </div>
            )}

            {/* plan */}
            <div>
              <label className="block text-sm text-white/70 mb-1">Plan</label>
              <select
                value={d.plan_id ?? ''}
                onChange={(e)=>setD({...d, plan_id: Number(e.target.value) || undefined})}
                required
                className="dark-select w-full p-3 rounded-lg"
              >
                <option value="">Selecciona plan</option>
                {plans.map(pl => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
              </select>
            </div>

            {/* estado */}
            <div>
              <label className="block text-sm text-white/70 mb-1">Estado</label>
              <select
                value={d.status ?? 'ACTIVE'}
                onChange={(e)=>setD({...d, status: e.target.value as any})}
                className="dark-select w-full p-3 rounded-lg"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING">PENDING</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            {/* fechas → DarkDatePicker (sin cambiar flujo) */}
            <div>
              <label className="block text-sm text-white/70 mb-1">Inicio</label>
              <DarkDatePicker
                value={formatISOToYYYYMMDD(d.start_at ?? new Date().toISOString())}
                onChange={(yyyyMMdd)=>setD({...d, start_at: yyyyMMdd ? dateStartISO(yyyyMMdd) : null})}
                endHint="start"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Fin</label>
              <DarkDatePicker
                value={formatISOToYYYYMMDD(d.end_at ?? '')}
                onChange={(yyyyMMdd)=>setD({...d, end_at: yyyyMMdd ? dateEndISO(yyyyMMdd) : null})}
                required
                endHint="end"
              />
            </div>

            {/* fuente */}
            <div>
              <label className="block text-sm text-white/70 mb-1">Fuente</label>
              <select
                value={d.source ?? ''}
                onChange={(e)=>setD({...d, source: (e.target.value || null) as any})}
                className="dark-select w-full p-3 rounded-lg"
              >
                <option value="">—</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* extras */}
            <div>
              <label className="block text-sm text-white/70 mb-1">GGpoker Nick</label>
              <input
                value={d.ggpoker_username ?? ''}
                onChange={(e)=>setD({...d, ggpoker_username: e.target.value})}
                className="dark-input w-full p-3 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">Discord Nick</label>
              <input
                value={d.discord_nickname ?? ''}
                onChange={(e)=>setD({...d, discord_nickname: e.target.value})}
                className="dark-input w-full p-3 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm text-white/70 mb-1">Notas</label>
              <textarea
                value={d.notes ?? ''}
                onChange={(e)=>setD({...d, notes: e.target.value})}
                className="dark-input w-full p-3 rounded-lg min-h-[84px]"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between mt-2">
              <label htmlFor="eva" className="flex items-center gap-2 select-none">
                <input
                  id="eva"
                  type="checkbox"
                  checked={!!d.eva}
                  onChange={(e)=>setD({...d, eva: e.target.checked})}
                  className="size-4 rounded-sm border-white/30 bg-white/5 accent-brand"
                />
                <span className="text-white/80 text-sm">Eva Activa</span>
              </label>

              <div className="text-right">
                {msg && <p className="text-green-500 text-sm">{msg}</p>}
                {err && <p className="text-red-500 text-sm">{err}</p>}
              </div>
            </div>

            <div className="sm:col-span-2">
              <button
                disabled={saving || !canSubmit}
                className="px-4 py-2 rounded-lg bg-brand text-white hover:bg-brand/90 disabled:opacity-60 shadow-glow"
              >
                {saving ? 'Guardando…' : (isNew ? 'Crear membresía' : 'Guardar cambios')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

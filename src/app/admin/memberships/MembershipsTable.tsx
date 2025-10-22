'use client'

import { useEffect, useMemo, useState } from 'react'
import MembershipModal from './MembershipModal'

type Row = {
  id: number
  user_id: string
  email: string | null
  username: string | null
  plan_id: number
  plan_code: string | null
  plan_name: string | null
  status: 'ACTIVE'|'EXPIRED'|'CANCELLED'|'PENDING'
  start_at: string | null
  end_at: string | null
  source: 'PAYMENT'|'BETKINGS'|'BANKING'|null
}

export default function MembershipsTable() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [data, setData] = useState<{ items: Row[], total: number, page: number, pageSize: number }>({ items: [], total: 0, page: 1, pageSize: 20 })
  const [selected, setSelected] = useState<number | 'new' | null>(null)

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data.total || 0) / (data.pageSize || 20))), [data])
  const items = data.items || []

  useEffect(() => {
    let abort = false
    ;(async () => {
      setLoading(true); setErr(null)
      try {
        const params = new URLSearchParams({ q, status, page: String(page), pageSize: String(pageSize) })
        const res = await fetch(`/api/admin/memberships/search?${params}`, { credentials: 'include' })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error || 'No se pudo cargar la lista')
        const safe = {
          items: Array.isArray(json?.items) ? json.items : [],
          total: Number(json?.total ?? 0),
          page: Number(json?.page ?? 1),
          pageSize: Number(json?.pageSize ?? 20),
        }
        if (!abort) setData(safe)
      } catch (e:any) {
        if (!abort) { setErr(e.message || 'Error de red'); setData({ items: [], total: 0, page: 1, pageSize }) }
      } finally { if (!abort) setLoading(false) }
    })()
    return () => { abort = true }
  }, [q, status, page, pageSize])

  return (
    <section className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-4 sm:p-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
        <div className="flex gap-2 w-full">
          <input
            placeholder="Buscar por email o username…"
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value) }}
            className="w-full sm:max-w-md border border-white/10 rounded bg-white/5 text-white placeholder-white/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
          <select
            value={status}
            onChange={(e) => { setPage(1); setStatus(e.target.value) }}
            className="border border-white/10 rounded bg-white/5 text-white px-2 py-2"
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING">PENDING</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/70">Resultados: {data.total}</span>
          <select
            value={pageSize}
            onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)) }}
            className="border border-white/10 rounded bg-white/5 text-white px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <button onClick={() => setSelected('new')} className="px-3 py-1.5 rounded bg-brand text-white hover:bg-brand/90 shadow-glow">
            Nueva membresía
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-white/10 bg-black/50 overflow-hidden">
        <div className="overflow-auto max-h-[65vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-black/70 backdrop-blur-sm">
              <tr className="text-left">
                <th className="px-3 py-2 border-b border-white/10">Usuario</th>
                <th className="px-3 py-2 border-b border-white/10">Email</th>
                <th className="px-3 py-2 border-b border-white/10">Plan</th>
                <th className="px-3 py-2 border-b border-white/10">Estado</th>
                <th className="px-3 py-2 border-b border-white/10">Inicio</th>
                <th className="px-3 py-2 border-b border-white/10">Fin</th>
                <th className="px-3 py-2 border-b border-white/10">Fuente</th>
                <th className="px-3 py-2 border-b border-white/10 w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && items.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-white/60">Cargando…</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-white/60">Sin resultados</td></tr>
              )}
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-white/5">
                  <td className="px-3 py-2">{r.username ?? <span className="text-white/50">—</span>}</td>
                  <td className="px-3 py-2">{r.email ?? '—'}</td>
                  <td className="px-3 py-2">{r.plan_name ?? r.plan_code ?? r.plan_id}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{r.start_at ? new Date(r.start_at).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-2">{r.end_at ? new Date(r.end_at).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-2">{r.source ?? '—'}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => setSelected(r.id)} className="px-3 py-1.5 rounded bg-brand text-white hover:bg-brand/90">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between p-3 border-t border-white/10 text-sm">
          <span className="text-white/70">Página {data.page} de {totalPages}</span>
          <div className="flex items-center gap-2">
            <button disabled={data.page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 rounded border border-white/10 text-white/80 disabled:opacity-50">Anterior</button>
            <button disabled={data.page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1.5 rounded border border-white/10 text-white/80 disabled:opacity-50">Siguiente</button>
          </div>
        </div>
      </div>

      {selected && <MembershipModal membershipId={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import UserModal from './UserModal'

type Row = {
  user_id: string
  username: string | null
  discord_user: string | null
  whatsapp: string | null
  email: string | null
  auth_created_at?: string | null
}

type ListResp = {
  items: Row[]
  total: number
  page: number
  pageSize: number
}

export default function UsersTable() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [apiErr, setApiErr] = useState<string | null>(null)
  const [data, setData] = useState<ListResp>({ items: [], total: 0, page: 1, pageSize: 20 })
  const [selected, setSelected] = useState<string | null>(null)

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20))),
    [data]
  )

  useEffect(() => {
    let abort = false
    ;(async () => {
      setLoading(true)
      setApiErr(null)
      try {
        const params = new URLSearchParams({
          q,
          page: String(page),
          pageSize: String(pageSize),
        })
        const res = await fetch(`/api/admin/users/search?${params}`, { credentials: 'include' })
        const json = await res.json().catch(() => ({} as any))

        if (!res.ok) {
          throw new Error(json?.error || 'No se pudo obtener la lista de usuarios')
        }

        const safe: ListResp = {
          items: Array.isArray(json?.items) ? json.items : [],
          total: Number(json?.total ?? 0),
          page: Number(json?.page ?? page),
          pageSize: Number(json?.pageSize ?? pageSize),
        }

        if (!abort) setData(safe)
      } catch (e: any) {
        if (!abort) {
          setApiErr(e?.message || 'Error al cargar usuarios')
          setData({ items: [], total: 0, page, pageSize })
        }
      } finally {
        if (!abort) setLoading(false)
      }
    })()

    return () => {
      abort = true
    }
  }, [q, page, pageSize])

  const items = data?.items ?? []

  return (
    <div className="space-y-3">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <input
          placeholder="Buscar por username, Discord o WhatsApp…"
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value) }}
          className="w-full sm:max-w-md border border-white/10 rounded bg-white/5 text-white placeholder-white/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
        />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/70">Resultados: {data?.total ?? 0}</span>
          <select
            value={pageSize}
            onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)) }}
            className="border border-white/10 rounded bg-white/5 text-white px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Mensaje de error si ocurre */}
      {apiErr && (
        <div className="rounded border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-3 py-2">
          {apiErr}
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-2xl border border-white/10 bg-black/50 overflow-hidden">
        <div className="overflow-auto max-h-[65vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-black/70 backdrop-blur-sm">
              <tr className="text-left">
                <th className="px-3 py-2 border-b border-white/10">Usuario</th>
                <th className="px-3 py-2 border-b border-white/10">Discord</th>
                <th className="px-3 py-2 border-b border-white/10">Email</th>
                <th className="px-3 py-2 border-b border-white/10">WhatsApp</th>
                <th className="px-3 py-2 border-b border-white/10 w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && items.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-white/60">Cargando…</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-white/60">Sin resultados</td></tr>
              )}
              {items.map((row) => (
                <tr key={row.user_id} className="hover:bg-white/5">
                  <td className="px-3 py-2">{row.username ?? <span className="text-white/50">—</span>}</td>
                  <td className="px-3 py-2">{row.discord_user ?? <span className="text-white/50">—</span>}</td>
                  <td className="px-3 py-2">{row.email ?? <span className="text-white/50">—</span>}</td>
                  <td className="px-3 py-2">{row.whatsapp ?? <span className="text-white/50">—</span>}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setSelected(row.user_id)}
                      className="px-3 py-1.5 rounded bg-brand text-white hover:bg-brand/90"
                    >
                      Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between p-3 border-t border-white/10 text-sm">
          <span className="text-white/70">Página {data?.page ?? 1} de {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={(data?.page ?? 1) <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded border border-white/10 text-white/80 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              disabled={(data?.page ?? 1) >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded border border-white/10 text-white/80 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalles */}
      {selected && <UserModal userId={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

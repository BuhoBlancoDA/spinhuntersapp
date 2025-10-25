'use client'

import { useEffect, useRef, useState } from 'react'

export type FoundUser = {
  user_id: string
  email?: string | null
  username?: string | null
  whatsapp?: string | null
  discord_user?: string | null
}

export default function UserPicker({
  onChange,
  placeholder = 'Buscar por email o @usuario…',
}: {
  onChange: (u: FoundUser | null) => void
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoundUser[]>([])
  const [selected, setSelected] = useState<FoundUser | null>(null)
  const [page] = useState(1)
  const [pageSize] = useState(10)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Buscar (debounce)
  useEffect(() => {
    if (!query || selected) { setResults([]); return }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const url = `/api/admin/users/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`
      const r = await fetch(url, { cache: 'no-store' })
      const j = await r.json().catch(() => ({}))
      setResults(j?.items || [])
    }, 300)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [query, selected, page, pageSize])

  function choose(u: FoundUser) {
    setSelected(u); setResults([]); setQuery(''); onChange(u)
  }

  function clearSel() {
    setSelected(null); onChange(null)
  }

  return (
    <div>
      <label className="text-xs text-white/60 mb-1 block">Usuario</label>
      <input
        className="dark-input w-full"
        disabled={!!selected}
        value={selected ? (selected.email || selected.username || selected.user_id) : query}
        onChange={(e) => { setQuery(e.target.value); setSelected(null); onChange(null) }}
        placeholder={placeholder}
      />
      {(!selected && results.length > 0) && (
        <div className="mt-2 rounded-lg border border-white/10 bg-white/5 divide-y divide-white/10 max-h-64 overflow-auto">
          {results.map(u => (
            <button
              type="button"
              key={u.user_id}
              className="w-full text-left px-3 py-2 hover:bg-white/10"
              onClick={() => choose(u)}
            >
              <div className="text-sm">
                <b>{u.username ? `@${u.username}` : (u.email || u.user_id)}</b>
              </div>
              <div className="text-xs text-white/60">{u.email || 'sin email'}{u.whatsapp ? ` · wa:${u.whatsapp}` : ''}</div>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div className="text-xs text-emerald-300 mt-1">
          Seleccionado: {selected.username ? `@${selected.username}` : (selected.email || selected.user_id)}
          {' '}- {selected.user_id}{' '}
          <button type="button" className="underline text-white/80" onClick={clearSel}>cambiar</button>
        </div>
      )}
      <p className="text-[11px] text-white/50 mt-1">Debes seleccionar un usuario de la lista.</p>
    </div>
  )
}

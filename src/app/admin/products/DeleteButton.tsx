// src/app/admin/products/DeleteButton.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteButton({ id, name }: { id: string; name?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onDelete = async () => {
    if (!confirm(`¿Eliminar el producto "${name || id}"? Esta acción no se puede deshacer.`)) return
    setLoading(true)
    try {
      // Ruta de DELETE dedicada (ver sección 2)
      const res = await fetch(`/api/admin/products/delete?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      const j = await res.json().catch(() => null)
      if (!res.ok) throw new Error(j?.error || 'No se pudo eliminar.')
      router.refresh()
    } catch (e: any) {
      alert(e?.message || 'Error al eliminar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={loading}
      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
      title="Eliminar producto"
    >
      {loading ? 'Eliminando…' : 'Eliminar'}
    </button>
  )
}

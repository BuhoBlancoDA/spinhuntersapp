'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function SupportWidget() {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  const resetForm = () => { setSubject(''); setMessage('') }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setOk('')
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'SUPPORT', subject, message }),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok) throw new Error(j?.error || 'No se pudo crear el ticket.')
      setOk(`Ticket creado (#${j.id}). Te contactaremos por correo.`)
      setTimeout(() => { setOpen(false); setOk(''); resetForm() }, 1200)
    } catch (err: any) {
      alert(err?.message || 'Error al enviar ticket.')
    } finally {
      setLoading(false)
    }
  }

  // Bloquear scroll de fondo + cerrar con ESC + focus inicial
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
      clearTimeout(t)
    }
  }, [open])

  return (
    <>
      {/* Bubble “¿Necesitas ayuda?” */}
      <div className="fixed z-50 bottom-24 right-6 pointer-events-none select-none">
        <div className="inline-block rounded-2xl bg-brand text-white px-3 py-1 text-xs shadow-lg/50">
          ¿Necesitas ayuda?
        </div>
      </div>

      {/* Botón flotante */}
      <button
        onClick={() => setOpen(true)}
        className="fixed z-50 bottom-6 right-6 rounded-full p-0 shadow-2xl"
        title="Abrir soporte"
        aria-label="Abrir soporte"
      >
        <span className="grid place-items-center h-14 w-14 rounded-full bg-brand hover:bg-brand/90 text-white text-lg shadow-glow">
          💬
        </span>
      </button>

      {/* Modal en portal (evita recortes por contenedores con overflow) */}
      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setOpen(false); resetForm() }} />

          {/* Panel */}
          <div className="relative w-[min(92vw,720px)] rounded-2xl border border-white/10 bg-black/80 p-5 sm:p-6 backdrop-blur-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">Abrir ticket de soporte</h3>
              <button
                onClick={() => { setOpen(false); resetForm() }}
                className="text-xs px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand/90 transition"
                aria-label="Cerrar"
              >
                Cerrar
              </button>
            </div>
            <div aria-hidden className="mt-4 hud-divider" />

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-sm block mb-1">Asunto</label>
                <input
                  ref={inputRef}
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                  className="dark-input w-full text-sm rounded-lg p-3"
                  placeholder="Describe brevemente el tema"
                />
              </div>

              <div>
                <label className="text-sm block mb-1">Mensaje</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={6}
                  className="dark-input w-full text-sm rounded-lg p-3"
                  placeholder="Cuéntanos qué ocurre…"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70">{ok}</span>
                <button
                  disabled={loading}
                  className="inline-flex items-center rounded-lg bg-brand text-white px-4 py-2 hover:bg-brand/90 transition disabled:opacity-50 shadow-glow"
                >
                  {loading ? 'Enviando…' : 'Crear ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

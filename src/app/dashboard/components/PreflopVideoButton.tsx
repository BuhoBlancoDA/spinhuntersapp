'use client'

import { useState } from 'react'

type Props = {
  title?: string
  iframeSrc: string
  buttonLabel?: string
}

export default function PreflopVideoButton({
  title = 'Video explicativo — Tablas Preflop',
  iframeSrc,
  buttonLabel = 'Video explicativo',
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Botón que abre el modal */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded bg-neutral-800 text-white px-4 py-2 border border-white/15 hover:bg-neutral-700 transition text-sm"
        title={buttonLabel}
      >
        {buttonLabel}
      </button>

      {/* Modal centrado (solo se renderiza cuando open=true) */}
      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-[min(92vw,1000px)] rounded-lg border border-white/12 bg-neutral-950 shadow-2xl">
            {/* Header modal */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <p className="text-sm font-medium text-white/90">{title}</p>
              <button
                onClick={() => setOpen(false)}
                className="text-xs px-3 py-1.5 rounded bg-red-600/90 hover:bg-red-500 text-white transition"
                aria-label="Cerrar"
              >
                Cerrar
              </button>
            </div>

            {/* Contenido (video 16:9) */}
            <div className="p-3">
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                {/* El iframe solo existe cuando el modal está abierto → al cerrar se desmonta y se detiene el video */}
                <iframe
                  src={iframeSrc}
                  loading="lazy"
                  style={{
                    border: 0,
                    position: 'absolute',
                    top: 0,
                    height: '100%',
                    width: '100%',
                  }}
                  allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

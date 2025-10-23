'use client'

import { useEffect, useState, useRef } from 'react'

export default function SalasAfiliadasButton() {
  const [open, setOpen] = useState(false)
  const [anim, setAnim] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // Cerrar con ESC
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Evitar scroll de fondo cuando está abierto
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Animación de montaje + foco inicial
  useEffect(() => {
    if (!open) return
    const t = requestAnimationFrame(() => setAnim(true))
    const f = setTimeout(() => closeBtnRef.current?.focus(), 80)
    return () => { cancelAnimationFrame(t); clearTimeout(f); setAnim(false) }
  }, [open])

  return (
    <>
      <button
        type="button"
        className="btn-ghost"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Salas Afiliadas
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="affiliates-title"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          {/* Capa oscura + spotlight para destacar el popup */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08),transparent_55%)]"
          />

          {/* Contenedor del diálogo */}
          <div
            ref={dialogRef}
            className={[
              'relative w-[min(92vw,820px)] rounded-2xl',
              'border border-white/12 bg-neutral-950/95 shadow-2xl ring-1 ring-white/10',
              'p-0 text-sm text-white/90',
              'transition-all duration-200',
              anim ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-1'
            ].join(' ')}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-white/[0.04] rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/15 bg-white/10">🏷️</span>
                <h2 id="affiliates-title" className="text-lg sm:text-xl font-semibold">
                  Salas Afiliadas
                </h2>
              </div>
              <button
                ref={closeBtnRef}
                onClick={() => setOpen(false)}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Cerrar"
                title="Cerrar"
              >
                ✕ <span className="hidden sm:inline text-xs">Cerrar</span>
              </button>
            </div>

            {/* Contenido */}
            <div className="p-5 sm:p-7 space-y-6">
              {/* Bloque destacado */}
              <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-4">
                <p className="leading-relaxed">
                  Si cumples con nuestros requisitos podrás aprender gratis con nosotros y participar
                  en nuestros eventos como{' '}
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-xs">leaderboards</span>{' '}
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-xs">sorteos</span>{' '}
                  y más.
                </p>
              </div>

              {/* Salas */}
              <section>
                <h3 className="font-semibold mb-2">Salas afiliadas actualmente</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><b>GGPoker</b> <span className="text-white/70">(skin de BetKings)</span></li>
                  <li><b>Champions</b> <span className="text-white/70">(skin de iPoker)</span></li>
                </ul>
                <p className="mt-3 text-white/80">También puedes preguntar por otras salas disponibles.</p>
                <p className="mt-2 text-xs text-white/60">
                  <b>Disclaimer:</b> Los beneficios solo están disponibles para <b>BetKings</b> y <b>Champions</b> en <b>cuentas nuevas</b>.
                </p>
              </section>

              {/* Instrucciones */}
              <section>
                <h3 className="font-semibold mb-2">Instrucciones</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Accede a nuestro grupo de Telegram:&nbsp;
                    <a
                      href="https://t.me/+vn6fequ86rthOTkx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 decoration-white/40 hover:decoration-white"
                    >
                      https://t.me/+vn6fequ86rthOTkx
                    </a>
                  </li>
                  <li>
                    Envíanos tu usuario de Telegram (ej:&nbsp;
                    <code className="rounded bg-white/10 px-1">@jugador123</code>).
                    Lo encontrarás —o podrás crearlo— en la configuración de tu perfil.
                  </li>
                  <li>
                    Te agregaremos a un grupo de soporte privado para ayudarte a crear tu cuenta.
                    Recuerda seguir todos los pasos correctamente.
                  </li>
                  <li>
                    Una vez afiliado y confirmado podrás empezar a jugar.
                  </li>
                </ol>
              </section>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-2">
                <a
                  href="https://t.me/+vn6fequ86rthOTkx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-brand justify-center"
                >
                  Abrir Telegram
                </a>
                <button className="btn-ghost" onClick={() => setOpen(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

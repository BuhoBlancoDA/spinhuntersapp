// src/components/GoogleButton.tsx
// Server Component (no hooks). Mantiene navegación dura a /api/auth/oauth.

type GoogleButtonProps = {
  href: string
  label?: string
  className?: string
}

export default function GoogleButton({
  href,
  label = 'Continuar con Google',
  className = '',
}: GoogleButtonProps) {
  return (
    <a
      href={href}
      role="button"
      rel="noopener noreferrer"
      className={[
        // base
        'w-full inline-flex items-center justify-center gap-3 rounded-md px-5 py-3 transition',
        // estilo visual (dark theme + guía de marca: fondo blanco, texto negro)
        'bg-white text-black border border-white/15 hover:bg-white/90',
        // foco accesible
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500',
        className,
      ].join(' ')}
    >
      {/* Google "G" oficial en SVG (sin dependencias) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        className="h-5 w-5"
        aria-hidden="true"
        focusable="false"
      >
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.21 3.6l6.15-6.15C35.9 3.09 30.47 1 24 1 14.62 1 6.51 6.16 2.74 13.64l7.72 5.99C12.25 14.21 17.64 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.5 24c0-1.64-.15-3.21-.43-4.71H24v9.12h12.7c-.55 2.97-2.2 5.49-4.69 7.18l7.16 5.56C43.9 37.68 46.5 31.31 46.5 24z"/>
        <path fill="#FBBC04" d="M10.46 27.23A14.47 14.47 0 0 1 9.54 24c0-1.12.19-2.2.52-3.23l-7.72-5.99A23.94 23.94 0 0 0 0 24c0 3.84.9 7.47 2.49 10.68l7.97-6.12z"/>
        <path fill="#34A853" d="M24 47c6.48 0 11.92-2.14 15.9-5.85l-7.16-5.56c-2 1.35-4.56 2.16-8.74 2.16-6.36 0-11.75-4.71-13.54-11.13l-7.97 6.12C6.51 41.84 14.62 47 24 47z"/>
      </svg>

      <span className="font-medium">{label}</span>
    </a>
  )
}

// src/components/SignOutButton.tsx
'use client'

export default function SignOutButton() {
  const onClick = async () => {
    try {
      await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' })
    } finally {
      // Navegación dura para evitar estados prefetcheados
      window.location.assign('/')
    }
  }

  return (
    <button
      onClick={onClick}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-5 py-3 hover:border-white/25"
    >
      Cerrar sesión
    </button>
  )
}



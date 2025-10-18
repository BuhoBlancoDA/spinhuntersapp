"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignOut = async () => {
    if (loading) return
    setLoading(true)
    try {
      await supabase.auth.signOut()                 // cliente
      await fetch('/api/auth/sign-out', { method: 'POST' }) // servidor (cookies)
      router.replace('/')                           // navegación
      router.refresh()                              // fuerza SSR (header)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-5 py-3 hover:border-white/25"
    >
      {loading ? 'Saliendo…' : 'Cerrar sesión'}
    </button>
  )
}


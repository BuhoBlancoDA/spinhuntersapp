// src/components/SignOutButton.tsx
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Cliente de supabase en el navegador para disparar onAuthStateChange en tabs cliente
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignOut = async () => {
    if (loading) return
    setLoading(true)
    try {
      // 1) cerrar sesión en cliente (actualiza listeners cliente)
      await supabase.auth.signOut()
      // 2) cerrar sesión en servidor (limpia cookies httpOnly)
      await fetch('/api/auth/sign-out', { method: 'POST' })
      // 3) navegar + refrescar para que el Header SSR se re-renderice
      router.replace('/')
      router.refresh()
    } catch (e) {
      console.error('Error signing out:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="px-3 py-2 text-sm rounded border border-white/10 hover:border-white/20"
    >
      {loading ? 'Saliendo…' : 'Cerrar sesión'}
    </button>
  )
}

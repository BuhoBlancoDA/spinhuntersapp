'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const handleSignOut = async () => {
    if (loading) return
    setLoading(true)
    try {
      // Call the API route to sign out on the server
      await fetch('/api/auth/sign-out', { method: 'POST' })
      // Redirect to home page
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleSignOut}
      className="px-3 py-2 text-sm rounded border border-white/10 hover:border-white/20"
      disabled={loading}
    >
      {loading ? 'Saliendo...' : 'Cerrar sesión'}
    </button>
  )
}
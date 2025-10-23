// src/app/dashboard/components/PurchaseButton.tsx
'use client'

import { useState } from 'react'
import PurchaseModal from './PurchaseModal'

export default function PurchaseButton({ products }: { products: any[] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg bg-brand text-white px-4 py-2 hover:bg-brand/90 transition shadow-glow"
      >
        Adquirir
      </button>
      {open && (
        <PurchaseModal products={products} onClose={() => setOpen(false)} />
      )}
    </>
  )
}

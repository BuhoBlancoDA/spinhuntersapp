// src/app/api/rates/convert/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const base = (searchParams.get('base') || 'USD').toUpperCase()
  const to = (searchParams.get('to') || 'USD').toUpperCase()
  const amountRaw = searchParams.get('amount')
  const amount = amountRaw ? Number(amountRaw) : null

  const providers: Array<() => Promise<number | null>> = [
    async () => {
      const r = await fetch(`https://api.exchangerate.host/latest?base=${base}&symbols=${to}`, { cache: 'no-store' })
      if (!r.ok) return null
      const j = await r.json()
      return j?.rates?.[to] ?? null
    },
    async () => {
      const r = await fetch(`https://open.er-api.com/v6/latest/${base}`, { cache: 'no-store' })
      if (!r.ok) return null
      const j = await r.json()
      return j?.rates?.[to] ?? null
    },
    async () => {
      const r = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${to}`, { cache: 'no-store' })
      if (!r.ok) return null
      const j = await r.json()
      return j?.rates?.[to] ?? null
    },
    async () => {
      const r = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${base.toLowerCase()}/${to.toLowerCase()}.json`, { cache: 'no-store' })
      if (!r.ok) return null
      const j = await r.json()
      return j?.[to.toLowerCase()] ?? null
    },
  ]

  let rate: number | null = null
  for (const p of providers) {
    try { rate = await p(); if (rate) break } catch {}
  }

  if (!rate) {
    return NextResponse.json({ error: 'rate_unavailable', base, to }, { status: 502 })
  }

  const converted = (amount != null && Number.isFinite(amount)) ? amount * rate : null

  return new NextResponse(JSON.stringify({ ok: true, base, to, rate, converted }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=300, s-maxage=300' },
  })
}

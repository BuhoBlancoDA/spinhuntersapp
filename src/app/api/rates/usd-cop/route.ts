// src/app/api/rates/to-cop/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const base = (searchParams.get('base') || 'USD').toUpperCase()

  // Intentamos varios proveedores, param base->COP
  const tryProviders = async (): Promise<number | null> => {
    // 1) exchangerate.host
    try {
      const r = await fetch(`https://api.exchangerate.host/latest?base=${base}&symbols=COP`, { cache: 'no-store' })
      if (r.ok) {
        const j = await r.json()
        const rate = j?.rates?.COP
        if (rate) return rate
      }
    } catch {}
    // 2) open.er-api.com
    try {
      const r = await fetch(`https://open.er-api.com/v6/latest/${base}`, { cache: 'no-store' })
      if (r.ok) {
        const j = await r.json()
        const rate = j?.rates?.COP
        if (rate) return rate
      }
    } catch {}
    // 3) CDN currency-api (fawazahmed0)
    try {
      const r = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/${base.toLowerCase()}/cop.json`, { cache: 'no-store' })
      if (r.ok) {
        const j = await r.json()
        const rate = j?.cop
        if (rate) return rate
      }
    } catch {}
    return null
  }

  const rate = await tryProviders()
  if (!rate) return NextResponse.json({ error: 'rate_unavailable' }, { status: 502 })

  // cache suave de 5 min en el edge/browser
  return new NextResponse(JSON.stringify({ ok: true, base, symbol: 'COP', rate }), {
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=300, s-maxage=300',
    },
  })
}

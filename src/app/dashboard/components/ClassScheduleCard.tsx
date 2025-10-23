'use client'

import { useEffect, useMemo, useState } from 'react'
import { tzFromCountryCode, COUNTRY_TZ } from '../country-tz'

type Props = {
  initialCountryCode: string // p.ej. "CO"
  classDaysLabel?: string    // Texto de días
  baseTZ?: string            // Zona base (Bogotá)
  startH?: number            // 9 (9:00 am)
  startM?: number            // 0
  endH?: number              // 10 (10:00 am)
  endM?: number              // 0
}

const DEFAULT_DAYS = 'Lunes, Miércoles, Viernes y Sábados'
const BASE_TZ_DEFAULT = 'America/Bogota'

function safeCountryName(code?: string) {
  try {
    const dn = new Intl.DisplayNames(['es'], { type: 'region' })
    return dn.of((code || 'CO').toUpperCase()) ?? (code || 'CO')
  } catch {
    return code || 'CO'
  }
}

function ymdInTZ(tz: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const n = (t: string) => Number(parts.find(p => p.type === t)?.value)
  return { y: n('year'), m: n('month'), d: n('day') }
}

function tzOffsetMinutes(date: Date, timeZone: string) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const parts = f.formatToParts(date)
  const n = (t: string) => Number(parts.find(p => p.type === t)?.value)
  const asUTC = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'))
  return (asUTC - date.getTime()) / 60000
}

function zonedTimeToUTC(y: number, m: number, d: number, hh: number, mm: number, tzOrigen: string) {
  const guessUTC = new Date(Date.UTC(y, m - 1, d, hh, mm, 0))
  const offset = tzOffsetMinutes(guessUTC, tzOrigen)
  return new Date(guessUTC.getTime() - offset * 60000)
}

function formatRangeInTZ(targetTZ: string, startUTC: Date, endUTC: Date) {
  const dateFmt = new Intl.DateTimeFormat('es-ES', {
    timeZone: targetTZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const ymdFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: targetTZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const hmsFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: targetTZ,
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })

  const startStr = dateFmt.format(startUTC)
  const endStr = dateFmt.format(endUTC)

  const partsYMD = (d: Date) => {
    const ps = ymdFmt.formatToParts(d)
    const n = (t: string) => Number(ps.find(p => p.type === t)?.value)
    return { y: n('year'), m: n('month'), d: n('day') }
  }
  const partsHMS = (d: Date) => {
    const ps = hmsFmt.formatToParts(d)
    const n = (t: string) => Number(ps.find(p => p.type === t)?.value)
    return { hh: n('hour'), mm: n('minute'), ss: n('second') }
  }

  const s = partsYMD(startUTC), e = partsYMD(endUTC)
  const endTime = partsHMS(endUTC)

  const dateChanged = s.y !== e.y || s.m !== e.m || s.d !== e.d
  const endsExactlyMidnight = endTime.hh === 0 && endTime.mm === 0
  const crossesDay = dateChanged && !endsExactlyMidnight

  return { startStr, endStr, crossesDay }
}

export default function ClassScheduleCard({
  initialCountryCode,
  classDaysLabel = DEFAULT_DAYS,
  baseTZ = BASE_TZ_DEFAULT,
  startH = 9,
  startM = 0,
  endH = 10,   // 10:00 am
  endM = 0,
}: Props) {
  const [countryCode, setCountryCode] = useState<string>(initialCountryCode || 'CO')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Lista de códigos estable y ordenada
  const allCountryCodes = useMemo(() => Object.keys(COUNTRY_TZ).sort(), [])

  const { countryName, horarioLinea } = useMemo(() => {
    // Evitamos usar Intl en SSR/primer render: así no hay diferencias de texto
    if (!mounted) {
      return {
        countryName: countryCode, // muestra código mientras hidrata
        horarioLinea: '—',        // placeholder inicial (coincide SSR/cliente primera pasada)
      }
    }

    const tz = tzFromCountryCode(countryCode)
    const { y, m, d } = ymdInTZ(baseTZ)
    const startUTC = zonedTimeToUTC(y, m, d, startH, startM, baseTZ)
    const endUTC = zonedTimeToUTC(y, m, d, endH, endM, baseTZ)
    const { startStr, endStr, crossesDay } = formatRangeInTZ(tz, startUTC, endUTC)
    const suffix = crossesDay ? ' (+1 día)' : ''
    return {
      countryName: safeCountryName(countryCode),
      horarioLinea: `${startStr} – ${endStr}${suffix}`,
    }
  }, [mounted, countryCode, baseTZ, startH, startM, endH, endM])

  return (
    <div className="rounded-lg border border-white/10 p-3 bg-black/10">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">HORARIO DE CLASES</h3>
        <div className="flex items-center gap-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="text-sm rounded border border-white/20 bg-neutral-900 px-2 py-1 outline-none hover:bg-neutral-800"
            aria-label="Seleccionar país"
            title="Seleccionar país"
          >
            {allCountryCodes.map(code => (
              <option key={code} value={code} /* evita mismatch al hidratar */ suppressHydrationWarning>
                {mounted ? safeCountryName(code) : code} ({code})
              </option>
            ))}
          </select>
          <button
            onClick={() => setCountryCode(initialCountryCode || 'CO')}
            className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/15"
            title="Usar mi país del perfil"
          >
            Usar mi país del perfil
          </button>
        </div>
      </div>

      <p className="text-sm text-white/85 mt-2">
        {classDaysLabel}:{' '}
        {/* Nombre país también puede diferir: lo protegemos */}
        <b suppressHydrationWarning>{horarioLinea}</b>{' '}
        <span className="text-white/70" suppressHydrationWarning>
          ({countryName})
        </span>
      </p>
      <p className="text-xs text-white/60 mt-1">
        * Horario base: Colombia (Bogotá). Convertido a tu país seleccionado.
      </p>
    </div>
  )
}

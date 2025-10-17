import fs from 'node:fs/promises'
import countries from 'i18n-iso-countries'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const es = require('i18n-iso-countries/langs/es.json')

countries.registerLocale(es)
const names = countries.getNames('es', { select: 'official' })

const entries = Object.entries(names)
  .filter(([code]) => /^[A-Z]{2}$/.test(code)) // solo códigos ISO-2
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name, 'es'))

const file = `// Archivo generado. No editar a mano.
export const COUNTRIES = ${JSON.stringify(entries, null, 2)} as const;
export type CountryCode = (typeof COUNTRIES)[number]['code'];
`
await fs.mkdir('src/lib', { recursive: true })
await fs.writeFile('src/lib/countries.ts', file, 'utf8')
console.log('✅ countries.ts generado con', entries.length, 'países')

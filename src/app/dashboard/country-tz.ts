// src/app/dashboard/country-tz.ts
// Mapa representativo ISO 3166-1 alpha-2 -> IANA timezone (capital o principal)
// Si un país tiene múltiples zonas, se elige la de la capital o la más usada.
export const COUNTRY_TZ: Record<string, string> = {
  // África
  DZ: 'Africa/Algiers', AO: 'Africa/Luanda', BJ: 'Africa/Porto-Novo', BW: 'Africa/Gaborone',
  BF: 'Africa/Ouagadougou', BI: 'Africa/Bujumbura', CV: 'Atlantic/Cape_Verde', CM: 'Africa/Douala',
  CF: 'Africa/Bangui', TD: 'Africa/Ndjamena', KM: 'Indian/Comoro', CG: 'Africa/Brazzaville',
  CD: 'Africa/Kinshasa', CI: 'Africa/Abidjan', DJ: 'Africa/Djibouti', EG: 'Africa/Cairo',
  GQ: 'Africa/Malabo', ER: 'Africa/Asmara', SZ: 'Africa/Mbabane', ET: 'Africa/Addis_Ababa',
  GA: 'Africa/Libreville', GM: 'Africa/Banjul', GH: 'Africa/Accra', GN: 'Africa/Conakry',
  GW: 'Africa/Bissau', KE: 'Africa/Nairobi', LS: 'Africa/Maseru', LR: 'Africa/Monrovia',
  LY: 'Africa/Tripoli', MG: 'Indian/Antananarivo', MW: 'Africa/Blantyre', ML: 'Africa/Bamako',
  MR: 'Africa/Nouakchott', MU: 'Indian/Mauritius', MA: 'Africa/Casablanca', MZ: 'Africa/Maputo',
  NA: 'Africa/Windhoek', NE: 'Africa/Niamey', NG: 'Africa/Lagos', RW: 'Africa/Kigali',
  ST: 'Africa/Sao_Tome', SN: 'Africa/Dakar', SC: 'Indian/Mahe', SL: 'Africa/Freetown',
  SO: 'Africa/Mogadishu', ZA: 'Africa/Johannesburg', SS: 'Africa/Juba', SD: 'Africa/Khartoum',
  TZ: 'Africa/Dar_es_Salaam', TG: 'Africa/Lome', TN: 'Africa/Tunis', UG: 'Africa/Kampala',
  ZM: 'Africa/Lusaka', ZW: 'Africa/Harare',

  // Américas
  AR: 'America/Argentina/Buenos_Aires', BO: 'America/La_Paz', BR: 'America/Sao_Paulo',
  CA: 'America/Toronto', CL: 'America/Santiago', CO: 'America/Bogota', CR: 'America/Costa_Rica',
  CU: 'America/Havana', DO: 'America/Santo_Domingo', EC: 'America/Guayaquil',
  SV: 'America/El_Salvador', GT: 'America/Guatemala', GY: 'America/Guyana', HT: 'America/Port-au-Prince',
  HN: 'America/Tegucigalpa', JM: 'America/Jamaica', MX: 'America/Mexico_City',
  NI: 'America/Managua', PA: 'America/Panama', PY: 'America/Asuncion', PE: 'America/Lima',
  PR: 'America/Puerto_Rico', SR: 'America/Paramaribo', TT: 'America/Port_of_Spain',
  US: 'America/New_York', UY: 'America/Montevideo', VE: 'America/Caracas', BZ: 'America/Belize',
  BB: 'America/Barbados', BS: 'America/Nassau', AG: 'America/Antigua', AI: 'America/Anguilla',
  DM: 'America/Dominica', GD: 'America/Grenada', KN: 'America/St_Kitts', LC: 'America/St_Lucia',
  VC: 'America/St_Vincent', AW: 'America/Aruba', CW: 'America/Curacao', SX: 'America/Lower_Princes',
  BM: 'Atlantic/Bermuda', GL: 'America/Nuuk', MQ: 'America/Martinique', GF: 'America/Cayenne',
  GP: 'America/Guadeloupe', MF: 'America/Marigot', BL: 'America/St_Barthelemy',
  VI: 'America/St_Thomas', VG: 'America/Tortola', KY: 'America/Cayman', TC: 'America/Grand_Turk',

  // Asia
  AF: 'Asia/Kabul', AM: 'Asia/Yerevan', AZ: 'Asia/Baku', BH: 'Asia/Bahrain',
  BD: 'Asia/Dhaka', BT: 'Asia/Thimphu', BN: 'Asia/Brunei', KH: 'Asia/Phnom_Penh',
  CN: 'Asia/Shanghai', GE: 'Asia/Tbilisi', HK: 'Asia/Hong_Kong', IN: 'Asia/Kolkata',
  ID: 'Asia/Jakarta', IR: 'Asia/Tehran', IQ: 'Asia/Baghdad', IL: 'Asia/Jerusalem',
  JP: 'Asia/Tokyo', JO: 'Asia/Amman', KZ: 'Asia/Almaty', KW: 'Asia/Kuwait',
  KG: 'Asia/Bishkek', LA: 'Asia/Vientiane', LB: 'Asia/Beirut', MO: 'Asia/Macau',
  MY: 'Asia/Kuala_Lumpur', MV: 'Indian/Maldives', MN: 'Asia/Ulaanbaatar', MM: 'Asia/Yangon',
  NP: 'Asia/Kathmandu', KP: 'Asia/Pyongyang', KR: 'Asia/Seoul', OM: 'Asia/Muscat',
  PK: 'Asia/Karachi', PS: 'Asia/Hebron', PH: 'Asia/Manila', QA: 'Asia/Qatar',
  SA: 'Asia/Riyadh', SG: 'Asia/Singapore', LK: 'Asia/Colombo', SY: 'Asia/Damascus',
  TW: 'Asia/Taipei', TH: 'Asia/Bangkok', TR: 'Europe/Istanbul', AE: 'Asia/Dubai',
  UZ: 'Asia/Tashkent', VN: 'Asia/Ho_Chi_Minh', YE: 'Asia/Aden', TJ: 'Asia/Dushanbe',
  TM: 'Asia/Ashgabat',

  // Europa
  AL: 'Europe/Tirane', AD: 'Europe/Andorra', AT: 'Europe/Vienna', BY: 'Europe/Minsk',
  BE: 'Europe/Brussels', BA: 'Europe/Sarajevo', BG: 'Europe/Sofia', HR: 'Europe/Zagreb',
  CY: 'Asia/Nicosia', CZ: 'Europe/Prague', DK: 'Europe/Copenhagen', EE: 'Europe/Tallinn',
  FI: 'Europe/Helsinki', FR: 'Europe/Paris', DE: 'Europe/Berlin', GR: 'Europe/Athens',
  HU: 'Europe/Budapest', IS: 'Atlantic/Reykjavik', IE: 'Europe/Dublin', IT: 'Europe/Rome',
  LV: 'Europe/Riga', LI: 'Europe/Vaduz', LT: 'Europe/Vilnius', LU: 'Europe/Luxembourg',
  MT: 'Europe/Malta', MD: 'Europe/Chisinau', MC: 'Europe/Monaco', ME: 'Europe/Podgorica',
  NL: 'Europe/Amsterdam', MK: 'Europe/Skopje', NO: 'Europe/Oslo', PL: 'Europe/Warsaw',
  PT: 'Europe/Lisbon', RO: 'Europe/Bucharest', RU: 'Europe/Moscow', SM: 'Europe/San_Marino',
  RS: 'Europe/Belgrade', SK: 'Europe/Bratislava', SI: 'Europe/Ljubljana', ES: 'Europe/Madrid',
  SE: 'Europe/Stockholm', CH: 'Europe/Zurich', UA: 'Europe/Kyiv', GB: 'Europe/London',
  VA: 'Europe/Vatican', GI: 'Europe/Gibraltar', FO: 'Atlantic/Faroe', MTQ: 'America/Martinique', // (alias ISO3 opcional)

  // Oceanía
  AU: 'Australia/Sydney', NZ: 'Pacific/Auckland', FJ: 'Pacific/Fiji', PG: 'Pacific/Port_Moresby',
  SB: 'Pacific/Guadalcanal', VU: 'Pacific/Efate', NC: 'Pacific/Noumea', PF: 'Pacific/Tahiti',
  WS: 'Pacific/Apia', TO: 'Pacific/Tongatapu', TV: 'Pacific/Funafuti', KI: 'Pacific/Tarawa',
  MH: 'Pacific/Majuro', FM: 'Pacific/Pohnpei', NR: 'Pacific/Nauru', PW: 'Pacific/Palau',
  CK: 'Pacific/Rarotonga', NU: 'Pacific/Niue', TK: 'Pacific/Fakaofo',

  // Oriente Medio / otros microestados ya incluidos arriba

  // Fallbacks territoriales (si aplican en tus datos)
  RE: 'Indian/Reunion', YT: 'Indian/Mayotte', PM: 'America/Miquelon', GP: 'America/Guadeloupe',
}

// Normaliza input y devuelve TZ; si no existe, Bogotá.
export function tzFromCountryCode(countryCode?: string | null): string {
  if (!countryCode) return 'America/Bogota'
  const cc = countryCode.toUpperCase()
  return COUNTRY_TZ[cc] || 'America/Bogota'
}

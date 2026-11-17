// The 54 African countries (ISO 3166-1 alpha-2), for the demo request form.
export const AFRICAN_COUNTRIES = [
  'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CD', 'CG', 'CI', 'DJ', 'EG', 'GQ', 'ER',
  'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ',
  'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW',
] as const

/** Countries as { code, name } in the given language, sorted by name in that language. */
export function countryOptions(locale: string): { code: string; name: string }[] {
  const names = new Intl.DisplayNames([locale], { type: 'region' })
  return AFRICAN_COUNTRIES.map((code) => ({ code, name: names.of(code) ?? code })).sort((a, b) =>
    a.name.localeCompare(b.name, locale),
  )
}

/** Where the demo request form posts. Undefined until PUBLIC_API_URL is set. */
export function demoRequestEndpoint(apiUrl: string | undefined): string | undefined {
  if (!apiUrl) return undefined
  return new URL('/api/v1/leads/demo-requests/', apiUrl).href
}

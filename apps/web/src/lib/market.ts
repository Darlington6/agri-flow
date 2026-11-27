// Which market the demo's sample data is in, and each country's currency.
// Amounts in the data are plain numbers in the market's currency; they're
// formatted with it (lib/format.ts), so moving the demo to another country,
// or showing a real account's own currency, changes data, not code.

export const DEMO_MARKET = { country: 'RW', currency: 'RWF' } as const

// ISO 4217 codes for the countries AgriFlow plans to work in first.
const CURRENCY_BY_COUNTRY: Record<string, string> = {
  BI: 'BIF',
  CD: 'CDF',
  ET: 'ETB',
  GH: 'GHS',
  KE: 'KES',
  MW: 'MWK',
  NG: 'NGN',
  RW: 'RWF',
  TZ: 'TZS',
  UG: 'UGX',
  ZA: 'ZAR',
  ZM: 'ZMW',
}

/** A country's currency (ISO 4217), or the demo market's when we don't know it. */
export function currencyFor(country: string | undefined): string {
  return (country && CURRENCY_BY_COUNTRY[country.toUpperCase()]) || DEMO_MARKET.currency
}

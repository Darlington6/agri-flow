import { DEMO_MARKET } from './market'

/**
 * Money, short: "RWF 2.45M", "RWF 18K", "RWF 950" (billions as "B"). The
 * currency code comes first, as people write it in East and West Africa.
 * Amounts are in the currency's main unit; RWF, UGX and the like have no
 * cents, and the short form never shows any.
 */
export function formatMoney(amount: number, currency: string = DEMO_MARKET.currency): string {
  const size = Math.abs(amount)
  if (size >= 1_000_000_000) return `${currency} ${(amount / 1_000_000_000).toFixed(2)}B`
  if (size >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(2)}M`
  if (size >= 1_000) return `${currency} ${(amount / 1_000).toFixed(0)}K`
  return `${currency} ${amount.toLocaleString()}`
}

/** Money in full: "RWF 1,250,000". */
export function formatMoneyFull(amount: number, currency: string = DEMO_MARKET.currency): string {
  return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

/** A price per unit: "RWF 420/kg", "RWF 380,000/t". */
export function formatPrice(amount: number, unit: string, currency: string = DEMO_MARKET.currency): string {
  return `${formatMoneyFull(amount, currency)}/${unit}`
}

export function formatTonnes(amount: number): string {
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 1 })} t`
}

export function formatGHS(amount: number): string {
  if (amount >= 1_000_000) return `GHS ${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `GHS ${(amount / 1_000).toFixed(0)}K`
  return `GHS ${amount.toLocaleString()}`
}

export function formatGHSFull(amount: number): string {
  return `GHS ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

export function formatTonnes(amount: number): string {
  return `${amount.toLocaleString(undefined, { maximumFractionDigits: 1 })} t`
}

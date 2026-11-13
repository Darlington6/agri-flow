import { describe, expect, it } from 'vitest'
import { formatGHS, formatTonnes } from './format'

// These pin down today's Ghana-only formatting. The multi-currency work will
// replace formatGHS with a currency-aware formatter; update these tests then.
describe('formatGHS', () => {
  it('abbreviates millions to two decimals', () => {
    expect(formatGHS(2_450_000)).toBe('GHS 2.45M')
    expect(formatGHS(1_000_000)).toBe('GHS 1.00M')
  })

  it('abbreviates thousands to whole K', () => {
    expect(formatGHS(18_400)).toBe('GHS 18K')
    expect(formatGHS(1_000)).toBe('GHS 1K')
  })

  it('shows small amounts in full', () => {
    expect(formatGHS(950)).toBe('GHS 950')
    expect(formatGHS(0)).toBe('GHS 0')
  })
})

describe('formatTonnes', () => {
  it('rounds to one decimal and adds the unit', () => {
    expect(formatTonnes(12.34)).toBe('12.3 t')
    expect(formatTonnes(5)).toBe('5 t')
  })
})

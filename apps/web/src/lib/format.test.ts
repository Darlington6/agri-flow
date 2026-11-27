import { describe, expect, it } from 'vitest'
import { formatMoney, formatMoneyFull, formatPrice, formatTonnes } from './format'
import { currencyFor, DEMO_MARKET } from './market'

describe('formatMoney', () => {
  it('uses the demo market’s currency unless told another', () => {
    expect(DEMO_MARKET.currency).toBe('RWF')
    expect(formatMoney(950)).toBe('RWF 950')
    expect(formatMoney(950, 'KES')).toBe('KES 950')
  })

  it('abbreviates billions and millions to two decimals', () => {
    expect(formatMoney(2_450_000_000)).toBe('RWF 2.45B')
    expect(formatMoney(2_450_000)).toBe('RWF 2.45M')
    expect(formatMoney(1_000_000)).toBe('RWF 1.00M')
  })

  it('abbreviates thousands to whole K', () => {
    expect(formatMoney(18_400)).toBe('RWF 18K')
    expect(formatMoney(1_000)).toBe('RWF 1K')
  })

  it('shows small amounts in full', () => {
    expect(formatMoney(0)).toBe('RWF 0')
  })
})

describe('formatMoneyFull and formatPrice', () => {
  it('writes the whole amount, and a price per unit', () => {
    expect(formatMoneyFull(1_250_000)).toBe('RWF 1,250,000')
    expect(formatPrice(420, 'kg')).toBe('RWF 420/kg')
    expect(formatPrice(380_000, 't', 'GHS')).toBe('GHS 380,000/t')
  })
})

describe('currencyFor', () => {
  it('knows each planned country’s currency, else the demo market’s', () => {
    expect(currencyFor('RW')).toBe('RWF')
    expect(currencyFor('ke')).toBe('KES')
    expect(currencyFor('GH')).toBe('GHS')
    expect(currencyFor('FR')).toBe('RWF')
    expect(currencyFor(undefined)).toBe('RWF')
  })
})

describe('formatTonnes', () => {
  it('rounds to one decimal and adds the unit', () => {
    expect(formatTonnes(12.34)).toBe('12.3 t')
    expect(formatTonnes(5)).toBe('5 t')
  })
})

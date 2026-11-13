import { afterEach, describe, expect, it } from 'vitest'
import { addDays, daysBetween, formatDate, formatShortDate } from './date'

// Date maths must give the same calendar date wherever the user is. These zones
// cover UTC itself, West Africa (UTC+0), the likely Rwanda pilot (UTC+2), East
// Africa (UTC+3) and a zone behind UTC.
const TIME_ZONES = ['UTC', 'Africa/Accra', 'Africa/Kigali', 'Africa/Nairobi', 'America/New_York']

const originalTz = process.env.TZ
afterEach(() => {
  process.env.TZ = originalTz
})

describe.each(TIME_ZONES)('in %s', (tz) => {
  it('adds days across month and year ends', () => {
    process.env.TZ = tz
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29') // leap year
  })

  it('subtracts days', () => {
    process.env.TZ = tz
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2026-11-20', -10)).toBe('2026-11-10')
  })

  it('counts whole days between dates', () => {
    process.env.TZ = tz
    expect(daysBetween('2026-01-01', '2026-01-31')).toBe(30)
    expect(daysBetween('2026-03-01', '2026-02-01')).toBe(-28)
    expect(daysBetween('2026-11-13', '2026-11-13')).toBe(0)
  })

  it('formats the same calendar date it was given', () => {
    process.env.TZ = tz
    expect(formatDate('2026-11-13')).toBe('13 Nov 2026')
    expect(formatShortDate('2026-01-01')).toBe('1 Jan')
  })
})

import { birthDate, firstStep, isMinor, shortName, stepsFor, whoCanReachYouKey } from '.'

describe('stepsFor', () => {
  it('asks a new account everything', () => {
    expect(stepsFor({ staff: false, hasPhone: false, returning: false })).toEqual([
      'name',
      'place',
      'role',
      'phone',
      'terms',
    ])
  })

  it('skips the phone for phone sign-ups and the role for staff', () => {
    expect(stepsFor({ staff: true, hasPhone: true, returning: false })).toEqual(['name', 'place', 'terms'])
  })

  it('only asks someone already set up to agree to new terms', () => {
    expect(stepsFor({ staff: false, hasPhone: false, returning: true })).toEqual(['terms'])
  })
})

describe('firstStep', () => {
  it('picks up at the first step not done', () => {
    const steps = stepsFor({ staff: false, hasPhone: false, returning: false })
    expect(firstStep(steps, 'role')).toBe(2)
    expect(firstStep(steps, null)).toBe(4)
  })

  it('starts at the beginning when the next step isn’t shown', () => {
    expect(firstStep(['name', 'terms'], 'phone')).toBe(0)
  })
})

describe('whoCanReachYouKey', () => {
  it('fits one role, and is general for several or none', () => {
    expect(whoCanReachYouKey(['delivery_partner'])).toBe('welcome.phone.who.delivery_partner')
    expect(whoCanReachYouKey(['farmer', 'buyer'])).toBe('welcome.phone.who.any')
    expect(whoCanReachYouKey(['field_agent'])).toBe('welcome.phone.who.any')
  })
})

describe('shortName', () => {
  it('suggests the first name and the last name’s initial', () => {
    expect(shortName('  Aline  Mukamana Uwase ')).toBe('Aline U.')
    expect(shortName('Aline')).toBe('Aline')
    expect(shortName('')).toBe('')
  })
})

describe('birthDate', () => {
  const today = new Date(2026, 10, 26)

  it('turns day, month and year into YYYY-MM-DD', () => {
    expect(birthDate('3', '12', '1994', today)).toEqual({ value: '1994-12-03' })
    expect(birthDate('26', '11', '2026', today)).toEqual({ value: '2026-11-26' })
  })

  it('refuses dates that don’t exist, are in the future or are too long ago', () => {
    expect(birthDate('31', '2', '1994', today)).toEqual({ error: 'invalid' })
    expect(birthDate('1', '1', '94', today)).toEqual({ error: 'invalid' })
    expect(birthDate('', '1', '1994', today)).toEqual({ error: 'invalid' })
    expect(birthDate('27', '11', '2026', today)).toEqual({ error: 'future' })
    expect(birthDate('1', '1', '1899', today)).toEqual({ error: 'old' })
  })
})

describe('isMinor', () => {
  const today = new Date(2026, 10, 27)

  it('is true until the 18th birthday', () => {
    expect(isMinor('2008-11-28', today)).toBe(true)
    expect(isMinor('2008-11-27', today)).toBe(false)
  })

  it('is false until a full date is given', () => {
    expect(isMinor('', today)).toBe(false)
  })
})

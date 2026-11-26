import { countryName, countryOf, countryOptions, guessCountry, phoneValue, searchCountries, toE164 } from './phone'

describe('guessCountry', () => {
  it("starts on the account's country when there is one", () => {
    expect(guessCountry('KE', { timeZone: 'Africa/Accra' })).toBe('KE')
  })

  it("prefers the device's time zone over its language", () => {
    expect(guessCountry(undefined, { timeZone: 'Africa/Kigali', regions: ['US'] })).toBe('RW')
  })

  it("falls back to the language's region, then the pilot country", () => {
    expect(guessCountry(undefined, { timeZone: 'Europe/Paris', regions: [null, 'GH'] })).toBe('GH')
    expect(guessCountry(undefined, {})).toBe('RW')
  })
})

describe('phoneValue', () => {
  it('reads a local number in the chosen country', () => {
    expect(phoneValue('0788 123 456', 'RW')).toBe('+250788123456')
    expect(toE164('0788 123 456', 'RW')).toBe('+250788123456')
  })

  it('keeps a number typed with its own country code', () => {
    expect(phoneValue('+233 24 123 4567', 'RW')).toBe('+233241234567')
  })

  it('sends its best try when the number is not valid yet, so the API can say why', () => {
    expect(phoneValue('0788', 'RW')).toBe('+250788')
  })
})

describe('countryOf', () => {
  it('moves to the country as soon as its code is typed', () => {
    expect(countryOf('+233')).toBe('GH')
    expect(countryOf('00254 7')).toBe('KE')
    expect(countryOf('+23')).toBeUndefined()
    expect(countryOf('0788123456')).toBeUndefined()
  })
})

describe('countries', () => {
  it('names every country even where the phone has no Intl.DisplayNames', () => {
    const original = Object.getOwnPropertyDescriptor(Intl, 'DisplayNames')!
    Object.defineProperty(Intl, 'DisplayNames', { configurable: true, value: undefined })
    try {
      // A language no other test asks for, so the list is built here, not cached.
      const options = countryOptions('en-GB')
      expect(options.find((o) => o.code === 'RW')).toEqual({ code: 'RW', name: 'Rwanda', dial: '+250' })
      expect(options.every((o) => o.name !== o.code)).toBe(true)
    } finally {
      Object.defineProperty(Intl, 'DisplayNames', original)
    }
  })

  it('builds the list once per language', () => {
    expect(countryOptions('en')).toBe(countryOptions('en'))
    expect(countryName('RW', 'en')).toBe('Rwanda')
  })

  it('finds a country by name, code or dialling code', () => {
    const options = countryOptions('en')
    expect(searchCountries(options, 'rwa').map((o) => o.code)).toEqual(['RW'])
    expect(searchCountries(options, 'gh').map((o) => o.code)).toContain('GH')
    expect(searchCountries(options, '+254').map((o) => o.code)).toEqual(['KE'])
    expect(searchCountries(options, '  ')).toHaveLength(options.length)
  })
})

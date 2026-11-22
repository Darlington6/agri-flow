import { describe, expect, it } from 'vitest'
import { countryOf, examplePlaceholder, flag, formatPhone, guessCountry, phoneValue, toE164 } from './phone'

describe('guessCountry', () => {
  it("prefers the account's own country", () => {
    expect(guessCountry('KE', { timeZone: 'Africa/Kigali', languages: ['en-GH'] })).toBe('KE')
  })

  it('reads the country from the time zone next', () => {
    expect(guessCountry(undefined, { timeZone: 'Africa/Kigali', languages: ['en-US'] })).toBe('RW')
    expect(guessCountry(undefined, { timeZone: 'Africa/Lagos' })).toBe('NG')
  })

  it("then from a region the device's language names, skipping bare languages", () => {
    expect(guessCountry(undefined, { timeZone: 'Europe/Paris', languages: ['fr', 'en-UG'] })).toBe('UG')
  })

  it('falls back to the pilot country', () => {
    expect(guessCountry(undefined, { timeZone: 'UTC', languages: ['en'] })).toBe('RW')
    expect(guessCountry('XX', {})).toBe('RW')
  })
})

describe('toE164', () => {
  it('reads a local number, leading 0 and spaces included, in the chosen country', () => {
    expect(toE164('0788 123 456', 'RW')).toBe('+250788123456')
    expect(toE164('788123456', 'RW')).toBe('+250788123456')
    expect(toE164('0712 345678', 'KE')).toBe('+254712345678')
  })

  it('keeps the country of a number typed with +', () => {
    expect(toE164('+254 712 345 678', 'RW')).toBe('+254712345678')
    expect(countryOf('+254712345678')).toBe('KE')
    expect(countryOf('0788123456')).toBeUndefined()
  })

  it('returns nothing for a number that is not valid yet', () => {
    expect(toE164('0788', 'RW')).toBeUndefined()
  })
})

describe('phoneValue', () => {
  it('sends a best-effort international number so the API can explain what is wrong', () => {
    expect(phoneValue('0788 12', 'RW')).toBe('+25078812')
    expect(phoneValue('+44 12', 'RW')).toBe('+4412')
  })
})

describe('display', () => {
  it('formats stored numbers for people', () => {
    expect(formatPhone('+250788123456')).toBe('+250 788 123 456')
    expect(formatPhone('not a number')).toBe('not a number')
  })

  it('shows a local example for the country and its flag', () => {
    expect(examplePlaceholder('RW')).toMatch(/^07\d/)
    expect(flag('RW')).toBe('🇷🇼')
  })
})

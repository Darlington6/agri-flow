import { describe, expect, it } from 'vitest'
import { guessLanguage, landingFor } from './onboarding'

describe('landingFor', () => {
  it('sends accounts that still need setting up to /welcome, others home', () => {
    expect(landingFor({ needs_onboarding: true })).toBe('/welcome')
    expect(landingFor({ needs_onboarding: false })).toBe('/home')
  })
})

describe('guessLanguage', () => {
  it('takes the first device language we offer', () => {
    expect(guessLanguage(['de-DE', 'rw-RW', 'en'])).toBe('rw')
    expect(guessLanguage(['fr-CA'])).toBe('fr')
    expect(guessLanguage(['sw'])).toBe('sw')
  })

  it('reads Akan as Twi', () => {
    expect(guessLanguage(['ak-GH'])).toBe('tw')
  })

  it('falls back to English', () => {
    expect(guessLanguage(['de-DE', 'zh'])).toBe('en')
    expect(guessLanguage([])).toBe('en')
  })
})

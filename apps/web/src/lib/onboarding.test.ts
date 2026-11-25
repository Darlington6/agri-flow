import { describe, expect, it } from 'vitest'
import { guessLanguage, landingFor, whoCanReachYou } from './onboarding'

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

describe('whoCanReachYou', () => {
  it('names the people each role deals with', () => {
    expect(whoCanReachYou(['delivery_partner'])).toBe('farmers, cooperatives and buyers')
    expect(whoCanReachYou(['farmer'])).toBe('buyers, your cooperative and delivery partners')
    expect(whoCanReachYou(['buyer'])).toBe('farmers, cooperatives and delivery partners')
    expect(whoCanReachYou(['cooperative'])).toBe('your members, buyers and delivery partners')
  })

  it('stays general for several roles, none yet, or staff roles', () => {
    expect(whoCanReachYou(['farmer', 'buyer'])).toBe('the people you work with on AgriFlow')
    expect(whoCanReachYou([])).toBe('the people you work with on AgriFlow')
    expect(whoCanReachYou(['platform_admin', 'farmer'])).toBe('buyers, your cooperative and delivery partners')
  })
})

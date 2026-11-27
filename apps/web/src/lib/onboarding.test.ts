import { describe, expect, it } from 'vitest'
import { guessLanguage, isMinor, landingFor, shortName, whoCanReachYou } from './onboarding'

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

describe('shortName', () => {
  it('suggests the first name and the last name’s initial', () => {
    expect(shortName('  Aline  Mukamana Uwase ')).toBe('Aline U.')
    expect(shortName('Aline')).toBe('Aline')
    expect(shortName('')).toBe('')
  })
})

describe('isMinor', () => {
  const today = new Date(2026, 10, 27)

  it('is true until the 18th birthday', () => {
    expect(isMinor('2008-11-28', today)).toBe(true)
    expect(isMinor('2008-11-27', today)).toBe(false)
    expect(isMinor('1994-03-12', today)).toBe(false)
  })

  it('is false until a full date is given', () => {
    expect(isMinor('', today)).toBe(false)
    expect(isMinor('2015-1', today)).toBe(false)
  })
})

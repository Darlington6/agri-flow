import { describe, expect, it } from 'vitest'
import type { Place } from '@/types'
import { countryName, formatPlace, formatServiceAreas, isInServiceAreas, sameArea } from './places'

const techiman: Place = { name: 'Techiman', area: 'Bono', countryCode: 'GH' }
const atebubu: Place = { name: 'Atebubu', area: 'Bono East', countryCode: 'GH' }
const accra: Place = { name: 'Accra', area: 'Greater Accra', countryCode: 'GH' }
const musanze: Place = { name: 'Musanze', area: 'Northern Province', countryCode: 'RW' }
const kigali: Place = { name: 'Kigali', area: 'Kigali', countryCode: 'RW' }
const muranga: Place = { name: 'Kangema', area: "Murang'a", countryCode: 'KE' }

describe('sameArea', () => {
  it('ignores case, accents and extra spaces', () => {
    expect(sameArea('Bono  East', 'bono east')).toBe(true)
    expect(sameArea('Région du Nord', 'Region du Nord')).toBe(true)
  })

  it('never treats one area name as part of another', () => {
    expect(sameArea('Bono', 'Bono East')).toBe(false)
    expect(sameArea('Accra', 'Greater Accra')).toBe(false)
  })
})

describe('isInServiceAreas', () => {
  it('does not match "Bono East" for a partner that only covers "Bono"', () => {
    const bonoOnly = [{ countryCode: 'GH', areas: ['Bono'] }]
    expect(isInServiceAreas(techiman, bonoOnly)).toBe(true)
    expect(isInServiceAreas(atebubu, bonoOnly)).toBe(false)
  })

  it('matches Accra for a partner covering Greater Accra', () => {
    expect(isInServiceAreas(accra, [{ countryCode: 'GH', areas: ['Greater Accra'] }])).toBe(true)
  })

  it('works for any country: Rwandan provinces, Kenyan counties', () => {
    expect(isInServiceAreas(musanze, [{ countryCode: 'RW', areas: ['Northern Province'] }])).toBe(true)
    expect(isInServiceAreas(muranga, [{ countryCode: 'KE', areas: ["Murang'a", 'Kiambu'] }])).toBe(true)
  })

  it('treats a service area without listed areas as the whole country', () => {
    const allOfRwanda = [{ countryCode: 'RW' }]
    expect(isInServiceAreas(musanze, allOfRwanda)).toBe(true)
    expect(isInServiceAreas(kigali, allOfRwanda)).toBe(true)
    expect(isInServiceAreas(accra, allOfRwanda)).toBe(false)
  })

  it('never matches an area with the same name in a different country', () => {
    const northernGhana = [{ countryCode: 'GH', areas: ['Northern Province'] }]
    expect(isInServiceAreas(musanze, northernGhana)).toBe(false)
  })

  it('accepts lower-case country codes', () => {
    expect(isInServiceAreas(kigali, [{ countryCode: 'rw' }])).toBe(true)
  })
})

describe('formatPlace', () => {
  it('shows the place and its area', () => {
    expect(formatPlace(techiman)).toBe('Techiman, Bono')
  })

  it('does not repeat a name that is also the area', () => {
    expect(formatPlace(kigali)).toBe('Kigali')
  })
})

describe('countryName', () => {
  it('names countries from their codes', () => {
    expect(countryName('RW')).toBe('Rwanda')
    expect(countryName('gh')).toBe('Ghana')
  })

  it('names countries in other languages', () => {
    expect(countryName('KE', 'fr')).toBe('Kenya')
    expect(countryName('GH', 'fr')).toBe('Ghana')
  })
})

describe('formatServiceAreas', () => {
  it('lists the areas for a single country', () => {
    expect(formatServiceAreas([{ countryCode: 'GH', areas: ['Bono', 'Bono East'] }])).toBe('Bono, Bono East')
  })

  it('names the country when a partner covers all of it', () => {
    expect(formatServiceAreas([{ countryCode: 'RW' }])).toBe('Rwanda (all areas)')
  })

  it('labels each country when a partner works across borders', () => {
    expect(formatServiceAreas([{ countryCode: 'RW' }, { countryCode: 'UG', areas: ['Kabale'] }])).toBe(
      'Rwanda (all areas) · Uganda: Kabale',
    )
  })
})

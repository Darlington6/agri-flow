import type { CountryCode, Place, ServiceArea } from '@/types'

// Area names are compared exactly, after normalising case, accents and
// spacing, so "Bono" never matches "Bono East" and "Muranga" matches
// "Murang'a" only if written the same way. Never use substring matching.
function normalise(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function sameArea(a: string, b: string): boolean {
  return normalise(a) === normalise(b)
}

/** True when the place is inside any of the service areas. */
export function isInServiceAreas(place: Place, serviceAreas: ServiceArea[]): boolean {
  return serviceAreas.some(
    (sa) =>
      sa.countryCode.toUpperCase() === place.countryCode.toUpperCase() &&
      (sa.areas === undefined || sa.areas.some((area) => sameArea(area, place.area))),
  )
}

/** "Techiman, Bono". The country is left out; add it with `countryName` where needed. */
export function formatPlace(place: Place): string {
  return sameArea(place.name, place.area) ? place.name : `${place.name}, ${place.area}`
}

/** Country name in the given language, e.g. 'RW' → "Rwanda". Falls back to the code. */
export function countryName(code: CountryCode, locale = 'en'): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}

/** "Bono, Bono East, Ashanti" for one country; "Ghana: Volta · Rwanda (all areas)" across several. */
export function formatServiceAreas(serviceAreas: ServiceArea[], locale = 'en'): string {
  const describe = (sa: ServiceArea) => (sa.areas ? sa.areas.join(', ') : `${countryName(sa.countryCode, locale)} (all areas)`)
  if (serviceAreas.length === 1) return describe(serviceAreas[0])
  return serviceAreas
    .map((sa) => (sa.areas ? `${countryName(sa.countryCode, locale)}: ${sa.areas.join(', ')}` : describe(sa)))
    .join(' · ')
}

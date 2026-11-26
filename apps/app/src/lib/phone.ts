// Phone numbers: which country to start on, how to show it, and how to turn
// what someone typed into the international (E.164) form the API stores. A
// copy of the web app's apps/web/src/lib/phone.ts (same rules), reading the
// device through expo-localization. The API checks again (apps/identity/phone.py).
import { getCalendars, getLocales } from 'expo-localization'
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/min'
import examples from 'libphonenumber-js/mobile/examples'

import { COUNTRY_NAMES_EN } from './country-names'

export type { CountryCode }

/** Where we start when nothing else tells us: the pilot country. */
export const FALLBACK_COUNTRY: CountryCode = 'RW'

// Time zones name a city, not a country, and phones in Africa often report an
// en-US or en-GB language, so the time zone is the better first guess.
const ZONE_COUNTRY: Record<string, CountryCode> = {
  'Africa/Abidjan': 'CI',
  'Africa/Accra': 'GH',
  'Africa/Addis_Ababa': 'ET',
  'Africa/Algiers': 'DZ',
  'Africa/Asmara': 'ER',
  'Africa/Bamako': 'ML',
  'Africa/Bangui': 'CF',
  'Africa/Banjul': 'GM',
  'Africa/Bissau': 'GW',
  'Africa/Blantyre': 'MW',
  'Africa/Brazzaville': 'CG',
  'Africa/Bujumbura': 'BI',
  'Africa/Cairo': 'EG',
  'Africa/Casablanca': 'MA',
  'Africa/Ceuta': 'ES',
  'Africa/Conakry': 'GN',
  'Africa/Dakar': 'SN',
  'Africa/Dar_es_Salaam': 'TZ',
  'Africa/Djibouti': 'DJ',
  'Africa/Douala': 'CM',
  'Africa/El_Aaiun': 'EH',
  'Africa/Freetown': 'SL',
  'Africa/Gaborone': 'BW',
  'Africa/Harare': 'ZW',
  'Africa/Johannesburg': 'ZA',
  'Africa/Juba': 'SS',
  'Africa/Kampala': 'UG',
  'Africa/Khartoum': 'SD',
  'Africa/Kigali': 'RW',
  'Africa/Kinshasa': 'CD',
  'Africa/Lagos': 'NG',
  'Africa/Libreville': 'GA',
  'Africa/Lome': 'TG',
  'Africa/Luanda': 'AO',
  'Africa/Lubumbashi': 'CD',
  'Africa/Lusaka': 'ZM',
  'Africa/Malabo': 'GQ',
  'Africa/Maputo': 'MZ',
  'Africa/Maseru': 'LS',
  'Africa/Mbabane': 'SZ',
  'Africa/Mogadishu': 'SO',
  'Africa/Monrovia': 'LR',
  'Africa/Nairobi': 'KE',
  'Africa/Ndjamena': 'TD',
  'Africa/Niamey': 'NE',
  'Africa/Nouakchott': 'MR',
  'Africa/Ouagadougou': 'BF',
  'Africa/Porto-Novo': 'BJ',
  'Africa/Sao_Tome': 'ST',
  'Africa/Tripoli': 'LY',
  'Africa/Tunis': 'TN',
  'Africa/Windhoek': 'NA',
  'Atlantic/Cape_Verde': 'CV',
  'Indian/Antananarivo': 'MG',
  'Indian/Comoro': 'KM',
  'Indian/Mahe': 'SC',
  'Indian/Mauritius': 'MU',
  'Indian/Mayotte': 'YT',
  'Indian/Reunion': 'RE',
}

const KNOWN = new Set<string>(getCountries())

function isCountry(code: string | null | undefined): code is CountryCode {
  return !!code && KNOWN.has(code)
}

export interface Device {
  timeZone?: string | null
  /** The regions of the device's languages, in order (en-KE gives KE). */
  regions?: readonly (string | null)[]
}

function device(): Device {
  try {
    return {
      timeZone: getCalendars()[0]?.timeZone,
      regions: getLocales().map((locale) => locale.regionCode),
    }
  } catch {
    return {}
  }
}

/**
 * The country a phone field starts on. The account's own country wins when
 * there is one; otherwise the device's time zone, then its language region,
 * then the pilot country. Always one tap to change.
 */
export function guessCountry(accountCountry?: string, from: Device = device()): CountryCode {
  if (isCountry(accountCountry)) return accountCountry
  const byZone = from.timeZone ? ZONE_COUNTRY[from.timeZone] : undefined
  if (isCountry(byZone)) return byZone
  for (const region of from.regions ?? []) {
    if (isCountry(region)) return region
  }
  return FALLBACK_COUNTRY
}

/** The flag emoji for a country. */
export function flag(country: CountryCode): string {
  return String.fromCodePoint(...[...country].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

export function dialCode(country: CountryCode): string {
  return `+${getCountryCallingCode(country)}`
}

export interface CountryOption {
  code: CountryCode
  name: string
  dial: string
}

function regionNames(language?: string): Intl.DisplayNames | undefined {
  try {
    return typeof Intl.DisplayNames === 'function'
      ? new Intl.DisplayNames(language ? [language] : ['en'], { type: 'region' })
      : undefined
  } catch {
    return undefined
  }
}

/** One country's name in the given language where the phone can (English otherwise). */
export function countryName(code: CountryCode, language?: string): string {
  return regionNames(language)?.of(code) ?? COUNTRY_NAMES_EN[code] ?? code
}

function compareIn(language?: string): (a: string, b: string) => number {
  try {
    // One collator for the whole sort: localeCompare(…, language) builds a new
    // one on every call, which made opening the phone step slow on Android.
    return new Intl.Collator(language).compare
  } catch {
    return (a, b) => a.localeCompare(b)
  }
}

// Built once per language: 245 names, sorted, are too slow to rebuild each time
// the phone step opens.
const optionsByLanguage = new Map<string, CountryOption[]>()

/** Every country, named in the given language where the phone can, sorted by name. */
export function countryOptions(language?: string): CountryOption[] {
  const key = language ?? ''
  const cached = optionsByLanguage.get(key)
  if (cached) return cached
  const names = regionNames(language)
  const compare = compareIn(language)
  const options = getCountries()
    .map((code) => ({ code, name: names?.of(code) ?? COUNTRY_NAMES_EN[code] ?? code, dial: dialCode(code) }))
    .sort((a, b) => compare(a.name, b.name))
  optionsByLanguage.set(key, options)
  return options
}

/** Countries whose name (a word in it), code or dialling code matches what was typed. */
export function searchCountries(options: CountryOption[], query: string): CountryOption[] {
  const q = query.trim().toLowerCase()
  if (!q) return options
  const digits = q.replace(/[^\d]/g, '')
  // Words starting with what was typed: "rwa" finds Rwanda, not Norway.
  const startsAWord = (name: string) =>
    name
      .toLowerCase()
      .split(/[\s,.()'-]+/)
      .some((word) => word.startsWith(q))
  return options.filter(
    (o) =>
      o.name.toLowerCase().startsWith(q) ||
      startsAWord(o.name) ||
      o.code.toLowerCase() === q ||
      (digits !== '' && o.dial.slice(1).startsWith(digits)),
  )
}

/** A local mobile number for the country, as a placeholder (e.g. 0720 123 456). */
export function examplePlaceholder(country: CountryCode): string {
  return getExampleNumber(country, examples)?.formatNational() ?? ''
}

/** What someone typed, in international form, or undefined if it isn't a valid number yet. */
export function toE164(input: string, country: CountryCode): string | undefined {
  const parsed = parsePhoneNumberFromString(input, country)
  return parsed?.isValid() ? parsed.number : undefined
}

/**
 * The country a number typed with + (or 00) belongs to, to move the picker
 * along: as soon as the country code is complete (+233 is Ghana), before the
 * rest is typed. Codes several countries share (+1, +7, +44) wait until the
 * number says which.
 */
export function countryOf(input: string): CountryCode | undefined {
  const typed = input.trim().replace(/^00/, '+')
  if (!typed.startsWith('+')) return undefined
  const asYouType = new AsYouType()
  asYouType.input(typed)
  return asYouType.getCountry()
}

/**
 * The value to send. A valid number goes as E.164; otherwise our best try at
 * an international number, so the API answers with its own hint.
 */
export function phoneValue(input: string, country: CountryCode): string {
  const valid = toE164(input, country)
  if (valid) return valid
  const digits = input.replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) return digits
  return `${dialCode(country)}${digits.replace(/^0+/, '')}`
}

/** A stored number written for people: +250 788 123 456. */
export function formatPhone(value: string): string {
  return parsePhoneNumberFromString(value)?.formatInternational() ?? value
}

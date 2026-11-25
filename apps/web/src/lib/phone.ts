// Phone numbers in the browser: which country to start on, how to show it, and
// how to turn what someone typed into the international (E.164) form the API
// stores. The API checks again (apps/identity/phone.py); this is for the person
// typing, so a local number like 0788 123 456 just works once a country is set.
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/min'
import examples from 'libphonenumber-js/mobile/examples'

export type { CountryCode }

/** Where we start when nothing else tells us: the pilot country. */
export const FALLBACK_COUNTRY: CountryCode = 'RW'

// Time zones name a city, not a country, and phones in Africa often report an
// en-US or en-GB language, so the time zone is the better first guess. One
// zone per African country (as the IANA database lists them).
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

function isCountry(code: string | undefined): code is CountryCode {
  return !!code && KNOWN.has(code)
}

interface Device {
  timeZone?: string
  languages?: readonly string[]
}

function device(): Device {
  let timeZone: string | undefined
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    // Very old browsers: fall through to the language.
  }
  return { timeZone, languages: typeof navigator === 'undefined' ? [] : navigator.languages }
}

/**
 * The country a phone field starts on. The account's own country wins when
 * there is one (adding a number later); otherwise the device's time zone, then
 * its language region (en-KE), then the pilot country. Always one tap to change.
 */
export function guessCountry(accountCountry?: string, from: Device = device()): CountryCode {
  if (isCountry(accountCountry)) return accountCountry
  const byZone = from.timeZone ? ZONE_COUNTRY[from.timeZone] : undefined
  if (isCountry(byZone)) return byZone
  for (const tag of from.languages ?? []) {
    try {
      // Only a region the tag names: a bare "en" says nothing about the country.
      const region = new Intl.Locale(tag).region
      if (isCountry(region)) return region
    } catch {
      // A malformed language tag: try the next.
    }
  }
  return FALLBACK_COUNTRY
}

/** The flag emoji for a country (letters on systems without flag emoji). */
export function flag(country: CountryCode): string {
  return String.fromCodePoint(...[...country].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

export function dialCode(country: CountryCode): string {
  return `+${getCountryCallingCode(country)}`
}

/** Every country, named in the given language and sorted by that name. */
export function countryOptions(locale?: string): { code: CountryCode; name: string; dial: string }[] {
  let names: Intl.DisplayNames | undefined
  try {
    names = new Intl.DisplayNames(locale ? [locale] : undefined, { type: 'region' })
  } catch {
    // No DisplayNames: show the codes.
  }
  return getCountries()
    .map((code) => ({ code, name: names?.of(code) ?? code, dial: dialCode(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale))
}

/** A local mobile number for the country, as a placeholder (e.g. 0720 123 456). */
export function examplePlaceholder(country: CountryCode): string {
  return getExampleNumber(country, examples)?.formatNational() ?? ''
}

/**
 * What someone typed, in international form. A number starting with + keeps
 * its own country; anything else is read as a local number in `country`, so a
 * leading 0 is dropped as it should be. Returns undefined if it isn't a valid
 * number yet.
 */
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

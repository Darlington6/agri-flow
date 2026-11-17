// Every language the site is built for. A language only gets pages, sitemap
// entries, hreflang links and a place in the language switcher once
// `published` is true: set that only after a native speaker has reviewed
// the translation. Machine-translated pages hurt trust and search ranking.
//
// `code` is the URL segment (/fr/, /rw/, ...) and the hreflang / <html lang>
// value: ISO 639-1 codes.
export const LOCALES = {
  en: { code: 'en', englishName: 'English', nativeName: 'English', published: true },
  fr: { code: 'fr', englishName: 'French', nativeName: 'Français', published: true },
  rw: { code: 'rw', englishName: 'Kinyarwanda', nativeName: 'Ikinyarwanda', published: false },
  sw: { code: 'sw', englishName: 'Swahili', nativeName: 'Kiswahili', published: true },
  tw: { code: 'tw', englishName: 'Twi', nativeName: 'Twi', published: false },
} as const

export type Locale = keyof typeof LOCALES

/** English lives at the root (/about/); every other language under its code (/fr/about/). */
export const DEFAULT_LOCALE: Locale = 'en'

export const ALL_LOCALES = Object.keys(LOCALES) as Locale[]

export const PUBLISHED_LOCALES = ALL_LOCALES.filter((l) => LOCALES[l].published)

/** Published languages that live under a prefix, i.e. every published one except English. */
export const PREFIXED_LOCALES = PUBLISHED_LOCALES.filter((l) => l !== DEFAULT_LOCALE)

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && value in LOCALES
}

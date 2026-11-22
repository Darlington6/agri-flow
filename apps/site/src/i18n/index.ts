import { en, type Dictionary } from './dictionaries/en'
import { fr } from './dictionaries/fr'
import { sw } from './dictionaries/sw'
import { DEFAULT_LOCALE, type Locale } from './locales'

export { LOCALES, DEFAULT_LOCALE, PUBLISHED_LOCALES, PREFIXED_LOCALES, isLocale, type Locale } from './locales'
export { PAGES, localizedPath, absoluteUrl, alternates, pageForPath, type PageKey } from './paths'
export type { Dictionary }

// Add a language's dictionary here when its translation exists (it must
// satisfy `Dictionary`), then set `published: true` in locales.ts once a
// native speaker has reviewed it.
const DICTIONARIES: Partial<Record<Locale, Dictionary>> = {
  en,
  fr,
  sw,
}

export function dictionaryFor(locale: Locale): Dictionary {
  const dict = DICTIONARIES[locale]
  if (!dict)
    throw new Error(`No translation for "${locale}". Add src/i18n/dictionaries/${locale}.ts before publishing it.`)
  return dict
}

export function hasDictionary(locale: Locale): boolean {
  return DICTIONARIES[locale] !== undefined
}

export const defaultDictionary = DICTIONARIES[DEFAULT_LOCALE] as Dictionary

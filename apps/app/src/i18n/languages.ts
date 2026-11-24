import type { Dictionary } from './dictionaries/en'
import { en } from './dictionaries/en'

// The five launch languages, with the same codes the API stores on each
// account (apps/api LANGUAGES). A language is only offered once its
// dictionary is complete and a native speaker has reviewed it; until then
// people who use it see English. Machine translation isn't good enough for
// Kinyarwanda or Twi, and loses trust in every language.
export const LANGUAGES = {
  en: { nativeName: 'English', dictionary: en as Dictionary },
  fr: { nativeName: 'Français', dictionary: null },
  rw: { nativeName: 'Ikinyarwanda', dictionary: null },
  sw: { nativeName: 'Kiswahili', dictionary: null },
  tw: { nativeName: 'Twi', dictionary: null },
} satisfies Record<string, { nativeName: string; dictionary: Dictionary | null }>

export type Language = keyof typeof LANGUAGES

export const DEFAULT_LANGUAGE: Language = 'en'

export function isLanguage(code: string | null | undefined): code is Language {
  return !!code && Object.hasOwn(LANGUAGES, code)
}

/** Languages people can pick: those with a reviewed dictionary. */
export function readyLanguages(): Language[] {
  return (Object.keys(LANGUAGES) as Language[]).filter((code) => LANGUAGES[code].dictionary)
}

/**
 * The language to show: the first of the person's preferences (their saved
 * choice, then the device's languages in order) that's ready, else English.
 */
export function pickLanguage(preferences: (string | null | undefined)[]): Language {
  const ready = readyLanguages()
  for (const preference of preferences) {
    const code = preference?.toLowerCase().split(/[-_]/)[0]
    if (isLanguage(code) && ready.includes(code)) return code
  }
  return DEFAULT_LANGUAGE
}

export function dictionaryFor(language: Language): Dictionary {
  return LANGUAGES[language].dictionary ?? en
}

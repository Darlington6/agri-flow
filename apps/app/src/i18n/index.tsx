import { getLocales } from 'expo-localization'
import { createContext, useContext, useMemo, type ReactNode } from 'react'

import type { MessageKey } from './dictionaries/en'
import { dictionaryFor, pickLanguage, type Language } from './languages'

export { LANGUAGES, pickLanguage, readyLanguages, type Language } from './languages'
export type { MessageKey } from './dictionaries/en'

type Values = Record<string, string | number>

export type Translate = (key: MessageKey, values?: Values) => string

/** Fills `{name}` placeholders; unknown placeholders are left as they are. */
export function format(message: string, values?: Values): string {
  if (!values) return message
  return message.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : match,
  )
}

export function translator(language: Language): Translate {
  const dictionary = dictionaryFor(language)
  return (key, values) => format(dictionary[key], values)
}

type I18n = { language: Language; t: Translate }

const I18nContext = createContext<I18n | null>(null)

/**
 * Every string on screen goes through `t()`. `language` is the account's
 * saved choice once someone is signed in; before that, the device's languages.
 */
export function I18nProvider({ language: saved, children }: { language?: string | null; children: ReactNode }) {
  const value = useMemo(() => {
    const language = pickLanguage([saved, ...getLocales().map((locale) => locale.languageTag)])
    return { language, t: translator(language) }
  }, [saved])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const i18n = useContext(I18nContext)
  if (!i18n) throw new Error('useI18n must be used inside <I18nProvider>')
  return i18n
}

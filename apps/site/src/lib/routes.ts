import { LOCALES, PREFIXED_LOCALES } from '../i18n'

/** getStaticPaths for src/pages/[locale]/*: one copy per published non-English language. */
export function localeStaticPaths() {
  return PREFIXED_LOCALES.map((l) => ({ params: { locale: LOCALES[l].code } }))
}

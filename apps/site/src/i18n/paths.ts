import { DEFAULT_LOCALE, LOCALES, PUBLISHED_LOCALES, type Locale } from './locales'

// Site pages, by key. Paths are the same in every language; only the prefix
// changes. Trailing slashes are used everywhere (one canonical form per page).
export const PAGES = {
  home: '/',
  howItWorks: '/how-it-works/',
  buyers: '/buyers/',
  farmers: '/farmers/',
  partners: '/partners/',
  about: '/about/',
  requestDemo: '/request-a-demo/',
  privacy: '/privacy/',
  terms: '/terms/',
} as const

export type PageKey = keyof typeof PAGES

/** "/about/" in English, "/fr/about/" in French. */
export function localizedPath(locale: Locale, page: PageKey): string {
  const path = PAGES[page]
  return locale === DEFAULT_LOCALE ? path : `/${LOCALES[locale].code}${path}`
}

/** Absolute URL for a page in a language, on the configured site origin. */
export function absoluteUrl(site: URL | string, locale: Locale, page: PageKey): string {
  return new URL(localizedPath(locale, page), site).href
}

export interface Alternate {
  hreflang: string
  href: string
}

/**
 * hreflang alternates for a page: one per *published* language, plus
 * x-default pointing at English. Unpublished languages are never advertised.
 */
export function alternates(
  site: URL | string,
  page: PageKey,
  published: readonly Locale[] = PUBLISHED_LOCALES,
): Alternate[] {
  const list: Alternate[] = published.map((l) => ({ hreflang: LOCALES[l].code, href: absoluteUrl(site, l, page) }))
  list.push({ hreflang: 'x-default', href: absoluteUrl(site, DEFAULT_LOCALE, page) })
  return list
}

/** The page key for a pathname such as "/fr/about/", or undefined. */
export function pageForPath(pathname: string): PageKey | undefined {
  const withSlash = pathname.endsWith('/') ? pathname : `${pathname}/`
  const segments = withSlash.split('/').filter(Boolean)
  const first = segments[0]
  const unprefixed =
    first && first in LOCALES ? `/${segments.slice(1).join('/')}${segments.length > 1 ? '/' : ''}` : withSlash
  return (Object.keys(PAGES) as PageKey[]).find((k) => PAGES[k] === unprefixed)
}

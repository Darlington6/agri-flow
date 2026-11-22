import { describe, expect, it } from 'vitest'
import { en } from '../src/i18n/dictionaries/en'
import { dictionaryFor, hasDictionary } from '../src/i18n'
import { ALL_LOCALES, DEFAULT_LOCALE, LOCALES, PUBLISHED_LOCALES } from '../src/i18n/locales'
import { PAGES, alternates, localizedPath, pageForPath } from '../src/i18n/paths'

const SITE = 'https://agriflow.example'

describe('languages', () => {
  it('plans English, French, Kinyarwanda, Swahili and Twi, with English as the default', () => {
    expect(ALL_LOCALES).toEqual(['en', 'fr', 'rw', 'sw', 'tw'])
    expect(DEFAULT_LOCALE).toBe('en')
    expect(LOCALES.rw.nativeName).toBe('Ikinyarwanda')
    expect(LOCALES.sw.nativeName).toBe('Kiswahili')
  })

  it('only publishes languages that have a translation', () => {
    for (const l of PUBLISHED_LOCALES) expect(hasDictionary(l), l).toBe(true)
  })

  it('refuses to render a language with no translation yet', () => {
    expect(() => dictionaryFor('rw')).toThrow(/No translation/)
  })
})

describe('translations', () => {
  // Every dictionary must have exactly the keys English has (types enforce this
  // at build time; this catches anything that slips through, e.g. JSON).
  function shape(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(shape)
    if (value && typeof value === 'object')
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]))
    return typeof value
  }
  it.each(ALL_LOCALES.filter(hasDictionary))('%s has the same keys as English', (l) => {
    expect(shape(dictionaryFor(l))).toEqual(shape(en))
  })

  it('has no empty strings in English', () => {
    const empty: string[] = []
    const walk = (v: unknown, path: string) => {
      if (typeof v === 'string' && v.trim() === '') empty.push(path)
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`)
    }
    walk(en, 'en')
    expect(empty).toEqual([])
  })
})

describe('menu labels', () => {
  it('are short in every published language (a long label means text landed in the wrong key)', () => {
    for (const locale of PUBLISHED_LOCALES) {
      for (const [key, label] of Object.entries(dictionaryFor(locale).nav)) {
        expect(label.length, `${locale} nav.${key}: ${label}`).toBeLessThanOrEqual(24)
      }
    }
  })
})

describe('localized paths', () => {
  it('puts English at the root and other languages under their code', () => {
    expect(localizedPath('en', 'home')).toBe('/')
    expect(localizedPath('en', 'about')).toBe('/about/')
    expect(localizedPath('fr', 'about')).toBe('/fr/about/')
    expect(localizedPath('rw', 'home')).toBe('/rw/')
  })

  it('finds the page for a path in any language', () => {
    expect(pageForPath('/about/')).toBe('about')
    expect(pageForPath('/sw/request-a-demo/')).toBe('requestDemo')
    expect(pageForPath('/fr/')).toBe('home')
    expect(pageForPath('/about')).toBe('about')
    expect(pageForPath('/nope/')).toBeUndefined()
  })

  it('uses trailing slashes everywhere (one canonical form)', () => {
    for (const path of Object.values(PAGES)) expect(path.endsWith('/')).toBe(true)
  })
})

describe('hreflang alternates', () => {
  it('lists only published languages, plus x-default for English', () => {
    expect(alternates(SITE, 'about', ['en'])).toEqual([
      { hreflang: 'en', href: 'https://agriflow.example/about/' },
      { hreflang: 'x-default', href: 'https://agriflow.example/about/' },
    ])
  })

  it('adds each language once it is published', () => {
    expect(alternates(SITE, 'buyers', ['en', 'fr', 'rw']).map((a) => [a.hreflang, a.href])).toEqual([
      ['en', 'https://agriflow.example/buyers/'],
      ['fr', 'https://agriflow.example/fr/buyers/'],
      ['rw', 'https://agriflow.example/rw/buyers/'],
      ['x-default', 'https://agriflow.example/buyers/'],
    ])
  })
})

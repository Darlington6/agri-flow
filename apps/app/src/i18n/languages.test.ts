import { en } from './dictionaries/en'
import { format, translator } from './index'
import { LANGUAGES, pickLanguage, readyLanguages } from './languages'

describe('pickLanguage', () => {
  it('uses the first ready language among the preferences', () => {
    expect(pickLanguage([null, 'en-RW'])).toBe('en')
    expect(pickLanguage(['EN_gb'])).toBe('en')
  })

  it('falls back to English for languages without a reviewed dictionary', () => {
    expect(pickLanguage(['rw-RW', 'fr-FR'])).toBe('en')
  })

  it('falls back to English for unknown or missing preferences', () => {
    expect(pickLanguage(['de-DE', undefined, ''])).toBe('en')
    expect(pickLanguage([])).toBe('en')
  })

  it('ignores inherited object keys', () => {
    expect(pickLanguage(['constructor', 'toString'])).toBe('en')
  })
})

describe('languages', () => {
  it('match the codes the API stores on accounts', () => {
    expect(Object.keys(LANGUAGES).sort()).toEqual(['en', 'fr', 'rw', 'sw', 'tw'])
  })

  it('only offer languages with a complete dictionary', () => {
    for (const code of readyLanguages()) {
      expect(Object.keys(LANGUAGES[code].dictionary!).sort()).toEqual(Object.keys(en).sort())
    }
  })
})

describe('format', () => {
  it('fills placeholders and leaves unknown ones', () => {
    expect(format('Hello {name}, {count} new', { name: 'Akua', count: 2 })).toBe('Hello Akua, 2 new')
    expect(format('Hello {name}', {})).toBe('Hello {name}')
  })

  it('translates keys', () => {
    expect(translator('en')('app.name')).toBe('AgriFlow')
  })
})

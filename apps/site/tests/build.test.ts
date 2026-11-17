// Checks the built site (dist/) the way a search engine, a screen reader and a
// slow phone would see it. Run `pnpm build` first; Turborepo does this
// automatically before `pnpm test`.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import axe from 'axe-core'
import { beforeAll, describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, LOCALES, PUBLISHED_LOCALES } from '../src/i18n/locales'

const here = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(here, '../dist')
const SITE = (process.env.SITE_URL ?? 'http://localhost:4321').replace(/\/$/, '')
const INDEXING = process.env.PUBLIC_ALLOW_INDEXING === 'true'
const JS_BUDGET_BYTES = 20 * 1024
const PAGE_PATHS = ['/', '/about/', '/buyers/', '/farmers/', '/how-it-works/', '/partners/', '/privacy/', '/request-a-demo/', '/terms/']
/** "/fr/about/" -> "fr"; "/about/" -> the default language. */
function langOf(path: string): string {
  const first = path.split('/').filter(Boolean)[0]
  const code = PUBLISHED_LOCALES.map((l) => LOCALES[l].code).find((c) => c === first)
  return code ?? LOCALES[DEFAULT_LOCALE].code
}
const EXPECTED_HREFLANGS = [...PUBLISHED_LOCALES.map((l) => LOCALES[l].code), 'x-default']
const EXPECTED_PATHS = PUBLISHED_LOCALES.flatMap((l) =>
  PAGE_PATHS.map((p) => (l === DEFAULT_LOCALE ? p : `/${LOCALES[l].code}${p}`)),
)

function htmlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return htmlFiles(full)
    return name.endsWith('.html') ? [full] : []
  })
}

/** "/about/" for dist/about/index.html, "/404.html" for dist/404.html. */
function urlPath(file: string): string {
  const rel = '/' + relative(DIST, file).split('\\').join('/')
  return rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel
}

interface Page {
  path: string
  html: string
  doc: Document
}
let pages: Page[] = []
let contentPages: Page[] = []

beforeAll(() => {
  if (!existsSync(DIST)) throw new Error('dist/ not found: run `pnpm --filter @agriflow/site build` first.')
  pages = htmlFiles(DIST).map((file) => {
    const html = readFileSync(file, 'utf8')
    return { path: urlPath(file), html, doc: new JSDOM(html).window.document }
  })
  contentPages = pages.filter((p) => p.path !== '/404.html')
})

const meta = (doc: Document, selector: string) => doc.querySelector(selector)?.getAttribute('content') ?? doc.querySelector(selector)?.getAttribute('href')

describe('every page', () => {
  it('builds all nine content pages in every published language, and the 404 page', () => {
    expect(contentPages.map((p) => p.path).sort()).toEqual([...EXPECTED_PATHS].sort())
    expect(pages.some((p) => p.path === '/404.html')).toBe(true)
  })

  it('declares its language', () => {
    for (const p of pages) expect(p.doc.documentElement.lang, p.path).toBe(langOf(p.path))
  })

  it('has a unique title of sensible length', () => {
    const titles = contentPages.map((p) => p.doc.title)
    for (const p of contentPages) {
      expect(p.doc.title.length, p.path).toBeGreaterThan(10)
      expect(p.doc.title.length, `${p.path}: "${p.doc.title}"`).toBeLessThanOrEqual(65)
    }
    expect(new Set(titles).size).toBe(titles.length)
  })

  it('has a meta description of sensible length', () => {
    for (const p of contentPages) {
      const d = meta(p.doc, 'meta[name="description"]') ?? ''
      expect(d.length, `${p.path}: ${d}`).toBeGreaterThanOrEqual(50)
      expect(d.length, `${p.path}: ${d}`).toBeLessThanOrEqual(165)
    }
  })

  it('has a canonical URL pointing at itself', () => {
    for (const p of contentPages) expect(meta(p.doc, 'link[rel="canonical"]'), p.path).toBe(SITE + p.path)
  })

  it('advertises exactly the published languages in hreflang, plus x-default', () => {
    for (const p of contentPages) {
      const langs = [...p.doc.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.getAttribute('hreflang'))
      expect(langs, p.path).toEqual(EXPECTED_HREFLANGS)
    }
  })

  it('offers a language picker listing every published language, only when there is more than one', () => {
    for (const p of contentPages) {
      const picker = p.doc.querySelector('[data-language-switcher]')
      if (PUBLISHED_LOCALES.length < 2) {
        expect(picker, p.path).toBeNull()
        continue
      }
      const links = [...picker!.querySelectorAll('a[hreflang]')]
      expect(links.map((a) => a.getAttribute('hreflang')), p.path).toEqual(PUBLISHED_LOCALES.map((l) => LOCALES[l].code))
      // The current language is marked, and each link keeps you on the same page.
      expect(picker!.querySelector('a[aria-current="true"]')?.getAttribute('hreflang'), p.path).toBe(langOf(p.path))
      for (const a of links) {
        const href = a.getAttribute('href') ?? ''
        const unprefixed = href.replace(/^\/(fr|rw|sw|tw)\//, '/')
        expect(unprefixed, `${p.path} → ${href}`).toBe(p.path.replace(/^\/(fr|rw|sw|tw)\//, '/'))
      }
    }
  })

  it('has social sharing tags with the preview image', () => {
    for (const p of contentPages) {
      expect(meta(p.doc, 'meta[property="og:title"]'), p.path).toBeTruthy()
      expect(meta(p.doc, 'meta[property="og:description"]'), p.path).toBeTruthy()
      expect(meta(p.doc, 'meta[property="og:image"]'), p.path).toBe(`${SITE}/og-${langOf(p.path)}.jpg`)
      expect(meta(p.doc, 'meta[name="twitter:card"]'), p.path).toBe('summary_large_image')
    }
  })

  it(`is ${INDEXING ? 'indexable' : 'kept out of search engines'} (PUBLIC_ALLOW_INDEXING)`, () => {
    for (const p of contentPages) expect(meta(p.doc, 'meta[name="robots"]'), p.path).toBe(INDEXING ? 'index, follow' : 'noindex, nofollow')
    expect(meta(pages.find((p) => p.path === '/404.html')!.doc, 'meta[name="robots"]')).toBe('noindex, nofollow')
  })

  it('has exactly one main heading', () => {
    for (const p of pages) expect(p.doc.querySelectorAll('h1').length, p.path).toBe(1)
  })

  it('gives every image alt text (empty only for decoration)', () => {
    for (const p of pages) for (const img of p.doc.querySelectorAll('img')) expect(img.hasAttribute('alt'), `${p.path}: ${img.outerHTML}`).toBe(true)
  })

  it('has valid structured data', () => {
    for (const p of contentPages) {
      const blocks = [...p.doc.querySelectorAll('script[type="application/ld+json"]')]
      expect(blocks.length, p.path).toBeGreaterThan(0)
      for (const b of blocks) expect(() => JSON.parse(b.textContent ?? ''), p.path).not.toThrow()
    }
    const home = contentPages.find((p) => p.path === '/')!
    const ld = JSON.parse(home.doc.querySelector('script[type="application/ld+json"]')!.textContent!)
    expect(ld.map((x: { '@type': string }) => x['@type'])).toEqual(['WebPage', 'Organization', 'WebSite'])
  })

  it('has no broken internal links', () => {
    const broken: string[] = []
    for (const p of pages) {
      for (const a of p.doc.querySelectorAll('a[href^="/"]')) {
        const href = (a.getAttribute('href') ?? '').split('#')[0]
        const target = href.endsWith('/') ? join(DIST, href, 'index.html') : join(DIST, href)
        if (!existsSync(target)) broken.push(`${p.path} → ${href}`)
      }
    }
    expect(broken).toEqual([])
  })

  it('menu links jump to sections that exist on the target page', () => {
    const missing: string[] = []
    const byPath = new Map(pages.map((p) => [p.path, p.doc]))
    for (const p of pages) {
      for (const a of p.doc.querySelectorAll('a[href*="#"]')) {
        const href = a.getAttribute('href') ?? ''
        const [path, id] = href.split('#')
        if (!id) continue
        const target = path === '' ? p.doc : byPath.get(path)
        if (!target?.getElementById(id)) missing.push(`${p.path} → ${href}`)
      }
    }
    expect(missing).toEqual([])
  })

  it('links to the app ("Log in", "Create account") only when its address is configured', () => {
    const home = contentPages.find((p) => p.path === '/')!
    const appLinks = [...home.doc.querySelectorAll('a[data-app-link]')]
    if (process.env.PUBLIC_APP_URL) {
      expect(appLinks.length).toBeGreaterThan(0)
      for (const a of appLinks) expect(a.getAttribute('href')).toBe(new URL('/signin', process.env.PUBLIC_APP_URL).href)
    } else {
      expect(appLinks).toEqual([])
    }
  })

  it('describes section photos, and keeps decorative background photos silent', () => {
    for (const p of contentPages) {
      for (const img of p.doc.querySelectorAll('section[id] .aspect-\\[4\\/3\\] img, section[id] .aspect-square img')) {
        expect(img.getAttribute('alt')?.trim(), `${p.path}: ${img.getAttribute('src')}`).toBeTruthy()
      }
      for (const img of p.doc.querySelectorAll('.hero-slides img')) expect(img.getAttribute('alt'), p.path).toBe('')
      // The page's opening band (home slideshow, page header photo) is background only.
      for (const img of p.doc.querySelectorAll('main > section:first-of-type img')) expect(img.getAttribute('alt'), p.path).toBe('')
    }
  })

  it('gives the pages behind "Learn more" and request a demo a photo header, and keeps the legal pages plain', () => {
    for (const p of contentPages) {
      const slug = p.path.split('/').filter(Boolean).at(-1) ?? ''
      const hasPhoto = p.doc.querySelector('main > section:first-of-type[data-photo-header]') !== null
      if (['how-it-works', 'buyers', 'farmers', 'partners', 'about', 'request-a-demo'].includes(slug)) expect(hasPhoto, p.path).toBe(true)
      if (['privacy', 'terms'].includes(slug)) expect(hasPhoto, p.path).toBe(false)
    }
  })

  it('has no duplicate ids (e.g. two decorative SVGs on one page)', () => {
    for (const p of pages) {
      const ids = [...p.doc.querySelectorAll('[id]')].map((el) => el.id)
      expect(ids.filter((id, i) => ids.indexOf(id) !== i), p.path).toEqual([])
    }
  })

  it('makes the menu and language picker closable by clicking away', () => {
    for (const p of pages) {
      for (const d of p.doc.querySelectorAll('header details')) expect(d.hasAttribute('data-dismissable'), p.path).toBe(true)
    }
  })

  it('never wraps header menu words, and shows long menus (Swahili) beside the logo only from 1280px', () => {
    for (const p of pages) {
      const nav = p.doc.querySelector('header nav') // the desktop menu; the phone menu's rows may wrap
      for (const a of nav?.querySelectorAll('a') ?? []) expect(a.className, p.path).toContain('whitespace-nowrap')
      expect(nav?.className, p.path).toBe(langOf(p.path) === 'sw' ? 'hidden xl:block' : 'hidden lg:block')
    }
  })

  it(`ships at most ${JS_BUDGET_BYTES / 1024} KB of JavaScript`, () => {
    for (const p of pages) {
      let bytes = 0
      for (const s of p.doc.querySelectorAll('script')) {
        const src = s.getAttribute('src')
        if (src) bytes += statSync(join(DIST, src)).size
        else if (s.getAttribute('type') !== 'application/ld+json') bytes += (s.textContent ?? '').length
      }
      expect(bytes, `${p.path}: ${bytes} bytes`).toBeLessThanOrEqual(JS_BUDGET_BYTES)
    }
  })

  it('has no accessibility violations axe can detect without a layout engine', async () => {
    for (const p of pages) {
      const dom = new JSDOM(p.html, { runScripts: 'outside-only', pretendToBeVisual: true })
      dom.window.eval(axe.source)
      // Colour contrast needs real rendering; tokens.test.ts in apps/web and
      // the palette tests cover contrast instead.
      const result = await (dom.window as unknown as { axe: typeof axe }).axe.run(dom.window.document, {
        rules: { 'color-contrast': { enabled: false } },
      })
      const summary = result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
      expect(summary, p.path).toEqual([])
    }
  }, 60_000)
})

describe('site files', () => {
  it('lists every content page in the sitemap, and not the 404 page', () => {
    const sitemap = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8')
    for (const p of contentPages) expect(sitemap, p.path).toContain(`<loc>${SITE}${p.path}</loc>`)
    expect(sitemap).not.toContain('404')
  })

  it(`robots.txt ${INDEXING ? 'allows crawling and points at the sitemap' : 'blocks crawling'}`, () => {
    const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8')
    if (INDEXING) {
      expect(robots).toContain('Allow: /')
      expect(robots).toContain(`Sitemap: ${SITE}/sitemap-index.xml`)
    } else {
      expect(robots).toContain('Disallow: /')
    }
  })

  it('has a 1200×630 social preview image per language, small enough for WhatsApp (under 300 KB)', () => {
    for (const locale of PUBLISHED_LOCALES) {
      const name = `og-${LOCALES[locale].code}.jpg`
      expect(existsSync(join(DIST, name)), `${name}: run \`pnpm --filter @agriflow/site og\``).toBe(true)
      const jpg = readFileSync(join(DIST, name))
      expect(jpg.length, name).toBeLessThan(300 * 1024)
      // Walk the JPEG segments to the frame header (SOF0/SOF2), which holds the size.
      let i = 2
      while (i < jpg.length && ![0xc0, 0xc2].includes(jpg[i + 1])) i += 2 + jpg.readUInt16BE(i + 2)
      expect({ width: jpg.readUInt16BE(i + 7), height: jpg.readUInt16BE(i + 5) }, name).toEqual({ width: 1200, height: 630 })
    }
  })
})

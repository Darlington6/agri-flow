// Renders the link-sharing preview (public/og-<language>.jpg, 1200×630) for
// every published language: the hero photo, the glowing logo, the field
// stripes, the logo and the hero headline, in the site's own fonts.
//
//   pnpm --filter @agriflow/site build    # the fonts come from dist/
//   pnpm --filter @agriflow/site og
//
// Uses your installed Chrome (set CHROME_PATH if it isn't in the usual place).
// Re-run when the headline, the hero photo or a language changes, and commit
// the images.
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { LOCALES, PUBLISHED_LOCALES } from '../src/i18n/locales.ts'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const DIST = join(ROOT, 'dist')
const CHROME =
  process.env.CHROME_PATH ??
  {
    darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  }[process.platform] ??
  '/usr/bin/google-chrome'
const MAX_BYTES = 300 * 1024 // WhatsApp often skips larger previews.

if (!existsSync(DIST)) throw new Error('dist/ not found: run `pnpm --filter @agriflow/site build` first.')
const css = readFileSync(join(DIST, 'index.html'), 'utf8').match(/href="(\/_astro\/[^"]+\.css)"/)?.[1]
const photo = `data:image/jpeg;base64,${readFileSync(join(ROOT, 'src/assets/media/hero-maize-low-sun.jpg')).toString('base64')}`
const mark = readFileSync(join(ROOT, '../../packages/design-tokens/assets/logos/agriflow-mark-reversed.svg'), 'utf8')
  .replace(/<title>.*?<\/title>/, '')
  .replace('<svg', '<svg width="46" height="60" aria-hidden="true"')

// Same shapes as FieldRows.astro and LogoGlow.astro.
const rows = `<svg viewBox="0 0 1600 320" preserveAspectRatio="xMidYMin slice" style="position:absolute;left:0;bottom:0;width:100%;height:42%;opacity:.55">
<defs><pattern id="r" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)"><path d="M0 11 H22" stroke="#93a281" stroke-opacity=".28" stroke-width="3" stroke-linecap="round"/></pattern>
<pattern id="n" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(6)"><path d="M0 15 H30" stroke="#b2934d" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/></pattern></defs>
<path d="M0 90 C280 50 520 60 800 82 C1080 104 1320 60 1600 46 V320 H0 Z" fill="#38412c"/><path d="M0 90 C280 50 520 60 800 82 C1080 104 1320 60 1600 46 V320 H0 Z" fill="url(#r)"/>
<path d="M0 152 C340 112 660 132 940 158 C1180 180 1400 152 1600 132 V320 H0 Z" fill="#4c573d"/><path d="M0 152 C340 112 660 132 940 158 C1180 180 1400 152 1600 132 V320 H0 Z" fill="url(#r)"/>
<path d="M0 222 C300 190 600 200 900 230 C1180 258 1400 230 1600 212 V320 H0 Z" fill="#283f2f"/><path d="M0 222 C300 190 600 200 900 230 C1180 258 1400 230 1600 212 V320 H0 Z" fill="url(#n)"/></svg>`
const glow = (cx, cy, size) => `<div style="position:absolute;left:${cx - size / 2}px;top:${cy - size / 2}px;width:${size}px;height:${size}px">
<div style="position:absolute;left:2.78%;top:1.11%;width:94.44%;height:94.44%;border-radius:50%;background:radial-gradient(circle closest-side,rgba(209,191,152,.55),rgba(209,191,152,0))"></div>
<div style="position:absolute;left:26.11%;top:24.44%;width:47.78%;height:47.78%;border-radius:50%;background:rgba(245,241,230,.12)"></div>
<div style="position:absolute;left:33.89%;top:33.89%;width:32.22%;height:32.22%;border-radius:50%;background:#b2934d"></div>
<div style="position:absolute;left:32.22%;top:60%;width:16.67%;height:16.67%;border-radius:50%;background:#93a281"></div></div>`

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const card = (lang, eyebrow, title) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><link rel="stylesheet" href="${css}"><style>
html,body{margin:0}#card{position:relative;width:1200px;height:630px;overflow:hidden;background:#151d17;font-family:var(--font-sans)}
</style></head><body><div id="card">
<img src="${photo}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 60%">
<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(21,29,23,.94) 0%,rgba(21,29,23,.82) 45%,rgba(21,29,23,.45) 100%)"></div>
${rows}
${glow(930, 250, 600)}
<div style="position:absolute;left:80px;top:78px;display:flex;align-items:center;gap:18px">${mark}
  <span style="font-family:var(--font-display);font-size:46px;font-weight:600;color:#f5f1e6;letter-spacing:-.01em">AgriFlow</span></div>
<div style="position:absolute;left:80px;top:215px;width:640px">
  <p style="margin:0 0 22px;font-size:20px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#d1bf98">${escape(eyebrow)}</p>
  <h1 id="title" style="margin:0;font-family:var(--font-display);font-size:66px;line-height:1.04;font-weight:600;letter-spacing:-.02em;color:#f5f1e6">${escape(title)}</h1>
</div></div></body></html>`

// Serve dist/ so the page can load the site's stylesheet and fonts.
const types = { '.css': 'text/css', '.woff2': 'font/woff2', '.html': 'text/html' }
let pageHtml = ''
const server = createServer((req, res) => {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0])
  if (path === '/og-card.html') return res.writeHead(200, { 'content-type': 'text/html' }).end(pageHtml)
  const file = join(DIST, path)
  if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) return res.writeHead(404).end()
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
}).listen(0)
const origin = `http://localhost:${server.address().port}`

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1200, height: 630 })
  for (const locale of PUBLISHED_LOCALES) {
    const { code } = LOCALES[locale]
    const { en } = await import('../src/i18n/dictionaries/en.ts')
    const t = locale === 'en' ? en : (await import(`../src/i18n/dictionaries/${locale}.ts`))[locale]
    pageHtml = card(code, t.home.hero.eyebrow, t.home.hero.title)
    await page.goto(`${origin}/og-card.html`, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    // Longer headlines (French, Swahili) shrink until they fit in three lines.
    await page.evaluate(() => {
      const h = document.getElementById('title')
      for (let size = 66; size > 40 && h.offsetHeight > 3 * size * 1.04 + 2; size -= 2) h.style.fontSize = `${size - 2}px`
    })
    const out = join(ROOT, 'public', `og-${code}.jpg`)
    await (await page.$('#card')).screenshot({ path: out, type: 'jpeg', quality: 84 })
    const bytes = statSync(out).size
    if (bytes > MAX_BYTES) throw new Error(`${out} is ${Math.round(bytes / 1024)} KB, over the ${MAX_BYTES / 1024} KB limit`)
    console.log(`public/og-${code}.jpg  ${Math.round(bytes / 1024)} KB`)
  }
} finally {
  await browser.close()
  server.close()
}

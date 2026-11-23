import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// The app is a single page: /dashboard, /signin and the rest only exist in the
// browser. When a browser loads one of them directly (a link from the site, a
// refresh, or a tab the browser unloaded while you were away), Vercel must
// answer with index.html so the app can show the right screen, instead of its
// own 404. The Vercel project's Root Directory is apps/web, so this is the
// vercel.json it reads.
const here = dirname(fileURLToPath(import.meta.url))
const config = JSON.parse(readFileSync(resolve(here, '../../vercel.json'), 'utf8'))

describe('apps/web/vercel.json', () => {
  it('sends every app address to index.html', () => {
    expect(config.rewrites).toContainEqual({ source: '/(.*)', destination: '/index.html' })
  })
})

describe('apps/web/vercel.json headers', () => {
  const headers = Object.fromEntries(
    config.headers.flatMap((block: { headers: { key: string; value: string }[] }) =>
      block.headers.map((h) => [h.key, h.value]),
    ),
  )

  it("lets Google's sign-in button load, draw and talk to Google, and nothing else of Google's", () => {
    const csp: string = headers['Content-Security-Policy']
    expect(csp).toContain("script-src 'self' https://vercel.live https://accounts.google.com/gsi/client;")
    expect(csp).toMatch(/frame-src [^;]*https:\/\/accounts\.google\.com\/gsi\//)
    expect(csp).toMatch(/connect-src [^;]*https:\/\/accounts\.google\.com\/gsi\//)
    expect(csp).not.toMatch(/https:\/\/accounts\.google\.com[ ;]/)
  })

  it("lets Google's sign-in popup report back (and nothing may frame the app)", () => {
    expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin-allow-popups')
    expect(headers['X-Frame-Options']).toBe('DENY')
  })
})

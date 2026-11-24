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

  it('loads nothing of Google\'s: "Continue with Google" is our own button and a plain link to Google', () => {
    expect(headers['Content-Security-Policy']).not.toMatch(/google/i)
  })

  it('keeps other windows out of the app (and nothing may frame it)', () => {
    expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin')
    expect(headers['X-Frame-Options']).toBe('DENY')
  })
})

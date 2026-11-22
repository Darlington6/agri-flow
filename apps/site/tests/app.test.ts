import { existsSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { appUrl } from '../src/lib/app'
import { HERO_SLIDES, PHOTOS, type Photo } from '../src/media/manifest'

const MEDIA = resolve(dirname(fileURLToPath(import.meta.url)), '../src/assets/media')

describe('appUrl', () => {
  it('builds links on the configured app address', () => {
    expect(appUrl('/signin', { PUBLIC_APP_URL: 'https://app.agriflow.example' })).toBe(
      'https://app.agriflow.example/signin',
    )
  })

  it('falls back to the local web app in development', () => {
    expect(appUrl('/signin', { DEV: true })).toBe('http://localhost:5173/signin')
  })

  it('returns nothing in a production build with no address, so no link points nowhere', () => {
    expect(appUrl('/signin', { DEV: false })).toBeUndefined()
  })
})

describe('photo manifest', () => {
  it('uses web-safe, descriptive file names', () => {
    for (const p of Object.values(PHOTOS)) expect(p.file).toMatch(/^[a-z0-9-]+\.(jpg|jpeg|png|webp)$/)
  })

  it('has at least three hero slides (the crossfade timing needs three or more)', () => {
    expect(HERO_SLIDES.length).toBeGreaterThanOrEqual(3)
  })

  // This repository is public: a photo committed here is republished.
  it('records a source and licence for every photo', () => {
    for (const [slot, p] of Object.entries(PHOTOS) as [string, Photo][]) {
      expect(p.source, `${slot}: source`).toBeTruthy()
      expect(p.licence, `${slot}: licence`).toBeTruthy()
    }
  })

  it('keeps only photos the site uses in src/assets/media (others belong in the ignored apps/site/assets/)', () => {
    if (!existsSync(MEDIA)) return
    const used = new Set(Object.values(PHOTOS).map((p) => p.file))
    for (const file of readdirSync(MEDIA).filter((f) => !f.startsWith('.'))) expect(used.has(file), file).toBe(true)
  })
})

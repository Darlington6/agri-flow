import { existsSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { appUrl } from '../src/lib/app'
import { APP_PHOTOS, PHOTOS as REGISTER, type PhotoRecord } from '@agriflow/media'
import { HERO_SLIDES, PHOTOS } from '../src/media/manifest'

const MEDIA = resolve(dirname(fileURLToPath(import.meta.url)), '../../../packages/media/photos')

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
    for (const file of Object.keys(REGISTER)) expect(file).toMatch(/^[a-z0-9-]+\.(jpg|jpeg|png|webp)$/)
  })

  it('has at least three hero slides (the crossfade timing needs three or more)', () => {
    expect(HERO_SLIDES.length).toBeGreaterThanOrEqual(3)
  })

  // This repository is public: a photo committed here is republished.
  it('records a source and licence for every photo', () => {
    for (const [file, p] of Object.entries(REGISTER) as [string, PhotoRecord][]) {
      expect(p.source, `${file}: source`).toBeTruthy()
      expect(p.licence, `${file}: licence`).toBeTruthy()
    }
  })

  it('commits only registered photos that the site or the app uses (others belong in the ignored apps/site/assets/)', () => {
    const used = new Set([...Object.values(PHOTOS), ...Object.values(APP_PHOTOS)].map((p) => p.file))
    const files = readdirSync(MEDIA).filter((f) => !f.startsWith('.'))
    for (const file of files) {
      expect(file in REGISTER, `${file}: in the register`).toBe(true)
      expect(used.has(file as keyof typeof REGISTER), `${file}: used`).toBe(true)
    }
    for (const file of Object.keys(REGISTER)) expect(existsSync(resolve(MEDIA, file)), `${file}: committed`).toBe(true)
  })
})

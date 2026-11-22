import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { APP_PHOTOS, APP_WIDTHS, appImageName, type AppPhoto } from '@agriflow/media'
import { appPhoto } from './appPhotos'

const APP_DIR = resolve(__dirname, '../../../../packages/media/app')

describe('app photos', () => {
  // packages/media/app is generated: regenerate it after changing APP_PHOTOS.
  it('has every sized copy, and nothing it no longer uses', () => {
    const expected = Object.values(APP_PHOTOS).flatMap(({ file }) => APP_WIDTHS.map((w) => appImageName(file, w)))
    expect(
      readdirSync(APP_DIR)
        .filter((f) => !f.startsWith('.'))
        .sort(),
    ).toEqual([...new Set(expected)].sort())
  })

  it('offers each width to the browser', () => {
    for (const name of Object.keys(APP_PHOTOS) as AppPhoto[]) {
      const { srcSet } = appPhoto(name)
      for (const width of APP_WIDTHS) expect(srcSet).toContain(`${width}w`)
    }
  })
})

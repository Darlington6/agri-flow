// Writes the app's photos, already sized, into app/ (the app has no image
// pipeline of its own). Run after changing APP_PHOTOS or APP_WIDTHS:
//   pnpm --filter @agriflow/media app-images
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { APP_PHOTOS, APP_WIDTHS, appImageName } from '../src/index.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'app')

mkdirSync(OUT, { recursive: true })
for (const old of readdirSync(OUT)) rmSync(join(OUT, old))

for (const { file } of Object.values(APP_PHOTOS)) {
  for (const width of APP_WIDTHS) {
    const name = appImageName(file, width)
    const info = await sharp(join(ROOT, 'photos', file))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 68, effort: 6 })
      .toFile(join(OUT, name))
    console.log(`${name}  ${Math.round(info.size / 1024)} KB`)
  }
}

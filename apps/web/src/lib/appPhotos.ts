import { APP_PHOTOS, APP_WIDTHS, appImageName, type AppPhoto, type PhotoFile } from '@agriflow/media'

// The app's photos, sized ahead of time in packages/media/app/ (see that
// package for the files, their licences and how to regenerate them).
const urls = import.meta.glob<string>('../../../../packages/media/app/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
})

export interface SizedPhoto {
  src: string
  srcSet: string
  focus?: string
}

/** The slides for an entry page, each ready for an <img srcSet>. */
export function appSlides(name: AppPhoto): SizedPhoto[] {
  return APP_PHOTOS[name].map(({ file, focus }) => sized(file, focus))
}

function sized(file: PhotoFile, focus?: string): SizedPhoto {
  const sized = APP_WIDTHS.map((width) => ({
    width,
    url: urls[`../../../../packages/media/app/${appImageName(file, width)}`],
  }))
  const missing = sized.find((s) => !s.url)
  if (missing)
    throw new Error(`Missing ${appImageName(file, missing.width)}: run pnpm --filter @agriflow/media app-images`)
  return {
    src: sized[1].url,
    srcSet: sized.map((s) => `${s.url} ${s.width}w`).join(', '),
    focus,
  }
}

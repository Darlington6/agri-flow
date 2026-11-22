// Every photo AgriFlow ships, in one register shared by the site and the app.
//
// This repository is public, so committing a photo republishes it: each file
// in photos/ records where it came from and under which licence. Tests in
// apps/site and apps/web hold that line (every file is registered, every
// entry has a source and a licence, nothing unused is committed). Photos we
// can't use yet stay in the git-ignored apps/site/assets/.
//
// photos/ holds the originals; the site's build turns them into responsive
// AVIF/WebP. The app has no image pipeline, so `pnpm --filter @agriflow/media
// app-images` writes the few photos it uses, already sized, into app/.

const UNSPLASH = 'Unsplash License (https://unsplash.com/license)'
const PEXELS = 'Pexels License (https://www.pexels.com/license/)'
const GEMINI = 'AI-generated with Google Gemini'
const GEMINI_TERMS = 'Google Generative AI Terms (https://policies.google.com/terms/generative-ai)'

export interface PhotoRecord {
  /** Where it came from (page URL), who made it, and under which licence. */
  source: string
  credit?: string
  licence: string
}

export const PHOTOS = {
  'hero-maize-low-sun.jpg': { source: 'https://unsplash.com/photos/fAIhALzeOjk', licence: UNSPLASH },
  'hero-rows-hills-sunset.jpg': { source: 'https://unsplash.com/photos/0_fhco1lRqo', licence: UNSPLASH },
  'hero-maize-trees-sunset.jpg': { source: 'https://unsplash.com/photos/gI_Eig6em8A', licence: UNSPLASH },
  'hero-field-path-sunset.jpg': { source: 'https://unsplash.com/photos/ZtLRT4j_lOA', licence: UNSPLASH },
  'market-produce.jpg': { source: 'https://unsplash.com/photos/cXvqCw0m5WE', licence: UNSPLASH },
  'market-peppers-tomatoes.jpg': { source: 'https://unsplash.com/photos/ac8665AKFD8', licence: UNSPLASH },
  'farmer-basket-harvest.jpg': { source: 'https://www.pexels.com/photo/15897036/', licence: PEXELS },
  'farmer-tomatoes-smiling.jpg': { source: 'https://www.pexels.com/photo/34705724/', licence: PEXELS },
  // AI-generated until we have our own photos from the pilot.
  'agent-phone-farmer.jpg': { source: GEMINI, licence: GEMINI_TERMS },
  'truck-loading-produce.jpg': { source: GEMINI, licence: GEMINI_TERMS },
  'field-agents-terraces.jpg': { source: GEMINI, licence: GEMINI_TERMS },
  'seedling-soil-sunrise.jpg': { source: 'https://unsplash.com/photos/zHvyaZ6Gscc', licence: UNSPLASH },
  'irrigation-dusk-mountains.jpg': { source: 'https://unsplash.com/photos/-QQlSZBTiF4', licence: UNSPLASH },
  'market-stall-evening.jpg': { source: 'https://unsplash.com/photos/APetw1y9_mY', licence: UNSPLASH },
  'farmer-potato-rows.jpg': { source: 'https://www.pexels.com/photo/11588032/', licence: PEXELS },
  'field-lone-tree.jpg': { source: 'https://unsplash.com/photos/5gzZo_nQBIM', licence: UNSPLASH },
  'sunflower-field.jpg': { source: 'https://unsplash.com/photos/DljZW8nrgv8', licence: UNSPLASH },
} satisfies Record<string, PhotoRecord>

export type PhotoFile = keyof typeof PHOTOS

/** A photo placed somewhere: which file, and how to crop it. */
export interface PhotoPlacement {
  file: PhotoFile
  /** CSS object-position, to keep the subject in frame when cropped. */
  focus?: string
}

/** Photos the app uses. app-images sizes exactly these, at APP_WIDTHS. */
export const APP_PHOTOS = {
  // Sign-in: field agents on the terraces, the people the platform serves.
  signIn: { file: 'field-agents-terraces.jpg', focus: '82% 45%' },
  // Demo roles: rows over the hills, a calm look at the whole operation.
  demo: { file: 'hero-rows-hills-sunset.jpg', focus: '50% 40%' },
} satisfies Record<string, PhotoPlacement>

export type AppPhoto = keyof typeof APP_PHOTOS

/** Widths written for the app: a phone band, half a laptop, half a large screen. */
export const APP_WIDTHS = [640, 1024, 1600] as const

/** File name of one sized copy, e.g. field-agents-terraces-640.webp. */
export function appImageName(file: PhotoFile, width: number): string {
  return `${file.replace(/\.[a-z]+$/, '')}-${width}.webp`
}

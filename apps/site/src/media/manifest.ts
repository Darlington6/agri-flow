import type { ImageMetadata } from 'astro'

// Every photo on the site, in one place. Files live in src/assets/media/,
// where Astro turns them into responsive AVIF/WebP at build time.
//
// Every photo records its `source` and `licence`: this repository is public,
// so committing a photo republishes it (tests/app.test.ts enforces both, and
// that src/assets/media holds only photos used here). Photos we can't use yet
// stay in the git-ignored apps/site/assets/. A slot whose file is missing
// renders drawn artwork instead, so the site always builds.
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/media/*.{jpg,jpeg,png,webp}', { eager: true })

const UNSPLASH = 'Unsplash License (https://unsplash.com/license)'
const PEXELS = 'Pexels License (https://www.pexels.com/license/)'
const GEMINI = 'AI-generated with Google Gemini'
const GEMINI_TERMS = 'Google Generative AI Terms (https://policies.google.com/terms/generative-ai)'

export interface Photo {
  file: string
  /** CSS object-position, to keep the subject in frame when cropped. */
  focus?: string
  /** Where it came from (page URL), who made it, and under which licence. */
  source?: string
  credit?: string
  licence?: string
}

export const PHOTOS = {
  // Hero background slideshow (decorative: the headline carries the meaning).
  heroMaizeSunset: { file: 'hero-maize-low-sun.jpg', focus: '50% 60%', source: 'https://unsplash.com/photos/fAIhALzeOjk', licence: UNSPLASH },
  heroRowsSunrise: { file: 'hero-rows-hills-sunset.jpg', focus: '50% 40%', source: 'https://unsplash.com/photos/0_fhco1lRqo', licence: UNSPLASH },
  heroMaizeTrees: { file: 'hero-maize-trees-sunset.jpg', focus: '50% 55%', source: 'https://unsplash.com/photos/gI_Eig6em8A', licence: UNSPLASH },
  heroFieldPath: { file: 'hero-field-path-sunset.jpg', focus: '50% 55%', source: 'https://unsplash.com/photos/ZtLRT4j_lOA', licence: UNSPLASH },
  // Section photos.
  buyers: { file: 'market-produce.jpg', focus: '40% 50%', source: 'https://unsplash.com/photos/cXvqCw0m5WE', licence: UNSPLASH },
  buyersDetail: { file: 'market-peppers-tomatoes.jpg', focus: '55% 50%', source: 'https://unsplash.com/photos/ac8665AKFD8', licence: UNSPLASH },
  farmers: { file: 'farmer-basket-harvest.jpg', focus: '40% 40%', source: 'https://www.pexels.com/photo/15897036/', licence: PEXELS },
  farmersDetail: { file: 'farmer-tomatoes-smiling.jpg', focus: '40% 40%', source: 'https://www.pexels.com/photo/34705724/', licence: PEXELS },
  // AI-generated until we have our own photos from the pilot.
  partners: { file: 'agent-phone-farmer.jpg', focus: '35% 40%', source: GEMINI, licence: GEMINI_TERMS },
  partnersDetail: { file: 'truck-loading-produce.jpg', focus: '72% 50%', source: GEMINI, licence: GEMINI_TERMS },
  // Climate section background (decorative).
  climate: { file: 'seedling-soil-sunrise.jpg', focus: '60% 40%', source: 'https://unsplash.com/photos/zHvyaZ6Gscc', licence: UNSPLASH },
  // Page header backgrounds (decorative), for the pages behind "Learn more" and request a demo.
  pageHowItWorks: { file: 'irrigation-dusk-mountains.jpg', focus: '50% 60%', source: 'https://unsplash.com/photos/-QQlSZBTiF4', licence: UNSPLASH },
  pageBuyers: { file: 'market-stall-evening.jpg', focus: '50% 50%', source: 'https://unsplash.com/photos/APetw1y9_mY', licence: UNSPLASH },
  pageFarmers: { file: 'farmer-potato-rows.jpg', focus: '45% 55%', source: 'https://www.pexels.com/photo/11588032/', licence: PEXELS },
  pagePartners: { file: 'field-agents-terraces.jpg', focus: '70% 45%', source: GEMINI, licence: GEMINI_TERMS },
  pageAbout: { file: 'field-lone-tree.jpg', focus: '60% 50%', source: 'https://unsplash.com/photos/5gzZo_nQBIM', licence: UNSPLASH },
  pageRequestDemo: { file: 'sunflower-field.jpg', focus: '50% 55%', source: 'https://unsplash.com/photos/DljZW8nrgv8', licence: UNSPLASH },
} satisfies Record<string, Photo>

export type PhotoSlot = keyof typeof PHOTOS

export const HERO_SLIDES: PhotoSlot[] = ['heroMaizeSunset', 'heroRowsSunrise', 'heroMaizeTrees', 'heroFieldPath']

/** The optimisable image for a slot, or undefined if its file isn't present. */
export function photoImage(slot: PhotoSlot): ImageMetadata | undefined {
  return files[`../assets/media/${PHOTOS[slot].file}`]?.default
}


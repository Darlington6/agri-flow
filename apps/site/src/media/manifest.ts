import type { ImageMetadata } from 'astro'
import type { PhotoPlacement } from '@agriflow/media'

// Where each photo sits on the site. The files and their licences live in the
// shared register, packages/media (photos/ and src/index.ts), which the app
// uses too; Astro turns them into responsive AVIF/WebP at build time. A slot
// whose file is missing renders drawn artwork instead, so the site always builds.
const files = import.meta.glob<{ default: ImageMetadata }>('../../../../packages/media/photos/*.{jpg,jpeg,png,webp}', {
  eager: true,
})

export type Photo = PhotoPlacement

export const PHOTOS = {
  // Hero background slideshow (decorative: the headline carries the meaning).
  heroMaizeSunset: {
    file: 'hero-maize-low-sun.jpg',
    focus: '50% 60%',
  },
  heroRowsSunrise: {
    file: 'hero-rows-hills-sunset.jpg',
    focus: '50% 40%',
  },
  heroMaizeTrees: {
    file: 'hero-maize-trees-sunset.jpg',
    focus: '50% 55%',
  },
  heroFieldPath: {
    file: 'hero-field-path-sunset.jpg',
    focus: '50% 55%',
  },
  // Section photos.
  buyers: {
    file: 'market-produce.jpg',
    focus: '40% 50%',
  },
  buyersDetail: {
    file: 'market-peppers-tomatoes.jpg',
    focus: '55% 50%',
  },
  farmers: {
    file: 'farmer-basket-harvest.jpg',
    focus: '40% 40%',
  },
  farmersDetail: {
    file: 'farmer-tomatoes-smiling.jpg',
    focus: '40% 40%',
  },
  // AI-generated until we have our own photos from the pilot.
  partners: { file: 'agent-phone-farmer.jpg', focus: '35% 40%' },
  partnersDetail: { file: 'truck-loading-produce.jpg', focus: '72% 50%' },
  // Climate section background (decorative).
  climate: {
    file: 'seedling-soil-sunrise.jpg',
    focus: '60% 40%',
  },
  // Page header backgrounds (decorative), for the pages behind "Learn more" and request a demo.
  pageHowItWorks: {
    file: 'irrigation-dusk-mountains.jpg',
    focus: '50% 60%',
  },
  pageBuyers: {
    file: 'market-stall-evening.jpg',
    focus: '50% 50%',
  },
  pageFarmers: {
    file: 'farmer-potato-rows.jpg',
    focus: '45% 55%',
  },
  pagePartners: { file: 'field-agents-terraces.jpg', focus: '70% 45%' },
  pageAbout: {
    file: 'field-lone-tree.jpg',
    focus: '60% 50%',
  },
  pageRequestDemo: {
    file: 'sunflower-field.jpg',
    focus: '50% 55%',
  },
} satisfies Record<string, Photo>

export type PhotoSlot = keyof typeof PHOTOS

export const HERO_SLIDES: PhotoSlot[] = ['heroMaizeSunset', 'heroRowsSunrise', 'heroMaizeTrees', 'heroFieldPath']

/** The optimisable image for a slot, or undefined if its file isn't present. */
export function photoImage(slot: PhotoSlot): ImageMetadata | undefined {
  return files[`../../../../packages/media/photos/${PHOTOS[slot].file}`]?.default
}

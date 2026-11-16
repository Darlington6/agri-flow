import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { DEFAULT_LOCALE, LOCALES, PUBLISHED_LOCALES } from './src/i18n/locales'

// The public origin. Set SITE_URL once the domain exists; until then Vercel
// provides its production URL, and local builds use localhost.
const site =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:4321')

const published = PUBLISHED_LOCALES.map((l) => LOCALES[l].code)

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    locales: published,
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: DEFAULT_LOCALE, locales: Object.fromEntries(published.map((code) => [code, code])) },
      filter: (page) => !page.includes('/404'),
    }),
  ],
  vite: { plugins: [tailwindcss()] },
})

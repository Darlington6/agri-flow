import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { checkPublicUrls } from '@agriflow/config/public-url'
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
  // Content Security Policy as a <meta> tag on every page. Astro hashes its
  // own inline scripts and styles, so only those (and our own files) run.
  // vercel.live is Vercel's comment toolbar on preview deployments.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https://vercel.live https://vercel.com",
        "font-src 'self' https://vercel.live https://assets.vercel.com",
        "connect-src 'self' https://*.onrender.com https://vercel.live wss://ws-us3.pusher.com",
        "frame-src https://vercel.live",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ],
      scriptDirective: { resources: ["'self'", 'https://vercel.live'] },
      styleDirective: {
        resources: [
          "'self'",
          'https://vercel.live',
          // style="" attributes set photo crops and the hero timing. They
          // can't run code, and the site shows no user content.
          { resource: "'unsafe-inline'", kind: 'attribute' },
        ],
      },
    },
  },
  // PUBLIC_* values are copied into the pages, so they must be plain https://
  // addresses (see @agriflow/config/public-url).
  vite: { plugins: [tailwindcss(), checkPublicUrls(['PUBLIC_API_URL', 'PUBLIC_APP_URL'])] },
})

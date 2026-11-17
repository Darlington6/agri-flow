import type { APIRoute } from 'astro'
import { indexingAllowed } from '../lib/seo'

// Blocks all crawling until PUBLIC_ALLOW_INDEXING is "true" (see lib/seo.ts).
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('/sitemap-index.xml', site).href
  const body = indexingAllowed() ? `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n` : 'User-agent: *\nDisallow: /\n'
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

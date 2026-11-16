/**
 * Search engines may index the site only when PUBLIC_ALLOW_INDEXING is
 * "true". Keep it off on temporary addresses (Vercel previews, the
 * *.vercel.app production URL) so the real domain doesn't start life with
 * duplicate pages already indexed elsewhere.
 */
export function indexingAllowed(env: { PUBLIC_ALLOW_INDEXING?: string } = import.meta.env): boolean {
  return env.PUBLIC_ALLOW_INDEXING === 'true'
}

/** Structured data describing AgriFlow itself (home page). */
export function organizationLd(site: URL | string, name: string, description: string) {
  const url = new URL('/', site).href
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo: new URL('/apple-touch-icon.png', site).href,
    description,
  }
}

export function websiteLd(site: URL | string, name: string, inLanguage: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: new URL('/', site).href,
    inLanguage,
  }
}

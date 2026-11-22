// Checks the addresses the apps read from VITE_* / PUBLIC_* variables at
// build time. Those values are copied into the JavaScript every visitor
// downloads, so a wrong paste (a database connection string, say) is both a
// broken build and a published secret. The build stops instead.
//
// Messages never repeat the value: it may be the very secret we're
// keeping out of the build log.

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/** Why `value` isn't a usable public address, or null when it is (or unset). */
export function publicUrlProblem(value: string | undefined): string | null {
  if (!value) return null

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return "isn't a web address"
  }

  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname))) {
    return 'must start with https://'
  }
  if (url.username || url.password) return 'must not contain a username or password'
  if (url.pathname !== '/' || url.search || url.hash) return 'must be just the address, with no path after it'
  if (value.endsWith('/')) return 'must not end with a slash'
  return null
}

export interface PublicUrlRules {
  /** Variables that must be set, not just valid when present. */
  required?: string[]
}

/**
 * A Vite plugin (Astro accepts it too) that fails the build when any of
 * `names` holds something other than a plain https:// address.
 */
export function checkPublicUrls(names: string[], rules: PublicUrlRules = {}) {
  return {
    name: 'agriflow:check-public-urls',
    apply: 'build' as const,
    configResolved(config: { env: Record<string, unknown> }) {
      const problems = names.flatMap((name) => {
        const value = config.env[name]
        if (typeof value !== 'string' || value === '') {
          return rules.required?.includes(name) ? [`${name} must be set for this build.`] : []
        }
        const problem = publicUrlProblem(value)
        return problem ? [`${name} ${problem}: use the plain address, like https://name.onrender.com.`] : []
      })
      if (problems.length) throw new Error(`Public address check failed:\n  ${problems.join('\n  ')}`)
    },
  }
}

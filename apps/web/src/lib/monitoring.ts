// Error reporting to Sentry, without personal data (the same rules as the
// API's config/observability.py). Reports carry the user's id and roles —
// look them up in the admin — never their name, email or phone number, and
// never the one-time tokens in sign-in and confirmation links.
//
// Off unless VITE_SENTRY_DSN is set, so local development and tests send
// nothing.
import * as Sentry from '@sentry/react'
import type { AuthUser } from './apiClient'

const FILTERED = '[Filtered]'
// id_token, state and nonce: what Google sends back in the #fragment after its sign-in.
const SECRET_PARAMS = new Set([
  'token',
  'code',
  'refresh',
  'access',
  'password',
  'id_token',
  'access_token',
  'state',
  'nonce',
])
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g
const PHONE = /\+\d[\d\s-]{6,17}\d/g

export function scrubText(text: string): string {
  return text.replace(EMAIL, FILTERED).replace(PHONE, FILTERED)
}

function scrubParams(text: string): string {
  const params = new URLSearchParams(text)
  for (const [key, value] of [...params]) {
    params.set(key, SECRET_PARAMS.has(key.toLowerCase()) ? FILTERED : scrubText(value))
  }
  return params.toString().replaceAll('%5BFiltered%5D', FILTERED)
}

/** Hides one-time tokens and codes in a URL's query string and #fragment. */
export function scrubUrl(url: string): string {
  const hash = url.indexOf('#')
  const beforeHash = hash === -1 ? url : url.slice(0, hash)
  const rawFragment = hash === -1 ? '' : url.slice(hash + 1)
  // A plain anchor (#top) stays as it is; key=value fragments are scrubbed like a query.
  const fragment = hash === -1 ? '' : `#${rawFragment.includes('=') ? scrubParams(rawFragment) : rawFragment}`
  const q = beforeHash.indexOf('?')
  if (q === -1) return beforeHash + fragment
  return `${beforeHash.slice(0, q)}?${scrubParams(beforeHash.slice(q + 1))}${fragment}`
}

export function scrubEvent<E extends Sentry.ErrorEvent>(event: E): E {
  if (event.request?.url) event.request.url = scrubUrl(event.request.url)
  if (event.request) {
    delete event.request.cookies
    delete event.request.data
    if (typeof event.request.query_string === 'string') {
      event.request.query_string = scrubUrl(`?${event.request.query_string}`).slice(1)
    }
  }
  if (event.message) event.message = scrubText(event.message)
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = scrubText(exception.value)
  }
  event.breadcrumbs = event.breadcrumbs?.map(scrubBreadcrumb)
  return event
}

export function scrubBreadcrumb(crumb: Sentry.Breadcrumb): Sentry.Breadcrumb {
  if (crumb.message) crumb.message = scrubText(crumb.message)
  const data = crumb.data
  if (data) {
    for (const key of ['url', 'from', 'to']) {
      if (typeof data[key] === 'string') data[key] = scrubUrl(data[key])
    }
  }
  return crumb
}

export function initMonitoring(env: ImportMetaEnv = import.meta.env) {
  if (!env.VITE_SENTRY_DSN) return false
  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    environment: env.VITE_DEPLOY_ENV,
    release: env.VITE_RELEASE || undefined,
    // What the SDK may collect at all; scrubEvent then cleans what's left.
    dataCollection: {
      userInfo: false, // identify() adds the id, nothing else
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: { deny: [...SECRET_PARAMS] },
    },
    // Errors only for now: no performance tracing (it would add headers to
    // API calls the API's CORS rules don't allow) and no session replay
    // (recordings would capture what people type).
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  })
  return true
}

/** Tags error reports with who was signed in: id and roles only. */
export function identify(user: AuthUser | null) {
  Sentry.setUser(user ? { id: String(user.id) } : null)
  Sentry.setTag('roles', user ? user.roles.map((r) => r.slug).join(',') || 'none' : undefined)
}

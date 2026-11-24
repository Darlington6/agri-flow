// "Continue with Google" with our own button and Google's standard
// sign-in redirect (OpenID Connect). Tapping the button sends the person to
// Google's account picker; Google sends them back to /auth/google with an ID
// token (a JWT Google signs) in the address's #fragment, which never reaches
// any server. The API checks the token and signs them in (see
// apps/api/apps/identity/google.py).
//
// No Google script, frame or popup: the button is there at once, never shows
// a Google account before anyone asks, and works the same on phones.
//
// `state` ties the answer to this browser's request (so nobody can sign
// someone in with a token of their choosing) and `nonce` goes into the token
// itself (the API checks it, so a token can't be replayed). Both are random,
// kept in sessionStorage for this tab, and used once.

/** The Google OAuth client for the web app. Public, not a secret. */
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '725235480256-at4gqeelol3iqgdat4ae1h3vvf3mhs5j.apps.googleusercontent.com'

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const STORAGE_KEY = 'agriflow.google-sign-in'
/** How long someone can spend in Google's picker before the request goes stale. */
const MAX_AGE_MS = 10 * 60 * 1000

/** Where Google sends people back. Each address must be listed in the Google Cloud console. */
export function googleRedirectUri(origin: string = window.location.origin): string {
  return `${origin}/auth/google`
}

function randomValue(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function googleSignInUrl({
  state,
  nonce,
  redirectUri,
}: {
  state: string
  nonce: string
  redirectUri: string
}): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'id_token',
    scope: 'openid email profile',
    state,
    nonce,
    // Always the account picker, even with one Google account in the browser.
    prompt: 'select_account',
  })
  return `${AUTH_URL}?${params}`
}

/** Sends the person to Google's account picker. */
export function startGoogleSignIn(): void {
  const request = { state: randomValue(), nonce: randomValue(), at: Date.now() }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(request))
  window.location.assign(googleSignInUrl({ ...request, redirectUri: googleRedirectUri() }))
}

export type GoogleReturn =
  | { credential: string; nonce: string }
  /** `cancelled`: they closed the picker. `stale`: no matching request in this tab (old link, other tab, too slow). */
  | { error: 'cancelled' | 'stale' | 'failed' }

/** Reads what Google sent back in the address's #fragment. Each request can be used once. */
export function takeGoogleReturn(fragment: string): GoogleReturn {
  const answer = new URLSearchParams(fragment.replace(/^#/, ''))
  let saved: { state?: unknown; nonce?: unknown; at?: unknown } | null = null
  try {
    saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')
  } catch {
    saved = null
  }
  sessionStorage.removeItem(STORAGE_KEY)

  const error = answer.get('error')
  if (error) return { error: error === 'access_denied' ? 'cancelled' : 'failed' }

  const credential = answer.get('id_token')
  if (!credential) return { error: 'failed' }
  if (
    !saved ||
    typeof saved.state !== 'string' ||
    typeof saved.nonce !== 'string' ||
    typeof saved.at !== 'number' ||
    Date.now() - saved.at > MAX_AGE_MS ||
    answer.get('state') !== saved.state
  ) {
    return { error: 'stale' }
  }
  return { credential, nonce: saved.nonce }
}

/**
 * Browsers built into other apps (WhatsApp, Facebook, Instagram, ...), where
 * links shared in chats open. Google refuses to sign in inside them
 * ("disallowed_useragent"), so we say how to open the page in a real browser
 * instead of showing a button that can't work.
 */
export function isInAppBrowser(userAgent: string = navigator.userAgent): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|Snapchat|TikTok|musical_ly|; wv\)/i.test(userAgent)
}

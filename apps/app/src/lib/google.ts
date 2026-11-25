// "Continue with Google" in the browser build of this app: the same
// redirect to Google's account picker as the web app (apps/web/src/lib/google.ts,
// where the reasoning is written up). Google sends people back to
// /auth/google with an ID token in the #fragment; `state` ties the answer to
// this tab and `nonce` (checked by the API) stops a token being replayed.
//
// iOS and Android need Google's own sign-in on the device and an OAuth
// client for each; until those exist, the button only shows on the web.
import { Platform } from 'react-native'

/** The Google OAuth client for the web. Public, not a secret. */
export const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '725235480256-at4gqeelol3iqgdat4ae1h3vvf3mhs5j.apps.googleusercontent.com'

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const STORAGE_KEY = 'agriflow.google-sign-in'
/** How long someone can spend in Google's picker before the request goes stale. */
const MAX_AGE_MS = 10 * 60 * 1000

/** Browsers built into other apps, where Google refuses to sign in. */
export function isInAppBrowser(userAgent: string): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|Line\/|Snapchat|TikTok|musical_ly|; wv\)/i.test(userAgent)
}

/** Whether this build can offer Continue with Google. */
export function googleAvailable(os: string = Platform.OS): boolean {
  return os === 'web' && typeof navigator !== 'undefined' && !isInAppBrowser(navigator.userAgent)
}

/** Where Google sends people back. Each address must be listed in the Google Cloud console. */
export function googleRedirectUri(origin: string): string {
  return `${origin}/auth/google`
}

function randomValue(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function googleSignInUrl({ state, nonce, redirectUri }: { state: string; nonce: string; redirectUri: string }) {
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

/** Sends the person to Google's account picker (web only). */
export function startGoogleSignIn(): void {
  const request = { state: randomValue(), nonce: randomValue(), at: Date.now() }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(request))
  window.location.assign(googleSignInUrl({ ...request, redirectUri: googleRedirectUri(window.location.origin) }))
}

export type GoogleReturn =
  | { credential: string; nonce: string }
  /** `cancelled`: they closed the picker. `stale`: no matching request in this tab. */
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
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable: nothing to clear.
  }

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

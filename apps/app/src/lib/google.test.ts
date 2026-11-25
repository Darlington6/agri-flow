import { googleAvailable, googleSignInUrl, isInAppBrowser, takeGoogleReturn } from './google'

// The test environment has no browser storage; the web build does.
const store = new Map<string, string>()
beforeAll(() => {
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  })
})
afterEach(() => store.clear())

const KEY = 'agriflow.google-sign-in'
const asked = (at = Date.now()) => store.set(KEY, JSON.stringify({ state: 's1', nonce: 'n1', at }))

describe('Continue with Google', () => {
  it('is only offered in the browser build for now', () => {
    expect(googleAvailable('ios')).toBe(false)
    expect(googleAvailable('android')).toBe(false)
  })

  it('spots browsers inside other apps, where Google refuses to sign in', () => {
    expect(isInAppBrowser('Mozilla/5.0 (Linux; Android 14; wv) WhatsApp')).toBe(true)
    expect(isInAppBrowser('Mozilla/5.0 (iPhone) Version/18.0 Mobile Safari/604.1')).toBe(false)
  })

  it('asks Google for an ID token only, with the account picker every time', () => {
    const url = new URL(googleSignInUrl({ state: 's1', nonce: 'n1', redirectUri: 'http://localhost:8081/auth/google' }))
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect(url.searchParams.get('response_type')).toBe('id_token')
    expect(url.searchParams.get('prompt')).toBe('select_account')
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:8081/auth/google')
  })

  it('hands back the token and our nonce when the state matches, once', () => {
    asked()
    expect(takeGoogleReturn('#state=s1&id_token=tok')).toEqual({ credential: 'tok', nonce: 'n1' })
    expect(takeGoogleReturn('#state=s1&id_token=tok')).toEqual({ error: 'stale' })
  })

  it('refuses another state, an old request, and answers it never asked for', () => {
    asked()
    expect(takeGoogleReturn('#state=s2&id_token=tok')).toEqual({ error: 'stale' })
    asked(Date.now() - 11 * 60 * 1000)
    expect(takeGoogleReturn('#state=s1&id_token=tok')).toEqual({ error: 'stale' })
    expect(takeGoogleReturn('#state=s1&id_token=tok')).toEqual({ error: 'stale' })
  })

  it('tells a closed picker apart from a failure', () => {
    asked()
    expect(takeGoogleReturn('#error=access_denied&state=s1')).toEqual({ error: 'cancelled' })
    asked()
    expect(takeGoogleReturn('#error=server_error')).toEqual({ error: 'failed' })
  })
})

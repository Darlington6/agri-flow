import { afterEach, describe, expect, it, vi } from 'vitest'
import { googleSignInUrl, isInAppBrowser, takeGoogleReturn } from './google'

const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

describe('isInAppBrowser', () => {
  it('lets real browsers show the Google button', () => {
    expect(isInAppBrowser(CHROME_ANDROID)).toBe(false)
    expect(isInAppBrowser(SAFARI_IPHONE)).toBe(false)
  })

  it.each([
    ['Android WebView (WhatsApp and others)', CHROME_ANDROID.replace('Pixel 8)', 'Pixel 8; wv)')],
    ['Facebook', `${SAFARI_IPHONE} [FBAN/FBIOS;FBAV/480.0]`],
    ['Instagram', `${CHROME_ANDROID} Instagram 350.0`],
    ['WhatsApp on iPhone', `${SAFARI_IPHONE} WhatsApp/24.1`],
  ])('spots %s', (_name, userAgent) => {
    expect(isInAppBrowser(userAgent)).toBe(true)
  })
})

describe('googleSignInUrl', () => {
  it('asks Google for an ID token only, with the account picker every time', () => {
    const url = new URL(googleSignInUrl({ state: 's1', nonce: 'n1', redirectUri: 'https://app.example/auth/google' }))
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: expect.stringMatching(/\.apps\.googleusercontent\.com$/),
      redirect_uri: 'https://app.example/auth/google',
      response_type: 'id_token',
      scope: 'openid email profile',
      state: 's1',
      nonce: 'n1',
      prompt: 'select_account',
    })
  })
})

describe('takeGoogleReturn', () => {
  const KEY = 'agriflow.google-sign-in'
  const asked = (at = Date.now()) => sessionStorage.setItem(KEY, JSON.stringify({ state: 's1', nonce: 'n1', at }))
  afterEach(() => {
    sessionStorage.clear()
    vi.useRealTimers()
  })

  it('hands back the token and our nonce when the state matches, once', () => {
    asked()
    expect(takeGoogleReturn('#state=s1&id_token=tok')).toEqual({ credential: 'tok', nonce: 'n1' })
    expect(takeGoogleReturn('#state=s1&id_token=tok')).toEqual({ error: 'stale' })
  })

  it.each([
    ['another state', '#state=s2&id_token=tok'],
    ['no state', '#id_token=tok'],
  ])('refuses %s', (_name, fragment) => {
    asked()
    expect(takeGoogleReturn(fragment)).toEqual({ error: 'stale' })
  })

  it('refuses an answer this tab never asked for', () => {
    expect(takeGoogleReturn('#state=s1&id_token=tok')).toEqual({ error: 'stale' })
  })

  it('refuses a request older than ten minutes', () => {
    asked(Date.now() - 11 * 60 * 1000)
    expect(takeGoogleReturn('#state=s1&id_token=tok')).toEqual({ error: 'stale' })
  })

  it('tells a closed picker apart from a failure', () => {
    asked()
    expect(takeGoogleReturn('#error=access_denied&state=s1')).toEqual({ error: 'cancelled' })
    asked()
    expect(takeGoogleReturn('#error=server_error&state=s1')).toEqual({ error: 'failed' })
    asked()
    expect(takeGoogleReturn('')).toEqual({ error: 'failed' })
  })

  it('copes with unreadable saved data', () => {
    sessionStorage.setItem(KEY, '{not json')
    expect(takeGoogleReturn('#state=s1&id_token=tok')).toEqual({ error: 'stale' })
  })
})

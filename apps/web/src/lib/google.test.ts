import { describe, expect, it } from 'vitest'
import { isInAppBrowser } from './google'

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

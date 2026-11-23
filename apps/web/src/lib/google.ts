// "Continue with Google", using Google's own sign-in button (Google Identity
// Services). The button hands us an ID token; the API checks it with Google
// and signs the person in (see apps/api/apps/identity/google.py).

/** The Google OAuth client for the web app. Public, not a secret. */
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '725235480256-at4gqeelol3iqgdat4ae1h3vvf3mhs5j.apps.googleusercontent.com'

const SCRIPT_URL = 'https://accounts.google.com/gsi/client'

interface GoogleButtonOptions {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
  locale?: string
}

export interface GoogleIdentity {
  initialize: (config: {
    client_id: string
    callback: (response: { credential: string }) => void
    ux_mode?: 'popup' | 'redirect'
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    use_fedcm_for_button?: boolean
  }) => void
  renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void
  disableAutoSelect: () => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } }
  }
}

let loading: Promise<GoogleIdentity> | null = null

/** Loads Google's script once, only on the pages that show the button. */
export function loadGoogle(): Promise<GoogleIdentity> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id)
  loading ??= new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () =>
      window.google?.accounts?.id
        ? resolve(window.google.accounts.id)
        : reject(new Error('Google sign-in failed to start'))
    script.onerror = () => {
      loading = null // let a later visit try again
      script.remove()
      reject(new Error("Couldn't reach Google"))
    }
    document.head.appendChild(script)
  })
  return loading
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

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'
import { GOOGLE_CLIENT_ID, isInAppBrowser, loadGoogle } from '@/lib/google'

/**
 * Google's own "Continue with Google" button (their branding rules ask for
 * it). It loads Google's script only when shown, fits the width it's given,
 * and keeps Google's white button on both themes. Inside apps' built-in browsers, where
 * Google won't sign anyone in, it says how to open the page in a real browser.
 */
export function GoogleButton({
  onCredential,
  before,
}: {
  onCredential: (credential: string) => void
  /** Shown above only while there's a button or hint, e.g. an "Or" divider. */
  before?: ReactNode
}) {
  const slot = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const [inApp] = useState(() => isInAppBrowser())
  // The latest callback, without re-drawing the button when it changes.
  const callback = useRef(onCredential)
  useEffect(() => {
    callback.current = onCredential
  }, [onCredential])

  useEffect(() => {
    if (inApp || !GOOGLE_CLIENT_ID) return
    let current = true
    loadGoogle()
      .then((google) => {
        if (!current || !slot.current) return
        google.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => callback.current(credential),
          ux_mode: 'popup',
          use_fedcm_for_button: true,
        })
        google.renderButton(slot.current, {
          type: 'standard',
          // The white outline button on both themes: Google's black one draws as a
          // square-cornered box on our charcoal cards, unlike every other button.
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'center',
          // The app is in English for now; Google would otherwise follow the browser's language.
          locale: 'en',
          // Google draws 200–400px wide; fill the card up to that.
          width: Math.max(200, Math.min(400, Math.floor(slot.current.getBoundingClientRect().width))),
        })
      })
      .catch(() => current && setFailed(true))
    return () => {
      current = false
    }
  }, [inApp])

  if (!GOOGLE_CLIENT_ID || failed) return null

  if (inApp) {
    return (
      <>
        {before}
        <p className="flex items-start gap-2 rounded-xl bg-ink-50 p-3 text-xs text-ink-700">
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            To continue with Google, open this page in your browser (Chrome or Safari): use the menu (⋮ or ···) and
            choose “Open in browser”. Email and phone work here.
          </span>
        </p>
      </>
    )
  }

  // Google fills this in; the fixed height stops the form jumping when it does.
  return (
    <>
      {before}
      {/* Google's button is a light-scheme frame: on our dark theme a browser would paint
          the frame's whole box dark behind the pill unless this area is light-scheme too. */}
      <div ref={slot} className="flex h-11 w-full justify-center [color-scheme:light]" data-testid="google-button" />
    </>
  )
}

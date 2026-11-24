import { useEffect, useState, type ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui'
import { GOOGLE_CLIENT_ID, isInAppBrowser, startGoogleSignIn } from '@/lib/google'
import { GoogleLogo } from './GoogleLogo'

/**
 * "Continue with Google": our own button, the same size and look as the
 * other sign-in buttons, so it's there at once and never shows a Google
 * account before anyone asks. Tapping it goes to Google's account picker;
 * Google sends people back to /auth/google (GoogleReturnPage). Inside apps'
 * built-in browsers, where Google won't sign anyone in, it says how to open
 * the page in a real browser instead.
 */
export function GoogleButton({
  before,
}: {
  /** Shown above the button or hint, e.g. an "Or" divider. */ before?: ReactNode
}) {
  const [inApp] = useState(() => isInAppBrowser())
  const [leaving, setLeaving] = useState(false)

  // Coming back with the browser's Back button can restore this page as it was
  // left ("Opening Google…"); make the button usable again.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => event.persisted && setLeaving(false)
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])

  if (!GOOGLE_CLIENT_ID) return null

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

  return (
    <>
      {before}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={leaving}
        aria-busy={leaving || undefined}
        onClick={() => {
          setLeaving(true)
          startGoogleSignIn()
        }}
      >
        <GoogleLogo className="h-[18px] w-[18px]" />
        {leaving ? 'Opening Google…' : 'Continue with Google'}
      </Button>
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ApiError, type AuthUser } from '@/lib/apiClient'
import { takeGoogleReturn } from '@/lib/google'
import { landingFor } from '@/lib/onboarding'
import { Card } from '@/components/ui'

const MESSAGES = {
  stale: 'That Google sign-in had expired. Try again.',
  failed: "Google sign-in didn't work. Try again.",
} as const

type Outcome = { user: AuthUser } | { error: string | null }

/**
 * Where Google sends people back after its account picker (/auth/google).
 * Takes the ID token out of the address straight away, has the API check
 * it, then goes on to account setup or the account's home. If anything
 * went wrong it goes back to sign-in and says why there; if the person
 * just closed Google's picker, back to sign-in without a message.
 */
export function GoogleReturnPage() {
  const { signInWithGoogle } = useAuth()
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  // Once only: the request's state and nonce are used up on the first read
  // (and React's StrictMode runs effects twice in development).
  const taken = useRef(false)

  useEffect(() => {
    if (taken.current) return
    taken.current = true
    const answer = takeGoogleReturn(window.location.hash)
    // Out of the address bar and history: nothing else should see the token.
    window.history.replaceState(window.history.state, '', window.location.pathname)

    const outcome: Promise<Outcome> =
      'error' in answer
        ? Promise.resolve({ error: answer.error === 'cancelled' ? null : MESSAGES[answer.error] })
        : signInWithGoogle(answer.credential, answer.nonce).then(
            (user) => ({ user }),
            (err) => ({ error: err instanceof ApiError ? err.message : MESSAGES.failed }),
          )
    void outcome.then(setOutcome)
  }, [signInWithGoogle])

  if (outcome && 'user' in outcome) return <Navigate to={landingFor(outcome.user)} replace />
  if (outcome) return <Navigate to="/signin" replace state={outcome.error ? { googleError: outcome.error } : null} />

  return (
    <div className="flex min-h-svh items-center justify-center bg-canvas px-4 py-12">
      <Card className="w-full max-w-sm text-center">
        <p role="status" className="text-sm text-ink-600">
          Signing you in with Google…
        </p>
      </Card>
    </div>
  )
}

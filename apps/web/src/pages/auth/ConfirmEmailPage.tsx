import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/apiClient'
import { Card, DemoTag } from '@/components/ui'

// Where the "confirm your email" link lands (see apps/api's
// FRONTEND_URL/confirm-email). Works whether or not this browser is
// signed in: the link itself says which account asked.
export function ConfirmEmailPage() {
  const [params] = useSearchParams()
  const { user, confirmEmail } = useAuth()
  const [status, setStatus] = useState<'confirming' | 'done' | 'error'>('confirming')
  const [message, setMessage] = useState<string | null>(null)

  const token = params.get('token')
  // Single-use token: run once, even under StrictMode's double effects.
  const attempted = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('This link is missing its code.')
      return
    }
    if (attempted.current) return
    attempted.current = true

    confirmEmail(token)
      .then((email) => {
        setStatus('done')
        setMessage(email)
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err instanceof ApiError ? err.message : 'Something went wrong.')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const next = user ? { href: '/account', label: 'Go to your account' } : { href: '/signin', label: 'Sign in' }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-ink-50 px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <DemoTag />
      </div>
      <Card className="w-full max-w-sm text-center">
        {status === 'confirming' && <p className="text-sm text-ink-500">Confirming your email…</p>}
        {status === 'done' && (
          <>
            <h1 className="font-display text-base font-semibold text-ink-900">Email added</h1>
            <p className="mt-2 break-all text-sm text-ink-500">
              You can now sign in with {message} as well as your phone number.
            </p>
          </>
        )}
        {status === 'error' && <p className="text-sm text-status-risk">{message}</p>}
        {status !== 'confirming' && (
          <a href={next.href} className="mt-4 inline-block text-sm text-primary-700 hover:underline">
            {next.label}
          </a>
        )}
      </Card>
    </div>
  )
}

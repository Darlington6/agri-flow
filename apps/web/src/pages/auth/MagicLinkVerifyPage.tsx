import { useEffect, useRef, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/apiClient'
import { Card, DemoTag } from '@/components/ui'

// The redirect target the magic-link email points at (see
// apps/api's FRONTEND_URL setting) — reads the token from the URL,
// calls the API to verify it, then hands off to /account.
export function MagicLinkVerifyPage() {
  const [params] = useSearchParams()
  const { verifyMagicLink } = useAuth()
  const [status, setStatus] = useState<'verifying' | 'done' | 'error'>('verifying')
  const [error, setError] = useState<string | null>(null)

  const token = params.get('token')
  // The token is single-use server-side — a plain effect fires twice
  // under StrictMode (and could on any remount), burning it on a wasted
  // second call. Guard with a ref so it only ever actually runs once.
  const attempted = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Missing token.')
      return
    }
    if (attempted.current) return
    attempted.current = true

    verifyMagicLink(token)
      .then(() => setStatus('done'))
      .catch((err) => {
        setStatus('error')
        setError(err instanceof ApiError ? err.message : 'Something went wrong.')
      })
    // Only ever run once per token, regardless of verifyMagicLink identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (status === 'done') return <Navigate to="/account" replace />

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-ink-50 px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <DemoTag />
      </div>
      <Card className="w-full max-w-sm text-center">
        {status === 'verifying' && <p className="text-sm text-ink-500">Signing you in…</p>}
        {status === 'error' && (
          <>
            <p className="text-sm text-status-risk">{error}</p>
            <a href="/signin" className="mt-3 inline-block text-sm text-brand-700 hover:underline">
              Back to sign in
            </a>
          </>
        )}
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/apiClient'
import { brand } from '@/config/brand'
import { Button, Card, DemoTag, Field, inputClass } from '@/components/ui'

type Step = 'phone' | 'code' | 'email' | 'email-sent'

export function SignInPage() {
  const { user, requestOtp, verifyOtp, requestMagicLink } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [debugCode, setDebugCode] = useState<string | null>(null)
  const [debugLink, setDebugLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/account" replace />

  async function handleRequestMagicLink(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { debugLink } = await requestMagicLink(email)
      setDebugLink(debugLink ?? null)
      setStep('email-sent')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRequestCode(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { debugCode: code } = await requestOtp(phoneNumber)
      setDebugCode(code ?? null)
      setStep('code')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await verifyOtp(phoneNumber, code)
      navigate('/account')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-ink-50 px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white">
          <Leaf className="h-6 w-6" />
        </span>
        <h1 className="font-display text-2xl font-semibold text-ink-900">{brand.name}</h1>
        <DemoTag />
      </div>

      <Card className="w-full max-w-sm">
        {step === 'phone' && (
          <form className="flex flex-col gap-4" onSubmit={handleRequestCode}>
            <div>
              <h2 className="font-display text-base font-semibold text-ink-900">Sign in with your phone</h2>
              <p className="mt-1 text-sm text-ink-500">We'll text you a 6-digit code.</p>
            </div>
            <Field label="Phone number">
              <input
                className={inputClass}
                type="tel"
                required
                placeholder="+233241234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </Field>
            {error && <p className="text-sm text-status-risk">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send code'}
            </Button>
            <button
              type="button"
              className="text-xs text-ink-500 hover:text-ink-700"
              onClick={() => setStep('email')}
            >
              Sign in with email instead
            </button>
          </form>
        )}

        {step === 'email' && (
          <form className="flex flex-col gap-4" onSubmit={handleRequestMagicLink}>
            <div>
              <h2 className="font-display text-base font-semibold text-ink-900">Sign in with email</h2>
              <p className="mt-1 text-sm text-ink-500">
                We'll send a sign-in link — this only works if an account already has this email on file.
              </p>
            </div>
            <Field label="Email">
              <input
                className={inputClass}
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            {error && <p className="text-sm text-status-risk">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send link'}
            </Button>
            <button
              type="button"
              className="text-xs text-ink-500 hover:text-ink-700"
              onClick={() => setStep('phone')}
            >
              Use my phone instead
            </button>
          </form>
        )}

        {step === 'email-sent' && (
          <div className="flex flex-col gap-3 text-center">
            <h2 className="font-display text-base font-semibold text-ink-900">Check your email</h2>
            <p className="text-sm text-ink-500">
              If {email} has an account, a sign-in link is on its way.
            </p>
            {debugLink && (
              <a
                href={debugLink}
                className="mt-2 rounded-lg bg-status-info-bg px-3 py-2 text-xs text-status-info hover:underline"
              >
                Dev mode — click here to sign in (never shown outside DEBUG)
              </a>
            )}
          </div>
        )}

        {step === 'code' && (
          <form className="flex flex-col gap-4" onSubmit={handleVerifyCode}>
            <div>
              <h2 className="font-display text-base font-semibold text-ink-900">Enter the code</h2>
              <p className="mt-1 text-sm text-ink-500">Sent to {phoneNumber}.</p>
              {debugCode && (
                <p className="mt-2 rounded-lg bg-status-info-bg px-3 py-2 text-xs text-status-info">
                  Dev mode — code is {debugCode} (never shown outside DEBUG).
                </p>
              )}
            </div>
            <Field label="6-digit code">
              <input
                className={inputClass}
                inputMode="numeric"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
            {error && <p className="text-sm text-status-risk">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? 'Verifying…' : 'Verify'}
            </Button>
            <button
              type="button"
              className="text-xs text-ink-500 hover:text-ink-700"
              onClick={() => setStep('phone')}
            >
              Use a different number
            </button>
          </form>
        )}
      </Card>

      <p className="mt-8 text-xs text-ink-400">
        Exploring the platform instead?{' '}
        <a href="/login" className="text-brand-700 hover:underline">
          Use a demo role
        </a>
        .
      </p>
    </div>
  )
}

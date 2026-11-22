import { useState } from 'react'
import { ArrowLeft, Mail, Smartphone } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { LogoMark } from '@/components/brand/LogoMark'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/apiClient'
import { brand } from '@/config/brand'
import { Button, Card, DemoTag, Field, inputClass, OrDivider } from '@/components/ui'

type Step = 'phone' | 'code' | 'email' | 'email-sent'

export function SignInPage() {
  const { user, requestOtp, verifyOtp, requestMagicLink } = useAuth()
  const navigate = useNavigate()

  // Email first: phone codes need an SMS provider, which staging and
  // production don't have yet. Phone stays one tap away.
  const [step, setStep] = useState<Step>('email')
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
    <div className="flex min-h-svh flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <LogoMark className="h-14" />
        <h1 className="font-display text-2xl font-semibold text-ink-900">{brand.name}</h1>
        <DemoTag />
      </div>

      <Card className="w-full max-w-sm">
        {step === 'phone' && (
          <form className="flex flex-col gap-4" onSubmit={handleRequestCode}>
            <div>
              <h2 className="font-display text-base font-semibold text-ink-900">Sign in with your phone</h2>
              <p className="mt-1 text-sm text-ink-600">
                We'll text you a 6-digit code. New here? The code creates your account.
              </p>
            </div>
            <Field label="Phone number">
              <input
                className={inputClass}
                type="tel"
                required
                placeholder="+250788123456"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </Field>
            {error && <p className="text-sm text-status-risk">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send code'}
            </Button>
            <OrDivider />
            <Button type="button" variant="outline" className="w-full" onClick={() => setStep('email')}>
              <Mail className="h-4 w-4" aria-hidden />
              Use email instead
            </Button>
          </form>
        )}

        {step === 'email' && (
          <form className="flex flex-col gap-4" onSubmit={handleRequestMagicLink}>
            <div>
              <h2 className="font-display text-base font-semibold text-ink-900">Sign in with email</h2>
              <p className="mt-1 text-sm text-ink-600">
                We'll email you a link. New here? The link creates your account.
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
            <OrDivider />
            <Button type="button" variant="outline" className="w-full" onClick={() => setStep('phone')}>
              <Smartphone className="h-4 w-4" aria-hidden />
              Use my phone instead
            </Button>
          </form>
        )}

        {step === 'email-sent' && (
          <div className="flex flex-col gap-3 text-center">
            <h2 className="font-display text-base font-semibold text-ink-900">Check your email</h2>
            <p className="text-sm text-ink-600">
              We've sent a link to {email}. It works once, for 15 minutes. Can't find it? Check your spam folder.
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
              <p className="mt-1 text-sm text-ink-600">Sent to {phoneNumber}.</p>
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
              className="inline-flex items-center justify-center gap-1 text-sm font-medium text-primary-700 underline-offset-4 hover:underline"
              onClick={() => setStep('phone')}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Use a different number
            </button>
          </form>
        )}
      </Card>

      <p className="mt-8 text-xs text-ink-600">
        Exploring the platform instead?{' '}
        <a href="/login" className="text-primary-700 hover:underline">
          Use a demo role
        </a>
        .
      </p>
    </div>
  )
}

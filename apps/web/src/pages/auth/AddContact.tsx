import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/apiClient'
import { Button, Field, inputClass } from '@/components/ui'

// Adding the second way to sign in from the account page. Nothing is saved
// until it's confirmed: a link emailed to the address, or a code texted to
// the number.

function message(err: unknown) {
  return err instanceof ApiError ? err.message : 'Something went wrong. Try again.'
}

export function AddEmail({ onDone }: { onDone: () => void }) {
  const { requestEmailAdd } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [debugLink, setDebugLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { debugLink } = await requestEmailAdd(email)
      setDebugLink(debugLink ?? null)
      setSent(true)
    } catch (err) {
      setError(message(err))
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-ink-50 p-3 text-sm text-ink-700">
        <p>
          We've sent a link to <strong className="break-all">{email}</strong>. Open it to add this email. It works once,
          for 15 minutes.
        </p>
        {debugLink && (
          <a href={debugLink} className="text-xs text-status-info hover:underline">
            Dev mode — click here to confirm (never shown outside DEBUG)
          </a>
        )}
        <button type="button" className="self-start text-xs text-ink-600 hover:text-ink-700" onClick={onDone}>
          Close
        </button>
      </div>
    )
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <Field label="Email">
        <input
          className={inputClass}
          type="email"
          required
          autoFocus
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      {error && <p className="text-sm text-status-risk">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? 'Sending…' : 'Send link'}
        </Button>
        <button type="button" className="text-xs text-ink-600 hover:text-ink-700" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}

export function AddPhone({ onDone }: { onDone: () => void }) {
  const { requestPhoneAdd, confirmPhoneAdd } = useAuth()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [debugCode, setDebugCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<void>) {
    setError(null)
    setBusy(true)
    try {
      await action()
    } catch (err) {
      setError(message(err))
    } finally {
      setBusy(false)
    }
  }

  function handleRequest(event: React.FormEvent) {
    event.preventDefault()
    void run(async () => {
      const { debugCode } = await requestPhoneAdd(phoneNumber)
      setDebugCode(debugCode ?? null)
      setCodeSent(true)
    })
  }

  function handleConfirm(event: React.FormEvent) {
    event.preventDefault()
    void run(async () => {
      await confirmPhoneAdd(phoneNumber, code)
      onDone()
    })
  }

  if (codeSent) {
    return (
      <form className="flex flex-col gap-3" onSubmit={handleConfirm}>
        <p className="text-sm text-ink-700">Enter the code we texted to {phoneNumber}.</p>
        {debugCode && (
          <p className="rounded-lg bg-status-info-bg px-3 py-2 text-xs text-status-info">
            Dev mode — code is {debugCode} (never shown outside DEBUG).
          </p>
        )}
        <Field label="6-digit code">
          <input
            className={inputClass}
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            autoFocus
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-status-risk">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? 'Confirming…' : 'Confirm'}
          </Button>
          <button type="button" className="text-xs text-ink-600 hover:text-ink-700" onClick={() => setCodeSent(false)}>
            Use a different number
          </button>
        </div>
      </form>
    )
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleRequest}>
      <Field label="Phone number">
        <input
          className={inputClass}
          type="tel"
          required
          autoFocus
          placeholder="+250788123456"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </Field>
      {error && <p className="text-sm text-status-risk">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? 'Sending…' : 'Send code'}
        </Button>
        <button type="button" className="text-xs text-ink-600 hover:text-ink-700" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  )
}

import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { LogoMark } from '@/components/brand/LogoMark'
import { Button, buttonClasses, Card, DemoTag, Field, inputClass } from '@/components/ui'
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher'
import { AddEmail, AddPhone } from './AddContact'

export function AccountPage() {
  const { user, loading, updateDisplayName, logout } = useAuth()
  const [displayName, setDisplayName] = useState(user?.display_name ?? '')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [adding, setAdding] = useState<'phone' | 'email' | null>(null)

  // user loads asynchronously (a fresh page load has no user yet until
  // the /me refetch resolves) — sync the draft field once it arrives,
  // since useState's initializer only runs once at mount.
  useEffect(() => {
    if (user) setDisplayName(user.display_name)
  }, [user])

  if (loading) return null
  if (!user) return <Navigate to="/signin" replace />

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setSaved(false)
    try {
      await updateDisplayName(displayName)
      setSaved(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center bg-canvas px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <Link
          to="/"
          aria-label="AgriFlow home"
          className="mb-1 rounded-lg focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
        >
          <LogoMark className="h-12" />
        </Link>
        <h1 className="font-display text-2xl font-semibold text-ink-900">Your account</h1>
        <DemoTag />
      </div>

      <Card className="w-full max-w-md">
        {/* You can sign in with either. Whichever you signed up without can be added here. */}
        <dl className="flex flex-col gap-3 text-sm">
          {(
            [
              ['phone', 'Phone', user.phone_number, 'Add phone number'],
              ['email', 'Email', user.email, 'Add email'],
            ] as const
          ).map(([kind, label, value, addLabel]) => (
            <div key={kind} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <dt className="text-ink-600">{label}</dt>
                <dd className="min-w-0 break-all text-ink-900">
                  {value ??
                    (adding === kind ? null : (
                      <Button variant="outline" size="sm" onClick={() => setAdding(kind)}>
                        {addLabel}
                      </Button>
                    ))}
                </dd>
              </div>
              {!value &&
                adding === kind &&
                (kind === 'phone' ? (
                  <AddPhone onDone={() => setAdding(null)} />
                ) : (
                  <AddEmail onDone={() => setAdding(null)} />
                ))}
            </div>
          ))}
        </dl>

        <form className="mt-6 flex flex-col gap-3 border-t border-ink-100 pt-6" onSubmit={handleSave}>
          <Field label="Display name">
            <input
              className={inputClass}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What should we call you?"
            />
          </Field>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
            {saved && <span className="text-xs text-status-good">Saved.</span>}
          </div>
        </form>

        <div className="mt-6 border-t border-ink-100 pt-6">
          <p className="text-xs font-medium tracking-wide text-ink-600 uppercase">Roles</p>
          {user.roles.length === 0 ? (
            <p className="mt-2 text-sm text-ink-600">None yet.</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <li key={role.slug} className="rounded-full bg-brand-50 px-3 py-1 text-xs text-accent">
                  {role.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 border-t border-ink-100 pt-6">
          <p className="text-xs font-medium tracking-wide text-ink-500 uppercase">Appearance</p>
          <ThemeSwitcher className="mt-3" />
        </div>

        <Button variant="outline" size="sm" className="mt-6" onClick={() => void logout()}>
          Sign out
        </Button>
      </Card>

      {user.roles.length === 0 && (
        // Real accounts have no role until farmer and buyer profiles exist,
        // so point people at the demo instead of leaving them here.
        <Card className="mt-4 w-full max-w-md">
          <h2 className="font-display text-lg font-semibold text-ink-900">What's next</h2>
          <p className="mt-2 text-sm text-ink-600">
            Farmer and buyer tools open up in your account as profiles arrive during the pilot. Until then, explore the
            platform with a demo role. It uses sample data, and your changes there are cleared when you reload.
          </p>
          <Link to="/login" className={buttonClasses('primary', 'md', 'mt-4 w-full sm:w-auto')}>
            Explore the platform
          </Link>
        </Card>
      )}
    </div>
  )
}

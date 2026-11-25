import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { AccountShell } from '@/components/layout/AccountShell'
import { RequireAccount } from '@/components/layout/RequireAccount'
import { Button, buttonClasses, Card, inputClass } from '@/components/ui'
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher'
import { ROLE_ICONS } from '@/components/onboarding/roleIcons'
import { RoleDetailsForm } from '@/components/onboarding/RoleDetailsForm'
import { VerificationBadge } from '@/components/onboarding/VerificationBadge'
import { ErrorText, LabelledField } from '@/components/onboarding/fields'
import {
  ApiError,
  getProfiles,
  getSetupOptions,
  updateProfile,
  type Language,
  type Profile,
  type SetupOptions,
} from '@/lib/apiClient'
import { LANGUAGES, ROLE_ORDER, ROLES, whoCanReachYou } from '@/lib/onboarding'
import { countryOptions } from '@/lib/phone'
import { AddEmail, AddPhone } from './AddContact'

export function AccountPage() {
  return (
    <RequireAccount>
      <Account />
    </RequireAccount>
  )
}

const sectionTitle = 'text-xs font-medium tracking-wide text-ink-600 uppercase'

function Account() {
  const { user, logout } = useAuth()
  const [adding, setAdding] = useState<'phone' | 'email' | null>(null)
  if (!user) return null

  return (
    <AccountShell title="Your account">
      <div className="flex w-full max-w-md flex-col gap-4">
        <Card>
          <h2 className={sectionTitle}>Sign in with</h2>
          {/* You can sign in with either. Whichever you signed up without can be added here. */}
          <dl className="mt-3 flex flex-col gap-3 text-sm">
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
          {!user.phone_number && adding !== 'phone' && (
            <p className="mt-3 rounded-xl bg-ink-50 p-3 text-xs text-ink-700">
              Add a phone number so {whoCanReachYou(user.roles.map((r) => r.slug))} can reach you, and to sign in by
              text message.
            </p>
          )}
        </Card>

        <AboutYou />
        <Roles />

        <Card>
          <h2 className={sectionTitle}>Appearance</h2>
          <ThemeSwitcher className="mt-3" />
        </Card>

        <Button variant="outline" className="self-center" onClick={() => void logout()}>
          Sign out
        </Button>
      </div>
    </AccountShell>
  )
}

/** Name, country and language. */
function AboutYou() {
  const { user, updateAccount } = useAuth()
  const [displayName, setDisplayName] = useState(user?.display_name ?? '')
  const [country, setCountry] = useState(user?.country ?? '')
  const [language, setLanguage] = useState<Language | ''>(user?.language ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const countries = useMemo(() => countryOptions(navigator.language), [])

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setSaved(false)
    setError(null)
    try {
      await updateAccount({ display_name: displayName, country, language })
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <h2 className={sectionTitle}>About you</h2>
      <form className="mt-3 flex flex-col gap-3" onSubmit={handleSave}>
        <LabelledField label="Display name">
          {(props) => (
            <input
              {...props}
              className={inputClass}
              required
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}
        </LabelledField>
        <div className="grid gap-3 sm:grid-cols-2">
          <LabelledField label="Country">
            {(props) => (
              <select
                {...props}
                className={inputClass}
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </LabelledField>
          <LabelledField label="Language">
            {(props) => (
              <select
                {...props}
                className={inputClass}
                required
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}
          </LabelledField>
        </div>
        {country !== user?.country && (
          <p className="text-xs text-ink-600">
            Your roles keep the places you chose. Check them below after changing country.
          </p>
        )}
        <ErrorText messages={error ? [error] : undefined} />
        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
          {saved && (
            <span role="status" className="text-xs text-status-good">
              Saved.
            </span>
          )}
        </div>
      </form>
    </Card>
  )
}

/** The roles chosen while setting up, each with its details to edit; and staff roles given by AgriFlow. */
function Roles() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[] | null>(null)
  const [options, setOptions] = useState<SetupOptions | null>(null)
  const [editing, setEditing] = useState<Profile['role'] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const country = user?.country ?? ''

  useEffect(() => {
    let current = true
    Promise.all([getProfiles(), getSetupOptions(country)])
      .then(([p, o]) => {
        if (!current) return
        setProfiles(p)
        setOptions(o)
      })
      .catch((err) => current && setError(err instanceof ApiError ? err.message : "Couldn't load your roles."))
    return () => {
      current = false
    }
  }, [country])

  const given = user?.roles.filter((r) => !(ROLE_ORDER as string[]).includes(r.slug)) ?? []

  return (
    <Card>
      <h2 className={sectionTitle}>Your roles</h2>
      {error && <ErrorText messages={[error]} />}
      {!error && (!profiles || !options) && <p className="mt-3 text-sm text-ink-600">Loading…</p>}
      {profiles && options && (
        <ul className="mt-3 flex flex-col divide-y divide-ink-100">
          {profiles.map((profile) => {
            const Icon = ROLE_ICONS[profile.role]
            return (
              <li key={profile.role} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-ink-900">
                    <Icon className="h-4 w-4 text-accent" aria-hidden />
                    {ROLES[profile.role].label}
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <VerificationBadge status={profile.verification} />
                    {editing !== profile.role && (
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Edit details for ${ROLES[profile.role].label}`}
                        onClick={() => setEditing(profile.role)}
                      >
                        Edit details
                      </Button>
                    )}
                  </span>
                </div>
                {editing === profile.role && (
                  <RoleDetailsForm
                    role={profile.role}
                    options={options}
                    initial={profile}
                    submitLabel="Save details"
                    onSubmit={async (details) => {
                      const updated = await updateProfile(profile.role, details)
                      setProfiles((list) => list?.map((p) => (p.role === updated.role ? updated : p)) ?? null)
                      setEditing(null)
                    }}
                    secondary={
                      <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                    }
                  />
                )}
              </li>
            )
          })}
          {given.map((role) => (
            <li key={role.slug} className="flex items-center justify-between gap-2 py-3 text-sm last:pb-0">
              <span className="font-medium text-ink-900">{role.name}</span>
              <span className="text-xs text-ink-600">Given by AgriFlow</span>
            </li>
          ))}
        </ul>
      )}
      {profiles && profiles.length < ROLE_ORDER.length && (
        <Link to="/add-role" className={buttonClasses('outline', 'sm', 'mt-4')}>
          <Plus className="h-4 w-4" aria-hidden />
          Add another role
        </Link>
      )}
    </Card>
  )
}

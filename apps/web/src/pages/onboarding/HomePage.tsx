import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Plus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { AccountShell } from '@/components/layout/AccountShell'
import { PageLoading } from '@/components/layout/PageLoading'
import { RequireAccount } from '@/components/layout/RequireAccount'
import { buttonClasses, Button, Card } from '@/components/ui'
import { ROLE_ICONS } from '@/components/onboarding/roleIcons'
import { VerificationBadge } from '@/components/onboarding/VerificationBadge'
import { ApiError, getProfiles, type Profile, type FarmerCooperative } from '@/lib/apiClient'
import { ROLE_ORDER, ROLES } from '@/lib/onboarding'

/**
 * A real account's home (/home). The platform's tools still run on sample
 * data in the demo, so this says plainly what each role gets and when,
 * rather than showing made-up numbers on a real account.
 */
export function HomePage() {
  return (
    <RequireAccount>
      <Home />
    </RequireAccount>
  )
}

function Home() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    getProfiles()
      .then((p) => current && setProfiles(p))
      .catch((err) => current && setError(err instanceof ApiError ? err.message : "Couldn't load your roles."))
    return () => {
      current = false
    }
  }, [attempt])

  const firstName = user?.display_name.split(' ')[0]
  const canAdd = profiles !== null && profiles.length < ROLE_ORDER.length

  return (
    <AccountShell title={firstName ? `Welcome, ${firstName}` : 'Welcome'}>
      <div className="flex w-full max-w-2xl flex-col gap-4">
        {error ? (
          <Card className="text-center">
            <p role="alert" className="text-sm text-status-risk">
              {error}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setError(null)
                setAttempt((a) => a + 1)
              }}
            >
              Try again
            </Button>
          </Card>
        ) : !profiles ? (
          <PageLoading />
        ) : profiles.length === 0 ? (
          // Staff accounts get their roles from the AgriFlow team, not here.
          <Card>
            <p className="text-sm text-ink-700">
              Your roles ({user?.roles.map((r) => r.name).join(', ') || 'none yet'}) are managed by the AgriFlow team.
            </p>
          </Card>
        ) : (
          profiles.map((profile) => {
            const Icon = ROLE_ICONS[profile.role]
            const info = ROLES[profile.role]
            return (
              <Card key={profile.role}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                      <Icon className="h-5 w-5 text-accent" aria-hidden />
                    </span>
                    <h2 className="font-display text-lg font-semibold text-ink-900">{info.label}</h2>
                  </div>
                  <VerificationBadge status={profile.verification} />
                </div>
                {profile.verification !== 'verified' && (
                  <p className="mt-3 text-sm text-ink-600">
                    Our team checks every new {info.label.toLowerCase()} before they can trade. We'll be in touch about
                    what we need.
                  </p>
                )}
                {profile.role === 'farmer' && profile.cooperative && (
                  <p className="mt-3 text-sm text-ink-700">{membershipLine(profile.cooperative)}</p>
                )}
                <h3 className="mt-5 flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink-600 uppercase">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  Coming during the pilot
                </h3>
                <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-ink-700">
                  {info.coming.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>
            )
          })
        )}

        <Card>
          <h2 className="font-display text-lg font-semibold text-ink-900">See it working</h2>
          <p className="mt-2 text-sm text-ink-600">
            Try the platform with sample data while your tools are being built. Nothing you do there touches your
            account.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link to="/login" className={buttonClasses('primary', 'md')}>
              Explore the demo
            </Link>
            {canAdd && (
              <Link to="/add-role" className={buttonClasses('outline', 'md')}>
                <Plus className="h-4 w-4" aria-hidden />
                Add another role
              </Link>
            )}
          </div>
        </Card>
      </div>
    </AccountShell>
  )
}

/** Where a farmer stands with the cooperative they chose. */
function membershipLine(cooperative: FarmerCooperative): string {
  if (cooperative.membership === 'confirmed') return `Member of ${cooperative.name}.`
  if (cooperative.membership === 'declined') return `${cooperative.name} didn’t confirm you as a member.`
  return `Waiting for ${cooperative.name} to confirm you’re a member.`
}

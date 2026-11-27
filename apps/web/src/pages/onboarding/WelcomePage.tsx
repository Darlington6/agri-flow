import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { PageLoading } from '@/components/layout/PageLoading'
import { Button, Card, DemoTag } from '@/components/ui'
import { OnboardingFlow, type OnboardingDriver } from '@/components/onboarding/OnboardingFlow'
import {
  ApiError,
  completeOnboarding,
  createProfile,
  getOnboarding,
  getPersonalDetails,
  getProfiles,
  getSetupOptions,
  savePersonalDetails,
  skipPhone,
  type AuthUser,
  type OnboardingState,
  type PersonalDetails,
  type Profile,
} from '@/lib/apiClient'

const STAFF_SLUGS = ['field_agent', 'platform_admin', 'super_admin']

/** The flow's start and saves, backed by the API. */
function apiDriver(
  user: AuthUser,
  state: OnboardingState,
  profiles: Profile[],
  personal: PersonalDetails,
  auth: ReturnType<typeof useAuth>,
): OnboardingDriver {
  return {
    start: {
      name: user.display_name,
      personal,
      country: user.country,
      language: user.language,
      roles: profiles.map((p) => p.role),
      staff: user.roles.some((r) => STAFF_SLUGS.includes(r.slug)),
      hasPhone: Boolean(user.phone_number),
      returning: Boolean(user.onboarded_at),
      next: state.next_step,
      termsVersion: state.terms_version,
    },
    loadOptions: getSetupOptions,
    async saveAbout(details, display_name) {
      await savePersonalDetails(details)
      await auth.updateAccount({ display_name })
    },
    savePlace: (country, language) => auth.updateAccount({ country, language }),
    async chooseRole(role, details) {
      await createProfile(role, details)
    },
    requestPhoneCode: auth.requestPhoneAdd,
    confirmPhone: auth.confirmPhoneAdd,
    async skipPhone() {
      await skipPhone()
    },
    async finish(termsVersion) {
      auth.replaceUser(await completeOnboarding(termsVersion))
    },
  }
}

/**
 * Setting up a new account (/welcome). Picks up at the first step not done
 * yet, so leaving halfway and coming back, on any device, carries on.
 */
export function WelcomePage() {
  const auth = useAuth()
  const { user, loading } = auth
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState<{
    state: OnboardingState
    profiles: Profile[]
    personal: PersonalDetails
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  // Set once they finish, so the redirect below goes home rather than the
  // flow reloading for an account that no longer needs it.
  const [finished, setFinished] = useState(false)
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    let current = true
    Promise.all([getOnboarding(), getProfiles(), getPersonalDetails()])
      .then(([state, profiles, personal]) => current && setLoaded({ state, profiles, personal }))
      .catch((err) => current && setError(err instanceof ApiError ? err.message : "Couldn't load your account."))
    return () => {
      current = false
    }
  }, [userId, attempt])

  if (loading) return <PageLoading fullScreen />
  if (!user) return <Navigate to="/signin" replace />
  if (!user.needs_onboarding && !finished) return <Navigate to="/home" replace />

  return (
    <AuthLayout photo="signIn">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          {user.onboarded_at ? 'Welcome back' : 'Welcome to AgriFlow'}
        </h1>
        {!user.onboarded_at && (
          <p className="max-w-sm text-sm text-ink-600">A few quick questions to set up your account.</p>
        )}
        <DemoTag />
      </div>

      {error ? (
        <Card className="w-full max-w-md text-center">
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
      ) : !loaded ? (
        <PageLoading />
      ) : (
        <OnboardingFlow
          driver={apiDriver(user, loaded.state, loaded.profiles, loaded.personal, auth)}
          onDone={() => {
            setFinished(true)
            navigate('/home', { replace: true })
          }}
        />
      )}

      <button
        type="button"
        className="mt-8 text-xs text-ink-600 underline-offset-4 hover:text-ink-800 hover:underline"
        onClick={() => void auth.logout()}
      >
        Not you? Sign out
      </button>
    </AuthLayout>
  )
}

import { useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Info } from 'lucide-react'
import { LogoMark } from '@/components/brand/LogoMark'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { OnboardingFlow, type OnboardingDriver } from '@/components/onboarding/OnboardingFlow'
import { useSession } from '@/context/SessionContext'
import { demoSetupOptions } from '@/data/setupOptions'
import { ApiError, type SelfServeRole } from '@/lib/apiClient'
import { DEMO_ROLE_FOR } from '@/lib/demoRoles'

const DEMO_CODE = '123456'
// A short wait, so each step feels like the real one saving.
const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 250))

/**
 * "See how sign-up works" (/try-sign-up): the real account setup screens,
 * with nothing saved or sent. Finishing opens the demo as the role chosen,
 * with that role's sample account.
 */
export function DemoSignUpPage() {
  const { login } = useSession()
  const navigate = useNavigate()
  const chosen = useRef<SelfServeRole>('farmer')

  const driver = useMemo<OnboardingDriver>(
    () => ({
      start: {
        name: '',
        country: '',
        language: '',
        roles: [],
        staff: false,
        hasPhone: false,
        returning: false,
        next: 'name',
        termsVersion: 'demo',
      },
      loadOptions: async (country) => demoSetupOptions(country),
      saveName: pause,
      savePlace: pause,
      async chooseRole(role) {
        chosen.current = role
        await pause()
      },
      async requestPhoneCode() {
        await pause()
        return { demoCode: DEMO_CODE }
      },
      async confirmPhone(_phone, code) {
        await pause()
        if (code.trim() !== DEMO_CODE) throw new ApiError('Incorrect code.', 400)
      },
      skipPhone: pause,
      finish: pause,
    }),
    [],
  )

  return (
    <AuthLayout photo="demo">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <Link
          to="/login"
          aria-label="Back to the demo roles"
          className="rounded-lg focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
        >
          <LogoMark className="h-12" />
        </Link>
        <h1 className="font-display text-2xl font-semibold text-ink-900">How signing up works</h1>
      </div>

      <OnboardingFlow
        driver={driver}
        intro={
          <p className="flex items-start gap-2 rounded-xl bg-status-info-bg p-3 text-xs text-status-info">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              A walkthrough of the real sign-up: nothing you enter is saved or sent. At the end, you'll explore a sample
              account for the role you choose.
            </span>
          </p>
        }
        onDone={() => {
          login(DEMO_ROLE_FOR[chosen.current])
          navigate('/dashboard', { replace: true })
        }}
      />

      <Link to="/login" className="mt-8 text-xs text-ink-600 underline-offset-4 hover:text-ink-800 hover:underline">
        Back to the demo roles
      </Link>
    </AuthLayout>
  )
}

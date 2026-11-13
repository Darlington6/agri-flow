import { Navigate, useNavigate } from 'react-router-dom'
import { ShieldCheck, ShoppingCart, Sprout, UserCheck, Truck, Crown } from 'lucide-react'
import { LogoMark } from '@/components/brand/LogoMark'
import { useSession } from '@/context/SessionContext'
import { brand } from '@/config/brand'
import { CardButton, DemoTag } from '@/components/ui'
import type { DemoRole } from '@/types'

const ROLES: { role: DemoRole; description: string; icon: typeof ShieldCheck }[] = [
  {
    role: 'Platform Admin',
    description: 'Full operational visibility across demand, farmers, contracts, climate and finance.',
    icon: ShieldCheck,
  },
  {
    role: 'Super Admin',
    description: 'Everything Platform Admin sees, plus platform revenue, take rate and network growth.',
    icon: Crown,
  },
  {
    role: 'Buyer',
    description: 'Track demand requests, contract fulfillment and delivery status.',
    icon: ShoppingCart,
  },
  {
    role: 'Farmer',
    description: 'View your contract, expected harvest, climate risk and payment history.',
    icon: Sprout,
  },
  {
    role: 'Field Agent',
    description: 'Monitor farmer production, climate-smart practices and field issues.',
    icon: UserCheck,
  },
  {
    role: 'Delivery Partner',
    description: 'Browse open delivery jobs and book the ones that fit your route.',
    icon: Truck,
  },
]

export function LoginPage() {
  const { session, login } = useSession()
  const navigate = useNavigate()

  if (session) return <Navigate to="/dashboard" replace />

  function handleSelect(role: DemoRole) {
    login(role)
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-ink-50 px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <LogoMark className="h-14" />
        <h1 className="font-display text-2xl font-semibold text-ink-900">{brand.name}</h1>
        <DemoTag />
        <p className="max-w-sm text-sm text-ink-500">
          Choose a demo role to explore the platform. No account or password required.
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map(({ role, description, icon: Icon }) => {
          const id = `role-${role.toLowerCase().replace(/\s+/g, '-')}`
          return (
            <CardButton key={role} onClick={() => handleSelect(role)} aria-labelledby={`${id}-name`} aria-describedby={`${id}-description`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden="true">
                <Icon className="h-5 w-5" />
              </span>
              <span id={`${id}-name`} className="mt-4 block font-display text-base font-semibold text-ink-900">
                {role}
              </span>
              <span id={`${id}-description`} className="mt-1 block text-sm text-ink-500">
                {description}
              </span>
            </CardButton>
          )
        })}
      </div>

      <p className="mt-8 text-xs text-ink-400">This is a prototype environment. All data shown is simulated.</p>
      <p className="mt-2 text-xs text-ink-400">
        Have a real account?{' '}
        <a href="/signin" className="text-primary-700 hover:underline">
          Sign in with your phone
        </a>
        .
      </p>
    </div>
  )
}

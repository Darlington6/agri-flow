import { Navigate, useNavigate } from 'react-router-dom'
import { Leaf, ShieldCheck, ShoppingCart, Sprout, UserCheck, Truck, Crown } from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import { brand } from '@/config/brand'
import { Card, DemoTag } from '@/components/ui'
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
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white">
          <Leaf className="h-6 w-6" />
        </span>
        <h1 className="font-display text-2xl font-semibold text-ink-900">{brand.name}</h1>
        <DemoTag />
        <p className="max-w-sm text-sm text-ink-500">
          Choose a demo role to explore the platform. No account or password required.
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map(({ role, description, icon: Icon }) => (
          <Card
            key={role}
            hoverable
            className="cursor-pointer text-left transition-transform hover:-translate-y-0.5"
            onClick={() => handleSelect(role)}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-base font-semibold text-ink-900">{role}</p>
            <p className="mt-1 text-sm text-ink-500">{description}</p>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-xs text-ink-400">This is a prototype environment. All data shown is simulated.</p>
      <p className="mt-2 text-xs text-ink-400">
        Have a real account?{' '}
        <a href="/signin" className="text-brand-700 hover:underline">
          Sign in with your phone
        </a>
        .
      </p>
    </div>
  )
}

import { ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX } from 'lucide-react'
import { Badge } from '@/components/ui'
import type { Verification } from '@/lib/apiClient'
import { VERIFICATION_LABEL } from '@/lib/onboarding'

const TONE = { unverified: 'neutral', pending: 'warn', verified: 'good', rejected: 'risk' } as const
const ICON = { unverified: ShieldAlert, pending: ShieldQuestion, verified: ShieldCheck, rejected: ShieldX } as const

/** Whether AgriFlow has checked a profile: the same colours as the demo's KYC badges. */
export function VerificationBadge({ status }: { status: Verification }) {
  const Icon = ICON[status]
  return (
    <Badge tone={TONE[status]}>
      <Icon className="h-3 w-3" aria-hidden />
      {VERIFICATION_LABEL[status]}
    </Badge>
  )
}

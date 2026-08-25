import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react'
import { Badge } from './Badge'
import type { KycStatus } from '@/types'

const KYC_TONE = { Verified: 'good', Pending: 'warn', Unverified: 'neutral' } as const
const KYC_ICON = { Verified: ShieldCheck, Pending: ShieldQuestion, Unverified: ShieldAlert } as const

export function KycBadge({ status, className }: { status: KycStatus; className?: string }) {
  const Icon = KYC_ICON[status]
  return (
    <Badge tone={KYC_TONE[status]} className={className}>
      <Icon className="h-3 w-3" />
      {status === 'Verified' ? 'KYC Verified' : status === 'Pending' ? 'KYC Pending' : 'KYC Unverified'}
    </Badge>
  )
}

import { CheckCircle2, XCircle, UserPlus } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { usePlatformData } from '@/context/PlatformDataContext'
import { farmerById } from '@/data'
import { formatDate } from '@/lib/date'
import { formatTonnes } from '@/lib/format'

export function MatchRequestsPanel({ contractId }: { contractId: string }) {
  const { matchRequests, confirmMatchRequest, declineMatchRequest } = usePlatformData()
  const pending = matchRequests.filter((m) => m.contractId === contractId && m.status === 'Pending')
  const decided = matchRequests.filter((m) => m.contractId === contractId && m.status !== 'Pending')

  if (pending.length === 0 && decided.length === 0) return null

  return (
    <Card>
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-ink-500" />
        <h2 className="font-display text-sm font-semibold text-ink-700">Farmer Supply Requests</h2>
      </div>
      <p className="mt-1 text-xs text-ink-500">Farmers offering to fulfill part of this contract's remaining volume.</p>

      <div className="mt-4 flex flex-col divide-y divide-ink-50">
        {pending.map((m) => {
          const farmer = farmerById(m.farmerId)
          return (
            <div key={m.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink-800">{farmer?.name ?? m.farmerId}</p>
                  <p className="text-xs text-ink-400">
                    {farmer?.community}, {farmer?.region} · offering {formatTonnes(m.proposedQuantityTonnes)} · {formatDate(m.createdAt)}
                  </p>
                  {m.message && <p className="mt-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs text-ink-600">{m.message}</p>}
                </div>
                <Badge tone="warn">Pending</Badge>
              </div>
              <div className="mt-2.5 flex gap-2">
                <Button size="sm" onClick={() => confirmMatchRequest(m.id)}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Confirm
                </Button>
                <Button size="sm" variant="outline" onClick={() => declineMatchRequest(m.id)}>
                  <XCircle className="h-3.5 w-3.5" />
                  Decline
                </Button>
              </div>
            </div>
          )
        })}

        {decided.map((m) => {
          const farmer = farmerById(m.farmerId)
          return (
            <div key={m.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm text-ink-700">{farmer?.name ?? m.farmerId}</p>
                <p className="text-xs text-ink-400">{formatTonnes(m.proposedQuantityTonnes)} · {m.decidedAt ? formatDate(m.decidedAt) : ''}</p>
              </div>
              <Badge tone={m.status === 'Confirmed' ? 'good' : 'neutral'}>{m.status}</Badge>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

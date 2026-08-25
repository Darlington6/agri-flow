import { Truck, Star } from 'lucide-react'
import { Card, Badge, inputClass } from '@/components/ui'
import { usePlatformData } from '@/context/PlatformDataContext'
import { useSession } from '@/context/SessionContext'
import { isAdminRole } from '@/lib/permissions'
import { rankPartnersForJob } from '@/lib/deliveryScore'
import { deliveryPartners, deliveryPartnerById } from '@/data'
import { formatDate } from '@/lib/date'
import { formatGHSFull, formatTonnes } from '@/lib/format'
import type { DeliveryJobStatus } from '@/types'

const STATUS_TONE = {
  Unassigned: 'neutral',
  Assigned: 'info',
  'In Transit': 'warn',
  Delivered: 'good',
} as const

const NEXT_STATUS: Partial<Record<DeliveryJobStatus, DeliveryJobStatus>> = {
  Assigned: 'In Transit',
  'In Transit': 'Delivered',
}

export function DeliveryCard({ contractId }: { contractId: string }) {
  const { session } = useSession()
  const { deliveryJobs, assignDeliveryPartner, setDeliveryStatus } = usePlatformData()
  const job = deliveryJobs.find((j) => j.contractId === contractId)
  const canOverride = isAdminRole(session?.role)

  if (!job) return null
  const partner = job.partnerId ? deliveryPartnerById(job.partnerId) : undefined
  const nextStatus = NEXT_STATUS[job.status]
  const recommended = job.status === 'Unassigned' ? rankPartnersForJob(job, deliveryPartners).slice(0, 3) : []

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-ink-500" />
        <h2 className="font-display text-sm font-semibold text-ink-700">Delivery</h2>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-ink-700">
          {formatTonnes(job.quantityTonnes)} · {job.fromLocation} → {job.toLocation}
        </p>
        <Badge tone={STATUS_TONE[job.status]}>{job.status}</Badge>
      </div>
      <p className="mt-1 text-xs text-ink-400">Scheduled {formatDate(job.scheduledDate)} · Fee {formatGHSFull(job.feeGHS)}</p>

      {partner ? (
        <p className="mt-3 text-sm text-ink-700">
          Booked by <span className="font-medium">{partner.name}</span> · {partner.vehicleType}
        </p>
      ) : (
        <>
          <p className="mt-3 text-xs text-ink-400">
            Not yet booked — posted to the delivery job board for partners to claim.
          </p>
          {recommended.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              {recommended.map(({ partner: p, score }) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs">
                  <span className="text-ink-700">{p.name}</span>
                  <span className="flex items-center gap-2 text-ink-400">
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-current text-status-warn" />
                      {p.rating.toFixed(1)}
                    </span>
                    <span>fit {score}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {canOverride && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {!partner && (
            <select
              className={inputClass}
              style={{ width: 220 }}
              defaultValue=""
              onChange={(e) => e.target.value && assignDeliveryPartner(job.id, e.target.value)}
            >
              <option value="" disabled>
                Assign manually (override)…
              </option>
              {deliveryPartners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.vehicleType})
                </option>
              ))}
            </select>
          )}
          {nextStatus && (
            <button
              onClick={() => setDeliveryStatus(job.id, nextStatus)}
              className="rounded-xl border border-ink-200 px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-50"
            >
              Mark {nextStatus}
            </button>
          )}
        </div>
      )}
    </Card>
  )
}

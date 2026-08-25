import { Truck } from 'lucide-react'
import { Card, Badge, inputClass } from '@/components/ui'
import { usePlatformData } from '@/context/PlatformDataContext'
import { rankPartnersForJob } from '@/lib/deliveryScore'
import { deliveryPartners, deliveryPartnerById, cropById } from '@/data'
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

export function DeliveryCoordination() {
  const { deliveryJobs, assignDeliveryPartner, setDeliveryStatus } = usePlatformData()
  const totalCommission = deliveryJobs
    .filter((j) => j.status === 'Assigned' || j.status === 'In Transit' || j.status === 'Delivered')
    .reduce((s, j) => s + j.commissionGHS, 0)

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-ink-500" />
        <h2 className="font-display text-sm font-semibold text-ink-700">Delivery Coordination</h2>
      </div>
      <p className="mt-1 text-xs text-ink-500">
        Open jobs are on the delivery partners' job board to book directly. Commission earned to date: {formatGHSFull(totalCommission)}
      </p>

      <div className="mt-4 flex flex-col divide-y divide-ink-50">
        {deliveryJobs.map((job) => {
          const partner = job.partnerId ? deliveryPartnerById(job.partnerId) : undefined
          const nextStatus = NEXT_STATUS[job.status]
          const bestMatch = job.status === 'Unassigned' ? rankPartnersForJob(job, deliveryPartners)[0] : undefined
          return (
            <div key={job.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink-800">
                    {cropById(job.cropId)?.name} · {formatTonnes(job.quantityTonnes)}
                  </p>
                  <p className="text-xs text-ink-400">
                    {job.fromLocation} → {job.toLocation} · {formatDate(job.scheduledDate)}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[job.status]}>{job.status}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {partner ? (
                  <span className="text-xs text-ink-600">
                    {partner.name} · fee {formatGHSFull(job.feeGHS)} · commission {formatGHSFull(job.commissionGHS)}
                  </span>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {bestMatch && (
                      <span className="text-xs text-ink-400">Best match: {bestMatch.partner.name}</span>
                    )}
                    <select
                      className={inputClass}
                      style={{ width: 220, height: 32 }}
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
                  </div>
                )}
                {nextStatus && (
                  <button
                    onClick={() => setDeliveryStatus(job.id, nextStatus)}
                    className="rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
                  >
                    Mark {nextStatus}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

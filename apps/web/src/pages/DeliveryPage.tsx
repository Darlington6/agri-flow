import { Truck, Star, MapPin, CheckCircle2 } from 'lucide-react'
import { PageHeader, Card, StatCard, Badge, Button } from '@/components/ui'
import { useSession } from '@/context/SessionContext'
import { usePlatformData } from '@/context/PlatformDataContext'
import { currentDeliveryPartner } from '@/lib/scope'
import { rankJobsForPartner } from '@/lib/deliveryScore'
import { cropById } from '@/data'
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

export function DeliveryPage() {
  const { session } = useSession()
  const { deliveryJobs, assignDeliveryPartner, setDeliveryStatus } = usePlatformData()
  const partner = currentDeliveryPartner(session)

  if (!partner) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Job Board" subtitle="No delivery partner profile found for this session." />
      </div>
    )
  }

  const myJobs = deliveryJobs.filter((j) => j.partnerId === partner.id)
  const available = deliveryJobs.filter((j) => j.status === 'Unassigned')
  const rankedAvailable = rankJobsForPartner(partner, available)
  const activeCount = myJobs.filter((j) => j.status === 'Assigned' || j.status === 'In Transit').length
  const deliveredCount = myJobs.filter((j) => j.status === 'Delivered').length
  const earnedGHS = myJobs.filter((j) => j.status === 'Delivered').reduce((sum, j) => sum + j.feeGHS, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Job Board"
        subtitle={`Signed in as ${partner.name}. Book any open job that fits your route — no dispatcher needed.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Available Jobs" value={String(available.length)} icon={Truck} hint="Open to book, network-wide" />
        <StatCard label="My Active Jobs" value={String(activeCount)} icon={CheckCircle2} hint="Assigned or in transit" />
        <StatCard label="Completed Deliveries" value={String(deliveredCount)} icon={CheckCircle2} />
        <StatCard label="Fees Earned" value={formatGHSFull(earnedGHS)} icon={Star} hint="From completed deliveries" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card padded={false}>
            <div className="px-6 pt-6">
              <h2 className="font-display text-sm font-semibold text-ink-900">Available Jobs</h2>
              <p className="text-xs text-ink-500">Ranked for your regions and vehicle — book the ones that fit.</p>
            </div>
            <div className="mt-4 flex flex-col divide-y divide-ink-50 px-6 pb-6">
              {rankedAvailable.map(({ job, regionMatch }) => (
                <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-ink-800">
                      {cropById(job.cropId)?.name} · {formatTonnes(job.quantityTonnes)}
                    </p>
                    <p className="text-xs text-ink-400">
                      {job.fromLocation} → {job.toLocation} · {formatDate(job.scheduledDate)} · fee {formatGHSFull(job.feeGHS)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {regionMatch && <Badge tone="good">Good match</Badge>}
                    <Button size="sm" onClick={() => assignDeliveryPartner(job.id, partner.id)}>
                      Book This Job
                    </Button>
                  </div>
                </div>
              ))}
              {rankedAvailable.length === 0 && <p className="py-3 text-sm text-ink-400">No open jobs right now — check back soon.</p>}
            </div>
          </Card>

          <Card padded={false}>
            <div className="px-6 pt-6">
              <h2 className="font-display text-sm font-semibold text-ink-900">My Jobs</h2>
              <p className="text-xs text-ink-500">Jobs you've booked, at any stage.</p>
            </div>
            <div className="mt-4 flex flex-col divide-y divide-ink-50 px-6 pb-6">
              {myJobs.map((job) => {
                const nextStatus = NEXT_STATUS[job.status]
                return (
                  <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-ink-800">
                        {cropById(job.cropId)?.name} · {formatTonnes(job.quantityTonnes)}
                      </p>
                      <p className="text-xs text-ink-400">
                        {job.fromLocation} → {job.toLocation} · {formatDate(job.scheduledDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={STATUS_TONE[job.status]}>{job.status}</Badge>
                      {nextStatus && (
                        <Button size="sm" variant="outline" onClick={() => setDeliveryStatus(job.id, nextStatus)}>
                          Mark {nextStatus}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
              {myJobs.length === 0 && <p className="py-3 text-sm text-ink-400">You haven't booked any jobs yet.</p>}
            </div>
          </Card>
        </div>

        <Card className="h-fit">
          <h2 className="font-display text-sm font-semibold text-ink-700">Your Profile</h2>
          <p className="mt-3 font-display text-base font-semibold text-ink-900">{partner.name}</p>
          <p className="text-xs text-ink-500">{partner.type} · {partner.vehicleType}</p>
          <div className="mt-3 flex items-center gap-1.5 text-sm text-ink-700">
            <Star className="h-4 w-4 fill-current text-status-warn" />
            {partner.rating.toFixed(1)} rating
            <span className="text-xs text-ink-400">· DEMO metric</span>
          </div>
          <div className="mt-3 flex items-start gap-1.5 text-sm text-ink-700">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
            <span>{partner.regions.join(', ')}</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MapPin, Building2 } from 'lucide-react'
import { PageHeader, Card, Button, Badge, KycBadge, ProgressBar } from '@/components/ui'
import { cropById, buyerById } from '@/data'
import { useSession } from '@/context/SessionContext'
import { usePlatformData, resolveKycStatus } from '@/context/PlatformDataContext'
import { scopedBuyers, isDemandVisible } from '@/lib/scope'
import type { DemandStatus } from '@/types'
import { formatDate } from '@/lib/date'
import { formatTonnes } from '@/lib/format'
import { NewDemandRequestModal } from './NewDemandRequestModal'

const STATUS_TONE: Record<DemandStatus, 'good' | 'warn' | 'info' | 'neutral'> = {
  Open: 'info',
  'Partially Contracted': 'warn',
  'Fully Contracted': 'good',
  Closed: 'neutral',
}

export function BuyersPage() {
  const { session } = useSession()
  const { demandRequests: allDemands, createDemandRequest, kycOverrides } = usePlatformData()
  const isBuyer = session?.role === 'Buyer'
  const buyers = useMemo(() => scopedBuyers(session), [session])
  const demands = useMemo(() => allDemands.filter((d) => isDemandVisible(session, d)), [allDemands, session])
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Buyer Demand"
        subtitle={
          isBuyer
            ? `Track demand requests for ${buyers[0]?.name ?? 'your organization'} and how they're being contracted to farmers.`
            : "Manage institutional demand and track how it's being contracted to farmers."
        }
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New Demand Request
          </Button>
        }
      />

      {!isBuyer && (
        <div>
          <h2 className="mb-3 font-display text-sm font-semibold text-ink-700">Buyers ({buyers.length})</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {buyers.map((b) => (
              <Link key={b.id} to={`/buyers/${b.id}`}>
                <Card hoverable className="h-full">
                  <div className="flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone="info">{b.type}</Badge>
                      <KycBadge status={resolveKycStatus(b.kycStatus, b.id, kycOverrides)} />
                    </div>
                  </div>
                  <p className="mt-3 font-display text-sm font-semibold text-ink-900">{b.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                    <MapPin className="h-3 w-3" />
                    {b.location}
                  </p>
                  <p className="mt-3 text-xs text-ink-400">{b.activeContractIds.length} active contract(s)</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 font-display text-sm font-semibold text-ink-700">Demand Requests ({demands.length})</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {demands.map((d) => {
            const buyer = buyerById(d.buyerId)
            const crop = cropById(d.cropId)
            const remaining = Math.max(0, d.quantityTonnes - d.contractedTonnes)
            const pct = d.quantityTonnes > 0 ? (d.contractedTonnes / d.quantityTonnes) * 100 : 0
            return (
              <Card key={d.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {isBuyer ? (
                      <p className="text-sm font-semibold text-ink-900">{buyer?.name}</p>
                    ) : (
                      <Link to={`/buyers/${d.buyerId}`} className="text-sm font-semibold text-ink-900 hover:text-brand-700">
                        {buyer?.name}
                      </Link>
                    )}
                    <p className="text-xs text-ink-500">
                      {crop?.name} · {d.qualityGrade}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>
                </div>

                <div className="mt-4 flex items-baseline justify-between text-xs text-ink-500">
                  <span>
                    <span className="font-semibold text-ink-800">{formatTonnes(d.contractedTonnes)}</span> contracted
                  </span>
                  <span>{formatTonnes(d.quantityTonnes)} required</span>
                </div>
                <ProgressBar value={pct} className="mt-1.5" />
                <p className="mt-1.5 text-xs text-ink-400">{formatTonnes(remaining)} remaining</p>

                <dl className="mt-4 grid grid-cols-2 gap-y-1.5 text-xs">
                  <dt className="text-ink-400">Delivery</dt>
                  <dd className="text-right text-ink-700">{formatDate(d.requiredDeliveryDate)}</dd>
                  <dt className="text-ink-400">Location</dt>
                  <dd className="text-right text-ink-700">{d.deliveryLocation}</dd>
                  <dt className="text-ink-400">Target price</dt>
                  <dd className="text-right text-ink-700">GHS {d.targetPriceGHSPerTonne.toLocaleString()}/t</dd>
                  <dt className="text-ink-400">Frequency</dt>
                  <dd className="text-right text-ink-700">{d.frequency}</dd>
                </dl>
                {d.specialRequirements && (
                  <p className="mt-3 rounded-lg bg-ink-50 px-2.5 py-2 text-xs text-ink-500">{d.specialRequirements}</p>
                )}
              </Card>
            )
          })}
          {demands.length === 0 && <p className="text-sm text-ink-400">No demand requests yet.</p>}
        </div>
      </div>

      {modalOpen && (
        <NewDemandRequestModal
          onClose={() => setModalOpen(false)}
          lockedBuyerId={isBuyer ? buyers[0]?.id : undefined}
          onCreate={(d) => {
            createDemandRequest(d)
            setModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { PageHeader, Card, Badge, RiskBadge, KycBadge, ProgressBar, EmptyState } from '@/components/ui'
import { buyerById, contractsByBuyer, cropById } from '@/data'
import { useSession } from '@/context/SessionContext'
import { usePlatformData, resolveKycStatus } from '@/context/PlatformDataContext'
import { canViewBuyer } from '@/lib/scope'
import { formatDate } from '@/lib/date'
import { formatGHSFull, formatTonnes } from '@/lib/format'
import { FileQuestion } from 'lucide-react'

export function BuyerDetailPage() {
  const { id } = useParams()
  const { session } = useSession()
  const { demandRequests, contracts: liveContracts, kycOverrides } = usePlatformData()
  const buyer = id ? buyerById(id) : undefined
  if (!buyer || !canViewBuyer(session, buyer.id)) return <Navigate to="/buyers" replace />

  const demands = demandRequests.filter((d) => d.buyerId === buyer.id)
  const contracts = contractsByBuyer(buyer.id, liveContracts)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/buyers" className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800">
          <ArrowLeft className="h-3.5 w-3.5" />
          Buyer Demand
        </Link>
        <PageHeader
          title={buyer.name}
          subtitle={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Badge tone="info">{buyer.type}</Badge>
              <KycBadge status={resolveKycStatus(buyer.kycStatus, buyer.id, kycOverrides)} />
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {buyer.location}
              </span>
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div>
            <h2 className="mb-3 font-display text-sm font-semibold text-ink-700">Demand Requests</h2>
            {demands.length === 0 ? (
              <EmptyState icon={FileQuestion} title="No demand requests yet" />
            ) : (
              <div className="flex flex-col gap-3">
                {demands.map((d) => {
                  const crop = cropById(d.cropId)
                  const pct = d.quantityTonnes > 0 ? (d.contractedTonnes / d.quantityTonnes) * 100 : 0
                  return (
                    <Card key={d.id}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-ink-900">
                            {crop?.name} · {formatTonnes(d.quantityTonnes)}
                          </p>
                          <p className="text-xs text-ink-500">
                            {d.qualityGrade} · Delivery {formatDate(d.requiredDeliveryDate)} · {d.deliveryLocation}
                          </p>
                        </div>
                        <Badge tone={d.status === 'Fully Contracted' || d.status === 'Closed' ? 'good' : 'warn'}>{d.status}</Badge>
                      </div>
                      <div className="mt-3 flex items-baseline justify-between text-xs text-ink-500">
                        <span>
                          <span className="font-semibold text-ink-800">{formatTonnes(d.contractedTonnes)}</span> contracted
                        </span>
                        <span>{formatTonnes(Math.max(0, d.quantityTonnes - d.contractedTonnes))} remaining</span>
                      </div>
                      <ProgressBar value={pct} className="mt-1.5" />
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 font-display text-sm font-semibold text-ink-700">Contracts</h2>
            <Card padded={false}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 text-xs font-medium uppercase tracking-wide text-ink-400">
                      <th className="px-5 py-3 font-medium">Contract</th>
                      <th className="px-3 py-3 font-medium">Crop</th>
                      <th className="px-3 py-3 font-medium">Value</th>
                      <th className="px-3 py-3 font-medium">Stage</th>
                      <th className="px-5 py-3 font-medium">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c) => (
                      <tr key={c.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                        <td className="px-5 py-3">
                          <Link to={`/contracts/${c.id}`} className="font-medium text-brand-700 hover:text-brand-800">
                            {c.id}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-ink-600">{cropById(c.cropId)?.name}</td>
                        <td className="px-3 py-3 text-ink-600">{formatGHSFull(c.valueGHS)}</td>
                        <td className="px-3 py-3 text-ink-600">{c.stage}</td>
                        <td className="px-5 py-3">
                          <RiskBadge level={c.riskLevel} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="h-2" />
            </Card>
          </div>
        </div>

        <Card className="h-fit">
          <h2 className="font-display text-sm font-semibold text-ink-700">Contact</h2>
          <dl className="mt-4 flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2 text-ink-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
                <Mail className="h-4 w-4" />
              </span>
              <div>
                <dt className="text-xs text-ink-400">{buyer.contactPerson}</dt>
                <dd>{buyer.contactEmail}</dd>
              </div>
            </div>
            <div className="flex items-center gap-2 text-ink-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
                <Phone className="h-4 w-4" />
              </span>
              <dd>{buyer.contactPhone}</dd>
            </div>
            <div className="flex items-center gap-2 text-ink-700">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
                <Calendar className="h-4 w-4" />
              </span>
              <dd>Buyer since {formatDate(buyer.since)}</dd>
            </div>
          </dl>
          {buyer.notes && <p className="mt-4 rounded-xl bg-ink-50 px-3 py-2.5 text-xs text-ink-500">{buyer.notes}</p>}
        </Card>
      </div>
    </div>
  )
}

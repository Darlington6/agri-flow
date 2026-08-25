import { useEffect, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Circle, Sparkles } from 'lucide-react'
import { PageHeader, Card, Badge, RiskBadge, ProgressBar, KycBadge } from '@/components/ui'
import { buyerById, cropById, farmersByContract, paymentsByContract } from '@/data'
import { useSession } from '@/context/SessionContext'
import { usePlatformData } from '@/context/PlatformDataContext'
import { canViewContract } from '@/lib/scope'
import { isAdminRole } from '@/lib/permissions'
import { aiService } from '@/services/ai'
import type { ContractRiskAssessment } from '@/services/ai'
import { formatDate } from '@/lib/date'
import { formatGHSFull, formatTonnes } from '@/lib/format'
import { MatchRequestsPanel } from '@/components/contract/MatchRequestsPanel'
import { ContractMessages } from '@/components/contract/ContractMessages'
import { DeliveryCard } from '@/components/contract/DeliveryCard'

export function ContractDetailPage() {
  const { id } = useParams()
  const { session } = useSession()
  const { contracts, matchRequests } = usePlatformData()
  const contract = id ? contracts.find((c) => c.id === id) : undefined
  const [assessment, setAssessment] = useState<ContractRiskAssessment | null>(null)

  useEffect(() => {
    if (contract) aiService.getContractRisk(contract.id).then(setAssessment)
  }, [contract])

  if (!contract || !canViewContract(session, contract, contracts)) return <Navigate to="/contracts" replace />

  const buyer = buyerById(contract.buyerId)
  const crop = cropById(contract.cropId)
  const farmers = farmersByContract(contract.id, contracts)
  const payments = paymentsByContract(contract.id)
  // A farmer's own contractedQuantityTonnes only reflects the pre-seeded
  // demo assignment; a farmer added via a confirmed match request has their
  // committed volume on the match request instead, so prefer that when present.
  const matchedQuantityByFarmer = new Map<string, number>()
  for (const m of matchRequests) {
    if (m.contractId === contract.id && m.status === 'Confirmed') {
      matchedQuantityByFarmer.set(m.farmerId, (matchedQuantityByFarmer.get(m.farmerId) ?? 0) + m.proposedQuantityTonnes)
    }
  }
  const pct = (contract.suppliedQuantityTonnes / contract.contractedQuantityTonnes) * 100
  const role = session?.role ?? 'Platform Admin'
  const canManageMatches = isAdminRole(role) || role === 'Buyer'
  const canMessage = isAdminRole(role) || role === 'Buyer' || role === 'Farmer'

  const counterparty =
    role === 'Farmer'
      ? { name: buyer?.name ?? 'Buyer', phone: buyer?.contactPhone ?? '' }
      : { name: farmers[0]?.name ?? 'Farmers on this contract', phone: farmers[0]?.phone ?? '' }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/contracts" className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800">
          <ArrowLeft className="h-3.5 w-3.5" />
          Contracts
        </Link>
        <PageHeader
          title={`Contract ${contract.id}`}
          subtitle={
            <span>
              <Link to={`/buyers/${buyer?.id}`} className="font-medium text-ink-700 hover:text-brand-700">
                {buyer?.name}
              </Link>{' '}
              · {crop?.name} · {contract.deliveryLocation}
            </span>
          }
          actions={<RiskBadge level={contract.riskLevel} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card><p className="text-xs text-ink-500">Contracted</p><p className="mt-1 font-display text-xl font-semibold text-ink-900">{formatTonnes(contract.contractedQuantityTonnes)}</p></Card>
        <Card><p className="text-xs text-ink-500">Expected delivery</p><p className="mt-1 font-display text-xl font-semibold text-ink-900">{formatDate(contract.expectedDeliveryDate)}</p></Card>
        <Card><p className="text-xs text-ink-500">Contract value</p><p className="mt-1 font-display text-xl font-semibold text-ink-900">{formatGHSFull(contract.valueGHS)}</p></Card>
        <Card><p className="text-xs text-ink-500">Stage</p><p className="mt-1 font-display text-xl font-semibold text-ink-900">{contract.stage}</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <h2 className="font-display text-sm font-semibold text-ink-700">Supply Progress</h2>
            <div className="mt-3 flex items-baseline justify-between text-sm">
              <span className="font-display text-2xl font-semibold text-ink-900">
                {formatTonnes(contract.suppliedQuantityTonnes)} / {formatTonnes(contract.contractedQuantityTonnes)}
              </span>
              <span className="font-medium text-ink-500">{pct.toFixed(0)}%</span>
            </div>
            <ProgressBar value={pct} tone={contract.riskLevel === 'high' ? 'risk' : contract.riskLevel === 'medium' ? 'warn' : 'brand'} className="mt-2" />
          </Card>

          {canManageMatches && <MatchRequestsPanel contractId={contract.id} />}

          <Card>
            <h2 className="font-display text-sm font-semibold text-ink-700">Timeline</h2>
            <ol className="mt-4 flex flex-col gap-4">
              {contract.timeline.map((event, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {event.done ? (
                      <CheckCircle2 className="h-5 w-5 text-status-good" />
                    ) : (
                      <Circle className="h-5 w-5 text-ink-300" />
                    )}
                    {i < contract.timeline.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-ink-100" />}
                  </div>
                  <div className="pb-4">
                    <p className={event.done ? 'text-sm font-medium text-ink-800' : 'text-sm font-medium text-ink-400'}>
                      {event.label}
                    </p>
                    <p className="text-xs text-ink-400">{formatDate(event.date)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card>
            <h2 className="font-display text-sm font-semibold text-ink-700">Farmers Supplying This Contract</h2>
            {farmers.length === 0 ? (
              <p className="mt-3 text-sm text-ink-500">No farmers matched yet.</p>
            ) : (
              <div className="mt-3 flex flex-col divide-y divide-ink-50">
                {farmers.map((f) => (
                  <Link
                    key={f.id}
                    to={`/farmers/${f.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0 hover:text-brand-700"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink-800">{f.name}</p>
                      <p className="text-xs text-ink-400">
                        {f.community}, {f.region} · {f.currentCropStage}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right text-xs text-ink-500">
                      <p>{formatTonnes(matchedQuantityByFarmer.get(f.id) ?? f.contractedQuantityTonnes)} contracted</p>
                      <div className="flex items-center gap-1.5">
                        <KycBadge status={f.kycStatus} />
                        <RiskBadge level={f.riskStatus} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {canMessage && (
            <ContractMessages contractId={contract.id} counterpartyName={counterparty.name} counterpartyPhone={counterparty.phone} />
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card tone="dark">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="font-display text-sm font-semibold text-white">AI Assessment</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-brand-100">
              {contract.aiAssessment ?? 'No elevated risk factors detected for this contract.'}
            </p>
            {assessment && (
              <p className="mt-3 text-xs text-brand-200">
                Projected fulfillment: {assessment.projectedFulfillmentPct}%
              </p>
            )}
          </Card>

          <DeliveryCard contractId={contract.id} />

          <Card>
            <h2 className="font-display text-sm font-semibold text-ink-700">Payments</h2>
            {payments.length === 0 ? (
              <p className="mt-3 text-sm text-ink-500">No payments recorded yet.</p>
            ) : (
              <div className="mt-3 flex flex-col divide-y divide-ink-50">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-ink-800">{p.counterpartyName}</p>
                      <p className="text-xs text-ink-400">{p.direction} · {p.method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-ink-800">{formatGHSFull(p.amountGHS)}</p>
                      <Badge tone={p.status === 'Paid' ? 'good' : p.status === 'Processing' ? 'info' : 'warn'}>{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

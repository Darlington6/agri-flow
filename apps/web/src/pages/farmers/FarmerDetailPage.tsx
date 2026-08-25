import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Ruler, Phone, CheckCircle2, Circle, ShieldCheck } from 'lucide-react'
import { PageHeader, Card, Badge, RiskBadge, KycBadge, ComingSoonBadge } from '@/components/ui'
import { farmerById, productionByFarmer, contractsByFarmer, cropById, buyerById, paymentsByCounterparty } from '@/data'
import { useSession } from '@/context/SessionContext'
import { usePlatformData, resolveKycStatus } from '@/context/PlatformDataContext'
import { canViewFarmer } from '@/lib/scope'
import { ROLE_PERMISSIONS } from '@/lib/permissions'
import type { ClimateSmartPractice } from '@/types'
import { formatDate } from '@/lib/date'
import { formatGHSFull, formatTonnes } from '@/lib/format'

const ALL_PRACTICES: ClimateSmartPractice[] = [
  'Mulching',
  'Efficient irrigation',
  'Integrated pest management',
  'Soil-health management',
  'Appropriate fertilizer use',
  'Water conservation',
]

export function FarmerDetailPage() {
  const { id } = useParams()
  const { session } = useSession()
  const { contracts: liveContracts, productionCycles: liveProductionCycles, kycOverrides } = usePlatformData()
  const farmer = id ? farmerById(id) : undefined
  if (!farmer || !canViewFarmer(session, farmer, liveContracts)) return <Navigate to="/farmers" replace />

  const canOpenContracts = ROLE_PERMISSIONS[session?.role ?? 'Platform Admin'].includes('contracts')
  const cycles = productionByFarmer(farmer.id, liveProductionCycles)
  const contracts = contractsByFarmer(farmer.id, liveContracts)
  const paymentHistory = paymentsByCounterparty(farmer.id)
  const kycStatus = resolveKycStatus(farmer.kycStatus, farmer.id, kycOverrides)
  const readinessScore = Math.round(farmer.reliabilityScore * 0.6 + farmer.climateSmartScore * 0.4)
  const insuranceEligible = readinessScore >= 70 && kycStatus === 'Verified'

  return (
    <div className="flex flex-col gap-6">
      <div>
        {session?.role !== 'Farmer' && (
          <Link to="/farmers" className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800">
            <ArrowLeft className="h-3.5 w-3.5" />
            Farmer Network
          </Link>
        )}
        <PageHeader
          title={farmer.name}
          subtitle={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {farmer.community}, {farmer.region}
              </span>
              <span className="flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5" />
                {farmer.farmSizeHectares} ha
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {farmer.phone}
              </span>
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <KycBadge status={kycStatus} />
              <RiskBadge level={farmer.riskStatus} />
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <h2 className="font-display text-sm font-semibold text-ink-700">Production</h2>
            {cycles.length === 0 ? (
              <p className="mt-3 text-sm text-ink-500">No active production cycle.</p>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                {cycles.map((c) => (
                  <div key={c.id} className="rounded-xl border border-ink-100 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink-900">{cropById(c.cropId)?.name}</p>
                      <Badge tone="neutral">{c.stage}</Badge>
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs sm:grid-cols-4">
                      <div>
                        <dt className="text-ink-400">Planting date</dt>
                        <dd className="text-ink-700">{formatDate(c.plantingDate)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-400">Expected harvest</dt>
                        <dd className="text-ink-700">{formatDate(c.expectedHarvestDate)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-400">Expected yield</dt>
                        <dd className="text-ink-700">{formatTonnes(c.expectedYieldTonnes)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-400">Latest estimate</dt>
                        <dd className="text-ink-700">{formatTonnes(c.latestYieldEstimateTonnes)}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            )}
            {!farmer.hasSubmittedLatestUpdate && (
              <p className="mt-4 rounded-lg bg-status-warn-bg px-3 py-2 text-xs text-status-warn">
                This farmer has not submitted a crop update since {formatDate(farmer.lastUpdateAt)}.
              </p>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-sm font-semibold text-ink-700">Climate-Smart Practices</h2>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-brand-100 font-display text-lg font-semibold text-brand-800">
                {farmer.climateSmartScore}%
              </div>
              <div>
                <p className="text-sm font-medium text-ink-800">Climate-Smart Practice Score</p>
                <p className="text-xs text-ink-400">DEMO metric · adoption of recommended practices</p>
              </div>
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ALL_PRACTICES.map((p) => {
                const adopted = farmer.climateSmartPractices.includes(p)
                return (
                  <li key={p} className="flex items-center gap-2 text-sm">
                    {adopted ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-status-good" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-ink-300" />
                    )}
                    <span className={adopted ? 'text-ink-800' : 'text-ink-400'}>{p}</span>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card>
            <h2 className="font-display text-sm font-semibold text-ink-700">Contract History</h2>
            {contracts.length === 0 ? (
              <p className="mt-3 text-sm text-ink-500">No contracts yet.</p>
            ) : (
              <div className="mt-3 flex flex-col divide-y divide-ink-50">
                {contracts.map((c) => {
                  const buyer = buyerById(c.buyerId)
                  const content = (
                    <>
                      <div>
                        <p className="text-sm font-medium text-ink-800">
                          {c.id} · {buyer?.name}
                        </p>
                        <p className="text-xs text-ink-400">
                          {cropById(c.cropId)?.name} · {formatGHSFull(c.valueGHS)}
                        </p>
                      </div>
                      <Badge tone="neutral">{c.stage}</Badge>
                    </>
                  )
                  return canOpenContracts ? (
                    <Link
                      key={c.id}
                      to={`/contracts/${c.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0 hover:text-brand-700"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                      {content}
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="font-display text-sm font-semibold text-ink-700">Risk</h2>
            <dl className="mt-3 flex flex-col gap-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Rainfall exposure</dt>
                <dd><RiskBadge level={farmer.risk.rainfallExposure} /></dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Drought exposure</dt>
                <dd><RiskBadge level={farmer.risk.droughtExposure} /></dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Pest risk</dt>
                <dd><RiskBadge level={farmer.risk.pestRisk} /></dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-500">Expected yield risk</dt>
                <dd><RiskBadge level={farmer.risk.yieldRisk} /></dd>
              </div>
            </dl>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-ink-500" />
              <h2 className="font-display text-sm font-semibold text-ink-700">Financing &amp; Insurance</h2>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-brand-100 font-display text-sm font-semibold text-brand-800">
                {readinessScore}
              </div>
              <div>
                <p className="text-sm font-medium text-ink-800">Production Readiness Score</p>
                <p className="text-xs text-ink-400">DEMO metric · reliability + climate-smart adoption</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2">
              <span className="text-xs text-ink-600">Climate-smart insurance pilot</span>
              <Badge tone={insuranceEligible ? 'good' : 'neutral'}>{insuranceEligible ? 'Eligible' : 'Not yet eligible'}</Badge>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-ink-500">Input / working-capital financing</span>
              <ComingSoonBadge />
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-sm font-semibold text-ink-700">Payment History</h2>
            {paymentHistory.length === 0 ? (
              <p className="mt-3 text-sm text-ink-500">No payments recorded yet.</p>
            ) : (
              <div className="mt-3 flex flex-col divide-y divide-ink-50">
                {paymentHistory.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-ink-800">{formatGHSFull(p.amountGHS)}</p>
                      <p className="text-xs text-ink-400">
                        {p.method} · {formatDate(p.date)}
                      </p>
                    </div>
                    <Badge tone={p.status === 'Paid' ? 'good' : p.status === 'Processing' ? 'info' : 'warn'}>{p.status}</Badge>
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

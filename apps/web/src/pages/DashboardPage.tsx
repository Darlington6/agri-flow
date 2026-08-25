import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  Sprout,
  Users,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TriangleAlert,
  CloudRain,
  ClipboardX,
  Warehouse,
  Gauge,
  Leaf,
  UserPlus,
  Truck,
  Star,
  Crown,
} from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import { usePlatformData } from '@/context/PlatformDataContext'
import { PageHeader, Card, StatCard, Button, RiskBadge, Badge } from '@/components/ui'
import { SupplyDemandChart } from '@/components/charts/SupplyDemandChart'
import { dashboardMetrics, buyerById, cropById, farmerById, regionClimateRiskByRegion, upcomingHarvests, productionByFarmer } from '@/data'
import {
  scopedContracts,
  scopedFarmers,
  scopedHarvestForecasts,
  scopedNotifications,
  scopedProductionCycles,
  scopedRegions,
  currentFarmer,
  currentDeliveryPartner,
  myDeliveryJobs,
} from '@/lib/scope'
import { isAdminRole } from '@/lib/permissions'
import { rankJobsForPartner } from '@/lib/deliveryScore'
import { OpenOpportunities } from '@/components/contract/OpenOpportunities'
import { aiService } from '@/services/ai'
import type { SupplyRiskSummary } from '@/services/ai'
import { formatGHS, formatGHSFull, formatTonnes } from '@/lib/format'
import { formatDate, formatShortDate } from '@/lib/date'
import type { RiskLevel } from '@/types'

const NOTIF_ICON = { info: ClipboardX, warning: CloudRain, risk: TriangleAlert } as const
const SUBTITLE = {
  'Platform Admin': "Here's what needs your attention today.",
  'Super Admin': "Here's how the platform is performing today.",
  Buyer: "Here's the status of your orders today.",
  'Field Agent': "Here's what your farms need today.",
  Farmer: "Here's how your farm is tracking today.",
  'Delivery Partner': "Here's what's on your route today.",
} as const

function worstRisk(levels: RiskLevel[]): 'Low' | 'Moderate' | 'High' {
  if (levels.includes('high')) return 'High'
  if (levels.includes('medium')) return 'Moderate'
  return 'Low'
}

export function DashboardPage() {
  const { session } = useSession()
  const role = session?.role ?? 'Platform Admin'
  const [summary, setSummary] = useState<SupplyRiskSummary | null>(null)

  useEffect(() => {
    aiService.getSupplyRiskSummary().then(setSummary)
  }, [])

  const {
    contracts: liveContracts,
    productionCycles: liveProductionCycles,
    harvestForecasts: liveHarvestForecasts,
    matchRequests,
    deliveryJobs,
  } = usePlatformData()

  const contracts = useMemo(() => scopedContracts(session, liveContracts), [session, liveContracts])
  const scopedFarmerList = useMemo(() => scopedFarmers(session, liveContracts), [session, liveContracts])
  const harvestForecasts = useMemo(
    () => scopedHarvestForecasts(session, liveHarvestForecasts, liveContracts),
    [session, liveHarvestForecasts, liveContracts],
  )
  const productionCycles = useMemo(
    () => scopedProductionCycles(session, liveProductionCycles, liveContracts),
    [session, liveProductionCycles, liveContracts],
  )
  const alerts = useMemo(
    () => scopedNotifications(session, liveContracts).filter((n) => !n.read).slice(0, 4),
    [session, liveContracts],
  )
  const regions = useMemo(() => scopedRegions(session, liveContracts), [session, liveContracts])
  const me = useMemo(() => currentFarmer(session), [session])
  const myCycle = me ? productionByFarmer(me.id, liveProductionCycles)[0] : undefined
  const myPartner = useMemo(() => currentDeliveryPartner(session), [session])

  const canManageMatches = isAdminRole(role) || role === 'Buyer'
  const pendingMatches = useMemo(() => {
    if (!canManageMatches) return []
    const contractIds = new Set(contracts.map((c) => c.id))
    return matchRequests.filter((m) => m.status === 'Pending' && contractIds.has(m.contractId))
  }, [canManageMatches, contracts, matchRequests])

  const harvests = upcomingHarvests(60, harvestForecasts).slice(0, 6)

  if (role === 'Delivery Partner' && myPartner) {
    const mine = myDeliveryJobs(session, deliveryJobs)
    const available = deliveryJobs.filter((j) => j.status === 'Unassigned')
    const rankedAvailable = rankJobsForPartner(myPartner, available).slice(0, 4)
    const earnedGHS = mine.filter((j) => j.status === 'Delivered').reduce((s, j) => s + j.feeGHS, 0)

    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={`Good morning, ${session?.name ?? 'there'}`} subtitle={SUBTITLE[role]} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Available Jobs" value={String(available.length)} icon={Truck} hint="Open to book, network-wide" />
          <StatCard label="My Active Jobs" value={String(mine.filter((j) => j.status !== 'Delivered').length)} icon={Truck} />
          <StatCard label="Completed Deliveries" value={String(mine.filter((j) => j.status === 'Delivered').length)} icon={Truck} />
          <StatCard label="Fees Earned" value={formatGHSFull(earnedGHS)} icon={Star} hint="From completed deliveries" />
        </div>

        <Card padded={false}>
          <div className="flex items-center justify-between px-6 pt-6">
            <div>
              <h3 className="font-display text-base font-semibold text-ink-900">Best-Matched Open Jobs</h3>
              <p className="text-xs text-ink-500">Ranked for {myPartner.name}'s regions and vehicle</p>
            </div>
            <Link to="/delivery" className="text-xs font-medium text-brand-700 hover:text-brand-800">
              Open Job Board
            </Link>
          </div>
          <div className="mt-4 flex flex-col divide-y divide-ink-50 px-6 pb-6">
            {rankedAvailable.map(({ job, regionMatch }) => (
              <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-ink-800">
                    {cropById(job.cropId)?.name} · {formatTonnes(job.quantityTonnes)}
                  </p>
                  <p className="text-xs text-ink-400">
                    {job.fromLocation} → {job.toLocation} · {formatDate(job.scheduledDate)}
                  </p>
                </div>
                {regionMatch && <Badge tone="good">Good match</Badge>}
              </div>
            ))}
            {rankedAvailable.length === 0 && <p className="py-3 text-sm text-ink-400">No open jobs right now.</p>}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Good morning, ${session?.name ?? 'there'}`} subtitle={SUBTITLE[role]} />

      {isAdminRole(role) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Contracted Demand" value={formatGHS(dashboardMetrics.contractedDemandGHS)} icon={Wallet} hint="Active contracted value, network-wide" />
          <StatCard label="Expected Supply" value={formatTonnes(dashboardMetrics.expectedSupplyTonnes)} icon={Sprout} hint="Projected across active contracts" />
          <StatCard label="Active Farmers" value={dashboardMetrics.activeFarmers.toLocaleString()} icon={Users} hint="Across 9 regions" />
          <StatCard label="At-Risk Contracts" value={String(dashboardMetrics.atRiskContracts)} icon={AlertTriangle} tone="risk" hint="Medium or high risk of shortfall" />
        </div>
      )}

      {role === 'Buyer' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Your Contracted Value" value={formatGHS(contracts.reduce((s, c) => s + c.valueGHS, 0))} icon={Wallet} hint={`Across ${contracts.length} contract(s)`} />
          <StatCard label="Your Expected Supply" value={formatTonnes(harvestForecasts.reduce((s, h) => s + h.expectedQuantityTonnes, 0))} icon={Sprout} hint="Forecast across your contracts" />
          <StatCard label="Active Suppliers" value={String(scopedFarmerList.length)} icon={Users} hint="Farmers fulfilling your orders" />
          <StatCard
            label="At-Risk Contracts"
            value={String(contracts.filter((c) => c.riskLevel !== 'low').length)}
            icon={AlertTriangle}
            tone="risk"
            hint="Medium or high risk of shortfall"
          />
        </div>
      )}

      {role === 'Field Agent' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Assigned Farmers" value={String(scopedFarmerList.length)} icon={Users} hint={`Across ${regions.length} region(s)`} />
          <StatCard
            label="Needing Attention"
            value={String(scopedFarmerList.filter((f) => f.riskStatus === 'high' || !f.hasSubmittedLatestUpdate).length)}
            icon={AlertTriangle}
            tone="risk"
            hint="High risk or missing crop update"
          />
          <StatCard
            label="Active Production Cycles"
            value={String(productionCycles.filter((p) => p.stage !== 'Harvested').length)}
            icon={Sprout}
            hint="Currently growing or maturing"
          />
          <StatCard
            label="Regional Climate Risk"
            value={worstRisk(regions.map((r) => regionClimateRiskByRegion(r)?.overallRisk ?? 'low'))}
            icon={Gauge}
            hint={regions.join(', ')}
          />
        </div>
      )}

      {role === 'Farmer' && me && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Contracted Quantity" value={formatTonnes(me.contractedQuantityTonnes)} icon={Sprout} hint={cropById(me.primaryCropId)?.name} />
          <StatCard
            label="Expected Harvest"
            value={myCycle ? formatShortDate(myCycle.expectedHarvestDate) : '—'}
            icon={Warehouse}
            hint={myCycle ? formatTonnes(myCycle.latestYieldEstimateTonnes) : undefined}
          />
          <StatCard label="Climate-Smart Score" value={`${me.climateSmartScore}%`} icon={Leaf} hint="DEMO metric" />
          <StatCard
            label="Risk Status"
            value={me.riskStatus.charAt(0).toUpperCase() + me.riskStatus.slice(1)}
            icon={AlertTriangle}
            tone={me.riskStatus === 'low' ? 'default' : 'risk'}
            hint="Overall production risk"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {isAdminRole(role) && (
            <Card>
              <SupplyDemandChart />
            </Card>
          )}

          {(role === 'Buyer' || role === 'Farmer') && (
            <Card padded={false}>
              <div className="px-6 pt-6">
                <h3 className="font-display text-base font-semibold text-ink-900">
                  {role === 'Buyer' ? 'Your Contracts' : 'My Contract'}
                </h3>
                <p className="text-xs text-ink-500">Progress against contracted volume</p>
              </div>
              <div className="mt-4 flex flex-col divide-y divide-ink-50 px-6 pb-6">
                {contracts.map((c) => {
                  const pct = (c.suppliedQuantityTonnes / c.contractedQuantityTonnes) * 100
                  const buyer = buyerById(c.buyerId)
                  return (
                    <Link key={c.id} to={`/contracts/${c.id}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand-700">
                      <div>
                        <p className="text-sm font-medium text-ink-800">
                          {c.id} · {cropById(c.cropId)?.name}
                          {role === 'Farmer' && buyer ? ` · ${buyer.name}` : ''}
                        </p>
                        <p className="text-xs text-ink-400">{formatTonnes(c.suppliedQuantityTonnes)} / {formatTonnes(c.contractedQuantityTonnes)} · {pct.toFixed(0)}%</p>
                      </div>
                      <RiskBadge level={c.riskLevel} />
                    </Link>
                  )
                })}
                {contracts.length === 0 && <p className="py-3 text-sm text-ink-400">No contract yet.</p>}
              </div>
            </Card>
          )}

          {role === 'Farmer' && me && <OpenOpportunities farmerId={me.id} />}

          {role === 'Field Agent' && (
            <Card padded={false}>
              <div className="px-6 pt-6">
                <h3 className="font-display text-base font-semibold text-ink-900">Farms Needing Attention</h3>
                <p className="text-xs text-ink-500">High risk or missing a crop update</p>
              </div>
              <div className="mt-4 flex flex-col divide-y divide-ink-50 px-6 pb-6">
                {scopedFarmerList
                  .filter((f) => f.riskStatus === 'high' || !f.hasSubmittedLatestUpdate)
                  .map((f) => (
                      <Link key={f.id} to={`/farmers/${f.id}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:text-brand-700">
                        <div>
                          <p className="text-sm font-medium text-ink-800">{f.name}</p>
                          <p className="text-xs text-ink-400">
                            {f.community}, {f.region}
                            {!f.hasSubmittedLatestUpdate ? ' · no update in 2+ weeks' : ''}
                          </p>
                        </div>
                        <RiskBadge level={f.riskStatus} />
                      </Link>
                    ))}
              </div>
            </Card>
          )}

          <Card padded={false}>
            <div className="flex items-center justify-between px-6 pt-6">
              <div>
                <h3 className="font-display text-base font-semibold text-ink-900">Upcoming Harvests</h3>
                <p className="text-xs text-ink-500">Next 60 days</p>
              </div>
              <Link to="/harvest" className="text-xs font-medium text-brand-700 hover:text-brand-800">
                View all
              </Link>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-y border-ink-100 text-xs font-medium uppercase tracking-wide text-ink-400">
                    <th className="px-6 py-2.5 font-medium">Farmer</th>
                    <th className="px-3 py-2.5 font-medium">Crop</th>
                    <th className="px-3 py-2.5 font-medium">Expected Qty</th>
                    <th className="px-3 py-2.5 font-medium">Expected Harvest</th>
                    <th className="px-3 py-2.5 font-medium">Buyer</th>
                    <th className="px-6 py-2.5 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {harvests.map((h) => {
                    const farmer = farmerById(h.farmerId)
                    const buyer = h.buyerId ? buyerById(h.buyerId) : undefined
                    const crop = cropById(h.cropId)
                    return (
                      <tr key={h.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                        <td className="px-6 py-3">
                          <Link to={`/farmers/${h.farmerId}`} className="font-medium text-ink-800 hover:text-brand-700">
                            {farmer?.name ?? h.farmerId}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-ink-600">{crop?.name}</td>
                        <td className="px-3 py-3 text-ink-600">{formatTonnes(h.expectedQuantityTonnes)}</td>
                        <td className="px-3 py-3 text-ink-600">{formatShortDate(h.expectedHarvestDate)}</td>
                        <td className="px-3 py-3 text-ink-600">{buyer?.name ?? '—'}</td>
                        <td className="px-6 py-3">
                          <RiskBadge level={h.riskLevel} />
                        </td>
                      </tr>
                    )
                  })}
                  {harvests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-6 text-center text-sm text-ink-400">
                        No upcoming harvests in this window.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="h-6" />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          {pendingMatches.length > 0 && (
            <Card className="border-status-warn-bg bg-status-warn-bg/40">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-status-warn" />
                <h3 className="font-display text-sm font-semibold text-ink-900">Farmer Supply Requests</h3>
              </div>
              <p className="mt-1 text-xs text-ink-600">
                {pendingMatches.length} request{pendingMatches.length === 1 ? '' : 's'} waiting for review.
              </p>
              <div className="mt-3 flex flex-col gap-1.5">
                {[...new Set(pendingMatches.map((m) => m.contractId))].slice(0, 3).map((contractId) => (
                  <Link
                    key={contractId}
                    to={`/contracts/${contractId}`}
                    className="text-xs font-medium text-brand-700 hover:text-brand-800"
                  >
                    Review {contractId} →
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h3 className="font-display text-base font-semibold text-ink-900">Risk Alerts</h3>
            <div className="mt-4 flex flex-col gap-3">
              {alerts.map((a) => {
                const Icon = NOTIF_ICON[a.severity]
                return (
                  <div key={a.id} className="flex gap-3 rounded-xl border border-ink-100 p-3">
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        a.severity === 'risk' ? 'bg-status-risk-bg text-status-risk' : 'bg-status-warn-bg text-status-warn'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink-800">{a.title}</p>
                      <p className="mt-0.5 text-xs text-ink-500">{a.message}</p>
                    </div>
                  </div>
                )
              })}
              {alerts.length === 0 && <p className="text-sm text-ink-400">No active alerts for you right now.</p>}
            </div>
          </Card>

          <Card tone="dark">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                <Sparkles className="h-4 w-4" />
              </span>
              <h3 className="font-display text-base font-semibold text-white">AI Supply Intelligence</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-brand-100">
              {summary?.headline ?? 'Analyzing current supply chain signals…'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to={role === 'Field Agent' ? '/farmers' : '/contracts/AG-204'}>
                <Button size="sm" variant="inverse">
                  Review Risk
                </Button>
              </Link>
              <Link to="/copilot">
                <Button size="sm" variant="ghost-inverse">
                  Ask Copilot
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </Card>

          {role === 'Farmer' && me && (
            <Card>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-brand-100 font-display text-base font-semibold text-brand-800">
                  {me.climateSmartScore}%
                </div>
                <div>
                  <p className="text-sm font-medium text-ink-800">Climate-Smart Practice Score</p>
                  <p className="text-xs text-ink-400">{me.climateSmartPractices.length} of 6 practices adopted</p>
                </div>
              </div>
              <Link
                to={`/farmers/${me.id}`}
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"
              >
                View my full profile
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>
          )}

          {role !== 'Field Agent' && role !== 'Farmer' && (
            <Card className="border-dashed">
              <div className="flex items-center gap-2 text-ink-500">
                <Warehouse className="h-4 w-4" />
                <p className="text-xs font-medium uppercase tracking-wide">Post-harvest snapshot</p>
              </div>
              <p className="mt-2 text-sm text-ink-600">Storage shortfall of 7 tonnes projected for next week's harvest.</p>
              <Link to="/harvest" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800">
                View post-harvest plan
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>
          )}

          {role === 'Super Admin' && (
            <Card tone="dark">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <Crown className="h-4 w-4" />
                </span>
                <h3 className="font-display text-base font-semibold text-white">Platform Revenue</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-brand-100">
                Take rate, revenue by source and network growth — the numbers Platform Admin doesn't need day to day.
              </p>
              <Link to="/executive" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-white hover:text-brand-100">
                Open Executive view
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

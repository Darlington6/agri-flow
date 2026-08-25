import { Link } from 'react-router-dom'
import { Snowflake, ArrowRightLeft, Truck, CalendarClock, AlertOctagon, Warehouse } from 'lucide-react'
import { PageHeader, Card, RiskBadge } from '@/components/ui'
import { currentPostHarvestSnapshot, upcomingHarvests, farmerById, buyerById, cropById } from '@/data'
import { useSession } from '@/context/SessionContext'
import { usePlatformData } from '@/context/PlatformDataContext'
import { scopedHarvestForecasts } from '@/lib/scope'
import { isAdminRole } from '@/lib/permissions'
import { PostHarvestOutlookChart } from '@/components/charts/PostHarvestOutlookChart'
import { DeliveryCoordination } from '@/components/contract/DeliveryCoordination'
import { formatShortDate } from '@/lib/date'
import { formatTonnes } from '@/lib/format'

const ACTION_ICONS = [Snowflake, ArrowRightLeft, Truck, CalendarClock, AlertOctagon]

export function HarvestPage() {
  const { session } = useSession()
  const { harvestForecasts: liveHarvestForecasts, contracts: liveContracts } = usePlatformData()
  const isScoped = !isAdminRole(session?.role)
  const snapshot = currentPostHarvestSnapshot
  const shortfall = Math.max(0, snapshot.storageRequiredTonnes - snapshot.storageAvailableTonnes)
  const { highRiskTonnes, mediumRiskTonnes, lowRiskTonnes } = snapshot.riskBreakdown
  const totalRisk = highRiskTonnes + mediumRiskTonnes + lowRiskTonnes
  const harvests = upcomingHarvests(90, scopedHarvestForecasts(session, liveHarvestForecasts, liveContracts))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Harvest &amp; Post-Harvest Coordination"
        subtitle={
          isScoped
            ? "Storage, aggregation and delivery coordination for produce coming off farms you're connected to."
            : 'Storage, aggregation and delivery coordination for produce coming off the farm.'
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-xs text-ink-500">Upcoming harvest ({snapshot.weekLabel.toLowerCase()})</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink-900">{formatTonnes(snapshot.upcomingHarvestTonnes)}</p>
        </Card>
        <Card>
          <p className="text-xs text-ink-500">Storage required</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink-900">{formatTonnes(snapshot.storageRequiredTonnes)}</p>
        </Card>
        <Card>
          <p className="text-xs text-ink-500">Storage available</p>
          <p className="mt-1 font-display text-2xl font-semibold text-ink-900">{formatTonnes(snapshot.storageAvailableTonnes)}</p>
        </Card>
        <Card>
          <p className="text-xs text-ink-500">Shortfall</p>
          <p className="mt-1 font-display text-2xl font-semibold text-status-risk">{formatTonnes(shortfall)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <h2 className="font-display text-sm font-semibold text-ink-700">Harvest vs. Storage Outlook</h2>
            <p className="text-xs text-ink-500">Next 4 weeks</p>
            <div className="mt-2">
              <PostHarvestOutlookChart />
            </div>
          </Card>

          <Card padded={false}>
            <div className="flex items-center justify-between px-6 pt-6">
              <div>
                <h2 className="font-display text-sm font-semibold text-ink-900">Upcoming Harvests</h2>
                <p className="text-xs text-ink-500">Next 90 days{isScoped ? '' : ', all contracts'}</p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-y border-ink-100 text-xs font-medium uppercase tracking-wide text-ink-400">
                    <th className="px-6 py-2.5 font-medium">Farmer</th>
                    <th className="px-3 py-2.5 font-medium">Crop</th>
                    <th className="px-3 py-2.5 font-medium">Region</th>
                    <th className="px-3 py-2.5 font-medium">Expected Qty</th>
                    <th className="px-3 py-2.5 font-medium">Expected Date</th>
                    <th className="px-3 py-2.5 font-medium">Buyer</th>
                    <th className="px-6 py-2.5 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {harvests.map((h) => {
                    const farmer = farmerById(h.farmerId)
                    const buyer = h.buyerId ? buyerById(h.buyerId) : undefined
                    return (
                      <tr key={h.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                        <td className="px-6 py-3">
                          <Link to={`/farmers/${h.farmerId}`} className="font-medium text-ink-800 hover:text-brand-700">
                            {farmer?.name}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-ink-600">{cropById(h.cropId)?.name}</td>
                        <td className="px-3 py-3 text-ink-600">{h.region}</td>
                        <td className="px-3 py-3 text-ink-600">{formatTonnes(h.expectedQuantityTonnes)}</td>
                        <td className="px-3 py-3 text-ink-600">{formatShortDate(h.expectedHarvestDate)}</td>
                        <td className="px-3 py-3 text-ink-600">{buyer?.name ?? '—'}</td>
                        <td className="px-6 py-3"><RiskBadge level={h.riskLevel} /></td>
                      </tr>
                    )
                  })}
                  {harvests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-6 text-center text-sm text-ink-400">
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
          <Card>
            <div className="flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-ink-500" />
              <h2 className="font-display text-sm font-semibold text-ink-700">Post-Harvest Risk</h2>
            </div>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-ink-100">
              <div className="bg-status-risk" style={{ width: `${(highRiskTonnes / totalRisk) * 100}%` }} />
              <div className="bg-status-warn" style={{ width: `${(mediumRiskTonnes / totalRisk) * 100}%` }} />
              <div className="bg-status-good" style={{ width: `${(lowRiskTonnes / totalRisk) * 100}%` }} />
            </div>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-ink-600"><span className="h-2 w-2 rounded-full bg-status-risk" />High risk</span>
                <span className="font-medium text-ink-800">{formatTonnes(highRiskTonnes)}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-ink-600"><span className="h-2 w-2 rounded-full bg-status-warn" />Medium risk</span>
                <span className="font-medium text-ink-800">{formatTonnes(mediumRiskTonnes)}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-ink-600"><span className="h-2 w-2 rounded-full bg-status-good" />Low risk</span>
                <span className="font-medium text-ink-800">{formatTonnes(lowRiskTonnes)}</span>
              </li>
            </ul>
          </Card>

          <Card>
            <h2 className="font-display text-sm font-semibold text-ink-700">Recommended Actions</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {snapshot.recommendedActions.map((action, i) => {
                const Icon = ACTION_ICONS[i % ACTION_ICONS.length]
                return (
                  <li key={action} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="mt-1 text-sm text-ink-700">{action}</p>
                  </li>
                )
              })}
            </ul>
          </Card>

          {isAdminRole(session?.role) && <DeliveryCoordination />}
        </div>
      </div>
    </div>
  )
}

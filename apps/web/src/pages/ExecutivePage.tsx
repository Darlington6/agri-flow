import { Wallet, TrendingUp, Percent, Truck, Users } from 'lucide-react'
import { PageHeader, Card, StatCard, DemoTag } from '@/components/ui'
import { usePlatformData } from '@/context/PlatformDataContext'
import { platformRevenueMetrics, networkGrowthTrend } from '@/data'
import { GrowthTrendChart } from '@/components/charts/GrowthTrendChart'
import { formatMoney, formatMoneyFull } from '@/lib/format'

export function ExecutivePage() {
  const { deliveryJobs } = usePlatformData()
  const deliveryCommission = deliveryJobs.filter((j) => j.status !== 'Unassigned').reduce((s, j) => s + j.commission, 0)

  const latest = networkGrowthTrend[networkGrowthTrend.length - 1]
  const first = networkGrowthTrend[0]
  const takeRatePct = platformRevenueMetrics.transactionFeeRateBps / 100
  const transactionFeeRevenue = latest.contractedValue * (platformRevenueMetrics.transactionFeeRateBps / 10_000)
  const totalRevenue =
    transactionFeeRevenue +
    platformRevenueMetrics.subscriptionRevenue +
    deliveryCommission +
    platformRevenueMetrics.financingReferralRevenue

  const farmerGrowthPct = Math.round(((latest.farmers - first.farmers) / first.farmers) * 100)

  const revenueRows = [
    { label: 'Transaction fees', amount: transactionFeeRevenue, note: `${takeRatePct}% of contracted value` },
    {
      label: 'Buyer subscriptions',
      amount: platformRevenueMetrics.subscriptionRevenue,
      note: 'Demo monthly recurring revenue',
    },
    { label: 'Delivery commission', amount: deliveryCommission, note: 'Live — from booked delivery jobs' },
    {
      label: 'Financing referrals',
      amount: platformRevenueMetrics.financingReferralRevenue,
      note: 'Not live yet',
    },
  ]
  const maxRow = Math.max(...revenueRows.map((r) => r.amount), 1)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Executive"
        subtitle="Platform revenue, take rate and network growth — visibility Platform Admin doesn't need day to day."
        actions={<DemoTag />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Gross Contracted Value"
          value={formatMoney(latest.contractedValue)}
          icon={Wallet}
          hint="This month, network-wide"
        />
        <StatCard
          label="Platform Revenue"
          value={formatMoney(totalRevenue)}
          icon={TrendingUp}
          hint="All sources, this month"
        />
        <StatCard
          label="Take Rate"
          value={`${takeRatePct}%`}
          icon={Percent}
          hint="Transaction fee on contracted value"
        />
        <StatCard
          label="Delivery Commission"
          value={formatMoney(deliveryCommission)}
          icon={Truck}
          hint="Earned on coordinated logistics"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="font-display text-sm font-semibold text-ink-700">Gross Contracted Value — 6 months</h2>
          <p className="text-xs text-ink-600">Network-wide, DEMO trend</p>
          <div className="mt-2">
            <GrowthTrendChart />
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-status-good-bg px-3 py-2.5 text-sm text-status-good">
            <Users className="h-4 w-4" />
            Farmer network grew {first.farmers} → {latest.farmers} (+{farmerGrowthPct}%) over the same period.
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-sm font-semibold text-ink-700">Revenue by Source</h2>
          <p className="text-xs text-ink-600">This month</p>
          <div className="mt-4 flex flex-col gap-3">
            {revenueRows.map((r) => (
              <div key={r.label}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-ink-800">{r.label}</span>
                  <span className="text-ink-700">{formatMoneyFull(r.amount)}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{ width: `${(r.amount / maxRow) * 100}%` }}
                  />
                </div>
                <p className="mt-0.5 text-xs text-ink-500">{r.note}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

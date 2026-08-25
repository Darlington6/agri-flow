import { Wallet, TrendingUp, Clock, PiggyBank, Smartphone, Landmark, Sparkles, Users, Truck, ShieldCheck } from 'lucide-react'
import { PageHeader, Card, StatCard, Badge, ComingSoonBadge } from '@/components/ui'
import { financeMetrics, payments as allPayments } from '@/data'
import { useSession } from '@/context/SessionContext'
import { usePlatformData } from '@/context/PlatformDataContext'
import { scopedContracts, scopedFarmers, scopedPayments } from '@/lib/scope'
import { formatDate } from '@/lib/date'
import { formatGHS, formatGHSFull } from '@/lib/format'

const METHOD_ICON = {
  'MTN Mobile Money': Smartphone,
  'Telecel Cash': Smartphone,
  'AirtelTigo Money': Smartphone,
  'Bank Transfer': Landmark,
} as const

export function FinancePage() {
  const { session } = useSession()
  const { contracts: liveContracts, deliveryJobs } = usePlatformData()
  const isBuyer = session?.role === 'Buyer'
  const payments = isBuyer ? scopedPayments(session, liveContracts) : allPayments
  const contracts = isBuyer ? scopedContracts(session, liveContracts) : []
  const deliveryCommission = deliveryJobs
    .filter((j) => j.status !== 'Unassigned')
    .reduce((s, j) => s + j.commissionGHS, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Finance"
        subtitle={
          isBuyer
            ? 'Contracted value and payment status for your organization.'
            : 'Contracted value, payment status and financing signals across the network.'
        }
      />

      {isBuyer ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Your Contracted Value" value={formatGHS(contracts.reduce((s, c) => s + c.valueGHS, 0))} icon={Wallet} />
          <StatCard
            label="Your Delivered Value"
            value={formatGHS(contracts.filter((c) => c.stage === 'Delivered' || c.stage === 'Paid').reduce((s, c) => s + c.valueGHS, 0))}
            icon={TrendingUp}
          />
          <StatCard
            label="Your Pending Payments"
            value={formatGHS(payments.filter((p) => p.direction === 'Buyer Payment' && p.status !== 'Paid').reduce((s, p) => s + p.amountGHS, 0))}
            icon={Clock}
          />
          <StatCard label="Suppliers on Your Orders" value={String(scopedFarmers(session, liveContracts).length)} icon={Users} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Contracted Value" value={formatGHS(financeMetrics.contractedValueGHS)} icon={Wallet} />
          <StatCard label="Delivered Value" value={formatGHS(financeMetrics.deliveredValueGHS)} icon={TrendingUp} />
          <StatCard label="Pending Farmer Payments" value={formatGHS(financeMetrics.pendingFarmerPaymentsGHS)} icon={Clock} />
          <StatCard label="Financing Requested" value={formatGHS(financeMetrics.financingRequestedGHS)} icon={PiggyBank} />
          <StatCard label="Delivery Commission" value={formatGHS(deliveryCommission)} icon={Truck} hint="Earned on coordinated logistics" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card padded={false} className="lg:col-span-2">
          <div className="px-6 pt-6">
            <h2 className="font-display text-sm font-semibold text-ink-900">Payments</h2>
            <p className="text-xs text-ink-500">
              {isBuyer ? 'Payments tied to your contracts' : 'Farmer payouts and buyer settlements across active contracts'}
            </p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-y border-ink-100 text-xs font-medium uppercase tracking-wide text-ink-400">
                  <th className="px-6 py-2.5 font-medium">Counterparty</th>
                  <th className="px-3 py-2.5 font-medium">Contract</th>
                  <th className="px-3 py-2.5 font-medium">Method</th>
                  <th className="px-3 py-2.5 font-medium">Amount</th>
                  <th className="px-3 py-2.5 font-medium">Date</th>
                  <th className="px-6 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  const Icon = METHOD_ICON[p.method]
                  return (
                    <tr key={p.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                      <td className="px-6 py-3">
                        <p className="font-medium text-ink-800">{p.counterpartyName}</p>
                        <p className="text-xs text-ink-400">{p.direction}</p>
                      </td>
                      <td className="px-3 py-3 text-ink-600">{p.contractId}</td>
                      <td className="px-3 py-3 text-ink-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 text-ink-400" />
                          {p.method}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-ink-600">{formatGHSFull(p.amountGHS)}</td>
                      <td className="px-3 py-3 text-ink-600">{formatDate(p.date)}</td>
                      <td className="px-6 py-3">
                        <Badge tone={p.status === 'Paid' ? 'good' : p.status === 'Processing' ? 'info' : 'warn'}>{p.status}</Badge>
                      </td>
                    </tr>
                  )
                })}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-center text-sm text-ink-400">
                      No payments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="h-6" />
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="font-display text-sm font-semibold text-ink-700">Payment Channels</h2>
            <p className="mt-1 text-xs text-ink-500">Planned integrations — not yet processing live payments in this prototype.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {['MTN Mobile Money', 'Telecel Cash', 'AirtelTigo Money', 'Bank Transfer'].map((m) => (
                <div key={m} className="flex items-center gap-2 rounded-xl border border-dashed border-ink-200 px-3 py-2.5 text-xs font-medium text-ink-500">
                  {m === 'Bank Transfer' ? <Landmark className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                  {m}
                </div>
              ))}
            </div>
          </Card>

          {!isBuyer && (
            <Card className="border-dashed">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-700" />
                <h2 className="font-display text-sm font-semibold text-ink-800">Finance Intelligence</h2>
                <ComingSoonBadge />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-500">
                Production-based financing insights — recommending working-capital or input-financing amounts from
                contracted volume and delivery reliability — are planned for a future release.
              </p>
            </Card>
          )}

          {!isBuyer && (
            <Card className="border-dashed">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-700" />
                <h2 className="font-display text-sm font-semibold text-ink-800">Climate-Smart Insurance</h2>
                <ComingSoonBadge />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink-500">
                Farmers with a strong Production Readiness Score (see their profile) will be able to apply for
                climate-smart insurance coverage directly from the platform.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

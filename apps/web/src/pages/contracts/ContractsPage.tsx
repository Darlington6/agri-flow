import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader, Card, RiskBadge, Badge } from '@/components/ui'
import { CONTRACT_PIPELINE_STAGES, buyerById, cropById } from '@/data'
import { useSession } from '@/context/SessionContext'
import { usePlatformData } from '@/context/PlatformDataContext'
import { scopedContracts } from '@/lib/scope'
import { isAdminRole } from '@/lib/permissions'
import type { ContractStage } from '@/types'
import { formatDate } from '@/lib/date'
import { formatGHSFull, formatTonnes } from '@/lib/format'

export function ContractsPage() {
  const { session } = useSession()
  const { contracts: liveContracts, matchRequests } = usePlatformData()
  const isBuyer = session?.role === 'Buyer'
  const isFarmer = session?.role === 'Farmer'
  const canManageMatches = isAdminRole(session?.role) || isBuyer
  const contracts = useMemo(() => scopedContracts(session, liveContracts), [session, liveContracts])
  const [stageFilter, setStageFilter] = useState<ContractStage | 'all'>('all')

  const pendingByContract = useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of matchRequests) {
      if (m.status === 'Pending') counts.set(m.contractId, (counts.get(m.contractId) ?? 0) + 1)
    }
    return counts
  }, [matchRequests])

  const stageCounts = useMemo(() => {
    const counts = new Map<ContractStage, number>()
    for (const c of contracts) counts.set(c.stage, (counts.get(c.stage) ?? 0) + 1)
    return counts
  }, [contracts])

  const filtered = stageFilter === 'all' ? contracts : contracts.filter((c) => c.stage === stageFilter)
  const totalPending = contracts.reduce((sum, c) => sum + (pendingByContract.get(c.id) ?? 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Production Contracts"
        subtitle={
          isBuyer || isFarmer
            ? 'Your contract(s) as they move through the pipeline, from demand to payment.'
            : 'Every contract moves through the same pipeline, from buyer demand to farmer payment.'
        }
        actions={
          canManageMatches && totalPending > 0 ? (
            <Badge tone="warn">
              <UserPlus className="h-3 w-3" />
              {totalPending} farmer request{totalPending === 1 ? '' : 's'} awaiting review
            </Badge>
          ) : undefined
        }
      />

      <Card padded={false} className="overflow-x-auto">
        <div className="flex min-w-max items-stretch gap-1 p-2">
          <button
            onClick={() => setStageFilter('all')}
            className={clsx(
              'flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-3 text-center transition-colors',
              stageFilter === 'all' ? 'bg-brand-50' : 'hover:bg-ink-50',
            )}
          >
            <span className={clsx('font-display text-lg font-semibold', stageFilter === 'all' ? 'text-brand-800' : 'text-ink-800')}>
              {contracts.length}
            </span>
            <span className="text-[11px] font-medium text-ink-500">All contracts</span>
          </button>
          {CONTRACT_PIPELINE_STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center">
              <span className="mx-1 hidden text-ink-200 sm:block">→</span>
              <button
                onClick={() => setStageFilter(stage)}
                className={clsx(
                  'flex flex-col items-center gap-1 rounded-xl px-3 py-3 text-center transition-colors',
                  stageFilter === stage ? 'bg-brand-50' : 'hover:bg-ink-50',
                )}
              >
                <span className={clsx('font-display text-lg font-semibold', stageFilter === stage ? 'text-brand-800' : 'text-ink-800')}>
                  {stageCounts.get(stage) ?? 0}
                </span>
                <span className="w-24 text-[11px] font-medium leading-tight text-ink-500">
                  {String(i + 1).padStart(2, '0')}. {stage}
                </span>
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs font-medium uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-medium">Contract</th>
                <th className="px-3 py-3 font-medium">Buyer</th>
                <th className="px-3 py-3 font-medium">Crop</th>
                <th className="px-3 py-3 font-medium">Quantity</th>
                <th className="px-3 py-3 font-medium">Expected Delivery</th>
                <th className="px-3 py-3 font-medium">Value</th>
                <th className="px-3 py-3 font-medium">Stage</th>
                <th className="px-3 py-3 font-medium">Risk</th>
                {canManageMatches && <th className="px-5 py-3 font-medium">Requests</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                  <td className="px-5 py-3">
                    <Link to={`/contracts/${c.id}`} className="font-medium text-brand-700 hover:text-brand-800">
                      {c.id}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-ink-600">{buyerById(c.buyerId)?.name}</td>
                  <td className="px-3 py-3 text-ink-600">{cropById(c.cropId)?.name}</td>
                  <td className="px-3 py-3 text-ink-600">
                    {formatTonnes(c.suppliedQuantityTonnes)} / {formatTonnes(c.contractedQuantityTonnes)}
                  </td>
                  <td className="px-3 py-3 text-ink-600">{formatDate(c.expectedDeliveryDate)}</td>
                  <td className="px-3 py-3 text-ink-600">{formatGHSFull(c.valueGHS)}</td>
                  <td className="px-3 py-3 text-ink-600">{c.stage}</td>
                  <td className="px-3 py-3">
                    <RiskBadge level={c.riskLevel} />
                  </td>
                  {canManageMatches && (
                    <td className="px-5 py-3">
                      {(pendingByContract.get(c.id) ?? 0) > 0 ? (
                        <Link to={`/contracts/${c.id}`}>
                          <Badge tone="warn">
                            <UserPlus className="h-3 w-3" />
                            {pendingByContract.get(c.id)} pending
                          </Badge>
                        </Link>
                      ) : (
                        <span className="text-xs text-ink-300">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="h-2" />
      </Card>
    </div>
  )
}

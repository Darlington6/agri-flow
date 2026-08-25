import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { PageHeader, Card, RiskBadge, inputClass } from '@/components/ui'
import { farmerById, contractById, cropById, buyers } from '@/data'
import { useSession } from '@/context/SessionContext'
import { usePlatformData } from '@/context/PlatformDataContext'
import { scopedProductionCycles } from '@/lib/scope'
import type { CropStage, GhanaRegion, CropId, RiskLevel } from '@/types'
import { formatDate } from '@/lib/date'
import { formatTonnes } from '@/lib/format'

const LIFECYCLE_STAGES: CropStage[] = ['Planned', 'Planted', 'Growing', 'Flowering', 'Maturing', 'Harvest Ready']

const ALL_REGIONS: GhanaRegion[] = ['Ashanti', 'Bono', 'Bono East', 'Northern', 'Upper West', 'Upper East', 'Greater Accra', 'Eastern', 'Volta']
const CROP_IDS: CropId[] = ['tomatoes', 'onions', 'peppers', 'cassava']
const RISKS: RiskLevel[] = ['low', 'medium', 'high']

export function ProductionPage() {
  const { session } = useSession()
  const { productionCycles: liveProductionCycles, contracts: liveContracts } = usePlatformData()
  const isAgent = session?.role === 'Field Agent'
  const baseCycles = useMemo(
    () => scopedProductionCycles(session, liveProductionCycles, liveContracts),
    [session, liveProductionCycles, liveContracts],
  )
  const availableRegions = isAgent && session?.agentRegions ? session.agentRegions : ALL_REGIONS

  const [region, setRegion] = useState<GhanaRegion | 'all'>('all')
  const [crop, setCrop] = useState<CropId | 'all'>('all')
  const [buyerId, setBuyerId] = useState<string | 'all'>('all')
  const [risk, setRisk] = useState<RiskLevel | 'all'>('all')

  const cycles = useMemo(() => {
    return baseCycles
      .filter((c) => c.stage !== 'Harvested')
      .filter((c) => (region === 'all' ? true : c.region === region))
      .filter((c) => (crop === 'all' ? true : c.cropId === crop))
      .filter((c) => (risk === 'all' ? true : c.riskLevel === risk))
      .filter((c) => {
        if (buyerId === 'all') return true
        const contract = c.contractId ? contractById(c.contractId, liveContracts) : undefined
        return contract?.buyerId === buyerId
      })
  }, [baseCycles, region, crop, buyerId, risk, liveContracts])

  const stageCounts = useMemo(() => {
    const counts = new Map<CropStage, number>()
    for (const c of baseCycles) {
      if (c.stage === 'Harvested') continue
      counts.set(c.stage, (counts.get(c.stage) ?? 0) + 1)
    }
    return counts
  }, [baseCycles])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Production Monitoring"
        subtitle={
          isAgent
            ? 'Every active production cycle for the farmers assigned to you.'
            : 'Track every active production cycle against its contracted crop stage.'
        }
      />

      <Card padded={false} className="overflow-x-auto">
        <div className="flex min-w-max items-center gap-1 p-2">
          {LIFECYCLE_STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center">
              {i > 0 && <span className="mx-1 text-ink-200">→</span>}
              <div className="flex flex-col items-center gap-1 rounded-xl px-4 py-3 text-center">
                <span className="font-display text-lg font-semibold text-ink-800">{stageCounts.get(stage) ?? 0}</span>
                <span className="text-[11px] font-medium text-ink-500">{stage}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <select className={inputClass} style={{ width: 170 }} value={region} onChange={(e) => setRegion(e.target.value as typeof region)}>
          <option value="all">All regions</option>
          {availableRegions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className={inputClass} style={{ width: 150 }} value={crop} onChange={(e) => setCrop(e.target.value as typeof crop)}>
          <option value="all">All crops</option>
          {CROP_IDS.map((c) => <option key={c} value={c}>{cropById(c)?.name}</option>)}
        </select>
        <select className={inputClass} style={{ width: 200 }} value={buyerId} onChange={(e) => setBuyerId(e.target.value)}>
          <option value="all">All buyers</option>
          {buyers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className={inputClass} style={{ width: 140 }} value={risk} onChange={(e) => setRisk(e.target.value as typeof risk)}>
          <option value="all">All risk levels</option>
          {RISKS.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
      </div>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs font-medium uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-medium">Farmer</th>
                <th className="px-3 py-3 font-medium">Region</th>
                <th className="px-3 py-3 font-medium">Crop</th>
                <th className="px-3 py-3 font-medium">Stage</th>
                <th className="px-3 py-3 font-medium">Planting Date</th>
                <th className="px-3 py-3 font-medium">Expected Harvest</th>
                <th className="px-3 py-3 font-medium">Yield (exp. / latest)</th>
                <th className="px-5 py-3 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {cycles.map((c) => {
                const farmer = farmerById(c.farmerId)
                return (
                  <tr key={c.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                    <td className="px-5 py-3">
                      <Link to={`/farmers/${c.farmerId}`} className="font-medium text-ink-800 hover:text-brand-700">
                        {farmer?.name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-ink-600">{c.region}</td>
                    <td className="px-3 py-3 text-ink-600">{cropById(c.cropId)?.name}</td>
                    <td className="px-3 py-3">
                      <span
                        className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', {
                          'bg-ink-100 text-ink-600': c.stage === 'Planned' || c.stage === 'Planted',
                          'bg-brand-50 text-brand-700': c.stage === 'Growing' || c.stage === 'Flowering',
                          'bg-status-good-bg text-status-good': c.stage === 'Maturing' || c.stage === 'Harvest Ready',
                        })}
                      >
                        {c.stage}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-ink-600">{formatDate(c.plantingDate)}</td>
                    <td className="px-3 py-3 text-ink-600">{formatDate(c.expectedHarvestDate)}</td>
                    <td className="px-3 py-3 text-ink-600">
                      {formatTonnes(c.expectedYieldTonnes)} / {formatTonnes(c.latestYieldEstimateTonnes)}
                    </td>
                    <td className="px-5 py-3">
                      <RiskBadge level={c.riskLevel} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="h-2" />
      </Card>
    </div>
  )
}

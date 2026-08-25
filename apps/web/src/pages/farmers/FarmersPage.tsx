import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { PageHeader, Card, Badge, RiskBadge, KycBadge, inputClass } from '@/components/ui'
import { cropById, dashboardMetrics } from '@/data'
import { useSession } from '@/context/SessionContext'
import { usePlatformData, resolveKycStatus } from '@/context/PlatformDataContext'
import { scopedFarmers } from '@/lib/scope'
import type { GhanaRegion, CropId } from '@/types'
import { formatTonnes } from '@/lib/format'

const ALL_REGIONS: GhanaRegion[] = [
  'Ashanti', 'Bono', 'Bono East', 'Northern', 'Upper West', 'Upper East', 'Greater Accra', 'Eastern', 'Volta',
]
const CROP_IDS: CropId[] = ['tomatoes', 'onions', 'peppers', 'cassava']

export function FarmersPage() {
  const { session } = useSession()
  const { contracts: liveContracts, kycOverrides } = usePlatformData()
  const isAgent = session?.role === 'Field Agent'
  const baseFarmers = useMemo(() => scopedFarmers(session, liveContracts), [session, liveContracts])
  const availableRegions = isAgent && session?.agentRegions ? session.agentRegions : ALL_REGIONS

  const [region, setRegion] = useState<GhanaRegion | 'all'>('all')
  const [crop, setCrop] = useState<CropId | 'all'>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    return baseFarmers.filter((f) => {
      if (region !== 'all' && f.region !== region) return false
      if (crop !== 'all' && f.primaryCropId !== crop) return false
      if (query && !f.name.toLowerCase().includes(query.toLowerCase()) && !f.community.toLowerCase().includes(query.toLowerCase())) return false
      return true
    })
  }, [baseFarmers, region, crop, query])

  // A Farmer has exactly one farmer in scope — themselves. Send them
  // straight to their profile rather than a one-row "directory."
  if (session?.role === 'Farmer' && session.farmerId) {
    return <Navigate to={`/farmers/${session.farmerId}`} replace />
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Farmer Network"
        subtitle={
          isAgent
            ? `Showing ${filtered.length} of ${baseFarmers.length} farmers assigned to you.`
            : `Showing ${filtered.length} of ${dashboardMetrics.activeFarmers} farmers in the pilot network.`
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            className={`${inputClass} pl-9`}
            placeholder="Search name or community…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className={inputClass} style={{ width: 180 }} value={region} onChange={(e) => setRegion(e.target.value as typeof region)}>
          <option value="all">All regions</option>
          {availableRegions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select className={inputClass} style={{ width: 160 }} value={crop} onChange={(e) => setCrop(e.target.value as typeof crop)}>
          <option value="all">All crops</option>
          {CROP_IDS.map((c) => (
            <option key={c} value={c}>
              {cropById(c)?.name}
            </option>
          ))}
        </select>
      </div>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs font-medium uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-medium">Farmer</th>
                <th className="px-3 py-3 font-medium">Region / Community</th>
                <th className="px-3 py-3 font-medium">Crop</th>
                <th className="px-3 py-3 font-medium">Farm size</th>
                <th className="px-3 py-3 font-medium">Contracted</th>
                <th className="px-3 py-3 font-medium">Stage</th>
                <th className="px-3 py-3 font-medium">Reliability</th>
                <th className="px-3 py-3 font-medium">KYC</th>
                <th className="px-5 py-3 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                  <td className="px-5 py-3">
                    <Link to={`/farmers/${f.id}`} className="font-medium text-ink-800 hover:text-brand-700">
                      {f.name}
                    </Link>
                    <p className="text-xs text-ink-400">{f.climateSmartScore}% climate-smart score</p>
                  </td>
                  <td className="px-3 py-3 text-ink-600">
                    {f.region}
                    <p className="text-xs text-ink-400">{f.community}</p>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone="neutral">{cropById(f.primaryCropId)?.name}</Badge>
                  </td>
                  <td className="px-3 py-3 text-ink-600">{f.farmSizeHectares} ha</td>
                  <td className="px-3 py-3 text-ink-600">{formatTonnes(f.contractedQuantityTonnes)}</td>
                  <td className="px-3 py-3 text-ink-600">{f.currentCropStage}</td>
                  <td className="px-3 py-3 text-ink-600">{f.reliabilityScore}%</td>
                  <td className="px-3 py-3">
                    <KycBadge status={resolveKycStatus(f.kycStatus, f.id, kycOverrides)} />
                  </td>
                  <td className="px-5 py-3">
                    <RiskBadge level={f.riskStatus} />
                  </td>
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

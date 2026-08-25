import { CloudRain, Thermometer, Droplets, Gauge, Satellite } from 'lucide-react'
import { PageHeader, Card, RiskBadge } from '@/components/ui'
import { overallClimateSnapshot, climateTrend, regionClimateRisks } from '@/data'
import { useSession } from '@/context/SessionContext'
import { scopedRegions } from '@/lib/scope'
import { MiniAreaChart } from '@/components/charts/MiniAreaChart'
import type { RiskLevel } from '@/types'

const RISK_LABEL: Record<RiskLevel, string> = { low: 'Low', medium: 'Medium', high: 'High' }
const climateTrendData = climateTrend as unknown as Record<string, unknown>[]

export function ClimatePage() {
  const { session } = useSession()
  const regions = scopedRegions(session)
  const isScoped = regions.length > 0
  const visibleRegionRisks = isScoped ? regionClimateRisks.filter((r) => regions.includes(r.region)) : regionClimateRisks

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Climate Intelligence"
        subtitle={
          isScoped
            ? 'Rainfall, heat and water stress signals for the regions relevant to you.'
            : 'Rainfall, heat and water stress signals tracked against active production.'
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-500">Rainfall Risk</span>
            <CloudRain className="h-4 w-4 text-ink-400" />
          </div>
          <p className="mt-2 font-display text-xl font-semibold text-ink-900">{RISK_LABEL[overallClimateSnapshot.rainfallRisk]}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-500">Heat Stress</span>
            <Thermometer className="h-4 w-4 text-ink-400" />
          </div>
          <p className="mt-2 font-display text-xl font-semibold text-ink-900">{RISK_LABEL[overallClimateSnapshot.heatStress]}</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-500">Water Stress</span>
            <Droplets className="h-4 w-4 text-ink-400" />
          </div>
          <p className="mt-2 font-display text-xl font-semibold text-ink-900">{RISK_LABEL[overallClimateSnapshot.waterStress]}</p>
        </Card>
        <Card className="border-status-warn-bg bg-status-warn-bg/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-500">Overall Climate Risk</span>
            <Gauge className="h-4 w-4 text-status-warn" />
          </div>
          <p className="mt-2 font-display text-xl font-semibold text-status-warn">{overallClimateSnapshot.overallRisk}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium text-ink-500">Rainfall (mm / week)</p>
          <MiniAreaChart data={climateTrendData} dataKey="rainfallMm" xKey="week" unit="mm" />
        </Card>
        <Card>
          <p className="text-xs font-medium text-ink-500">Average Temperature (°C)</p>
          <MiniAreaChart data={climateTrendData} dataKey="avgTempC" xKey="week" unit="°C" />
        </Card>
        <Card>
          <p className="text-xs font-medium text-ink-500">Crop Stress Index</p>
          <MiniAreaChart data={climateTrendData} dataKey="cropStressIndex" xKey="week" />
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-ink-700">Farms at Risk — Regional Grid</h2>
          <span className="flex items-center gap-1.5 text-xs text-ink-400">
            <Satellite className="h-3.5 w-3.5" />
            Illustrative regional grid — satellite/weather feed integration planned
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRegionRisks.map((r) => (
            <div key={r.region} className="rounded-xl border border-ink-100 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-ink-900">{r.region}</p>
                <RiskBadge level={r.overallRisk} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-lg bg-ink-50 py-1.5">
                  <p className="text-ink-400">Rain</p>
                  <p className="font-medium capitalize text-ink-700">{r.rainfallRisk}</p>
                </div>
                <div className="rounded-lg bg-ink-50 py-1.5">
                  <p className="text-ink-400">Heat</p>
                  <p className="font-medium capitalize text-ink-700">{r.heatStress}</p>
                </div>
                <div className="rounded-lg bg-ink-50 py-1.5">
                  <p className="text-ink-400">Water</p>
                  <p className="font-medium capitalize text-ink-700">{r.waterStress}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-500">{r.notes}</p>
              <p className="mt-2 text-xs font-medium text-ink-400">{r.farmsAtRisk} farm(s) flagged</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

import type { HarvestForecast } from '@/types'
import { productionCycles } from './production'
import { contractById } from './contracts'

export const harvestForecasts: HarvestForecast[] = productionCycles.map((p) => {
  const contract = p.contractId ? contractById(p.contractId) : undefined
  return {
    id: `HF-${p.farmerId}`,
    farmerId: p.farmerId,
    contractId: p.contractId,
    buyerId: contract?.buyerId,
    cropId: p.cropId,
    region: p.region,
    expectedQuantityTonnes: p.latestYieldEstimateTonnes,
    expectedHarvestDate: p.expectedHarvestDate,
    riskLevel: p.riskLevel,
  } satisfies HarvestForecast
})

export const upcomingHarvests = (withinDays = 90, list: HarvestForecast[] = harvestForecasts) => {
  const now = new Date('2026-08-20T00:00:00')
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() + withinDays)
  return list
    .filter((h) => {
      const d = new Date(h.expectedHarvestDate + 'T00:00:00')
      return d >= now && d <= cutoff
    })
    .sort((a, b) => a.expectedHarvestDate.localeCompare(b.expectedHarvestDate))
}
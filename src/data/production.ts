import type { ProductionCycle, CropId } from '@/types'
import { farmers } from './farmers'
import { contractById } from './contracts'
import { addDays } from '@/lib/date'

export const CROP_CYCLE_DAYS: Record<CropId, number> = {
  tomatoes: 90,
  onions: 100,
  peppers: 100,
  cassava: 270,
}

// Derived from the farmer network: each contracted farmer has one active
// production cycle. Harvest date is backed out from the contract's delivery
// date to leave a short aggregation/logistics window.
export const productionCycles: ProductionCycle[] = farmers
  .filter((f) => f.contractIds.length > 0)
  .map((f) => {
    const contract = contractById(f.contractIds[0])
    const expectedHarvestDate = contract ? addDays(contract.expectedDeliveryDate, -10) : addDays(f.lastUpdateAt, 21)
    const plantingDate = addDays(expectedHarvestDate, -CROP_CYCLE_DAYS[f.primaryCropId])

    return {
      id: `PC-${f.id}`,
      farmerId: f.id,
      contractId: contract?.id,
      cropId: f.primaryCropId,
      region: f.region,
      plantingDate,
      expectedHarvestDate,
      expectedYieldTonnes: f.expectedYieldTonnes,
      latestYieldEstimateTonnes: f.latestYieldEstimateTonnes,
      stage: f.currentCropStage,
      riskLevel: f.riskStatus,
    } satisfies ProductionCycle
  })

export const productionByFarmer = (farmerId: string, list: ProductionCycle[] = productionCycles) =>
  list.filter((p) => p.farmerId === farmerId)
import type { DeliveryJob, DeliveryPartner } from '@/types'

// A deliberately simple, transparent scoring heuristic standing in for what
// would eventually be a real dispatch/matching algorithm (distance, live
// capacity, historical on-time rate, price). Used both to rank partners for
// a job (buyer/admin "recommended partners" view) and to rank jobs for a
// partner (their own job board) — same inputs, same weights, either
// direction. This is a DEMO metric, not a real optimization.
export interface ScoredPartner {
  partner: DeliveryPartner
  score: number
  regionMatch: boolean
  vehicleFit: boolean
}

function locationMatchesRegion(location: string, regions: DeliveryPartner['regions']): boolean {
  return regions.some((region) => location.includes(region))
}

function vehicleFitsLoad(vehicleType: string, quantityTonnes: number): boolean {
  const isHeavyVehicle = /truck/i.test(vehicleType)
  return quantityTonnes > 3 ? isHeavyVehicle : true
}

export function scorePartnerForJob(partner: DeliveryPartner, job: DeliveryJob): ScoredPartner {
  const regionMatch = locationMatchesRegion(job.fromLocation, partner.regions) || locationMatchesRegion(job.toLocation, partner.regions)
  const vehicleFit = vehicleFitsLoad(partner.vehicleType, job.quantityTonnes)

  let score = 0
  score += regionMatch ? 50 : 0
  score += partner.rating * 8 // up to 40
  score += vehicleFit ? 10 : 0

  return { partner, score, regionMatch, vehicleFit }
}

export function rankPartnersForJob(job: DeliveryJob, partners: DeliveryPartner[]): ScoredPartner[] {
  return partners.map((p) => scorePartnerForJob(p, job)).sort((a, b) => b.score - a.score)
}

export function rankJobsForPartner(partner: DeliveryPartner, jobs: DeliveryJob[]): { job: DeliveryJob; score: number; regionMatch: boolean }[] {
  return jobs
    .map((job) => {
      const s = scorePartnerForJob(partner, job)
      return { job, score: s.score, regionMatch: s.regionMatch }
    })
    .sort((a, b) => b.score - a.score)
}

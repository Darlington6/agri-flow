import type { DeliveryJob, DeliveryPartner } from '@/types'
import { cropById } from '@/data/crops'
import { isInServiceAreas } from './places'

// Matches delivery partners and jobs with a transparent, rule-based score out
// of 100. Used both ways with the same rules: partners ranked for a job (the
// buyer/admin "recommended partners" view) and jobs ranked for a partner
// (their own job board).
//
// Works in any country: places are matched by ISO country code and
// administrative area (region / province / county), never by text.
// Road distance, live availability and price aren't modelled yet; they
// arrive with real data from the API.
export const SCORE_WEIGHTS = {
  pickupCovered: 40, // the partner can reach the pickup: the part that matters most
  dropoffCovered: 20,
  capacity: 20, // full points for one trip, divided by the number of trips needed
  coldChain: 10, // perishable crops need a refrigerated vehicle
  rating: 10, // scaled from the 0–5 rating
} as const

export type Coverage = 'both' | 'pickup' | 'dropoff' | 'none'

export interface ScoreBreakdown {
  pickupCovered: number
  dropoffCovered: number
  capacity: number
  coldChain: number
  rating: number
}

export interface ScoredPartner {
  partner: DeliveryPartner
  score: number
  breakdown: ScoreBreakdown
  coverage: Coverage
  /** Covers at least one end of the trip; partners covering neither are never recommended. */
  eligible: boolean
  /** Shown as "Good match": covers at least one end of the trip. */
  regionMatch: boolean
  /** One trip, and cold chain satisfied when the crop needs it. */
  vehicleFit: boolean
  trips: number
  coldChainOk: boolean
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

export function scorePartnerForJob(partner: DeliveryPartner, job: DeliveryJob): ScoredPartner {
  const coversPickup = isInServiceAreas(job.from, partner.serviceAreas)
  const coversDropoff = isInServiceAreas(job.to, partner.serviceAreas)
  const coverage: Coverage = coversPickup && coversDropoff ? 'both' : coversPickup ? 'pickup' : coversDropoff ? 'dropoff' : 'none'

  const capacity = partner.vehicle.capacityTonnes
  const trips = capacity > 0 ? Math.max(1, Math.ceil(job.quantityTonnes / capacity)) : Number.POSITIVE_INFINITY

  const perishable = cropById(job.cropId)?.perishable ?? false
  const coldChainOk = !perishable || partner.vehicle.refrigerated

  const rating = Math.min(5, Math.max(0, partner.rating))

  const breakdown: ScoreBreakdown = {
    pickupCovered: coversPickup ? SCORE_WEIGHTS.pickupCovered : 0,
    dropoffCovered: coversDropoff ? SCORE_WEIGHTS.dropoffCovered : 0,
    capacity: Number.isFinite(trips) ? round1(SCORE_WEIGHTS.capacity / trips) : 0,
    coldChain: coldChainOk ? SCORE_WEIGHTS.coldChain : 0,
    rating: round1((rating / 5) * SCORE_WEIGHTS.rating),
  }
  const score = round1(Object.values(breakdown).reduce((sum, points) => sum + points, 0))

  return {
    partner,
    score,
    breakdown,
    coverage,
    eligible: coverage !== 'none',
    regionMatch: coverage !== 'none',
    vehicleFit: trips === 1 && coldChainOk,
    trips,
    coldChainOk,
  }
}

/** Every partner, best first. Filter on `eligible` before recommending. */
export function rankPartnersForJob(job: DeliveryJob, partners: DeliveryPartner[]): ScoredPartner[] {
  return partners.map((p) => scorePartnerForJob(p, job)).sort((a, b) => b.score - a.score)
}

/** Only partners that cover at least one end of the trip, best first. */
export function recommendPartnersForJob(job: DeliveryJob, partners: DeliveryPartner[]): ScoredPartner[] {
  return rankPartnersForJob(job, partners).filter((s) => s.eligible)
}

/** Every job for a partner's job board, best first. Out-of-area jobs stay visible but rank last. */
export function rankJobsForPartner(partner: DeliveryPartner, jobs: DeliveryJob[]): { job: DeliveryJob; score: number; regionMatch: boolean }[] {
  return jobs
    .map((job) => {
      const s = scorePartnerForJob(partner, job)
      return { job, score: s.score, regionMatch: s.regionMatch }
    })
    .sort((a, b) => b.score - a.score)
}

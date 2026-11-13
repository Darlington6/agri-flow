import { describe, expect, it } from 'vitest'
import type { DeliveryJob, DeliveryPartner } from '@/types'
import { rankJobsForPartner, rankPartnersForJob, recommendPartnersForJob, SCORE_WEIGHTS, scorePartnerForJob } from './deliveryScore'

function partner(overrides: Partial<DeliveryPartner> = {}): DeliveryPartner {
  return {
    id: 'p-1',
    name: 'Test Movers',
    type: 'Company',
    vehicle: { label: 'Truck (10t)', capacityTonnes: 10, refrigerated: false },
    serviceAreas: [{ countryCode: 'RW', areas: ['Northern Province', 'Kigali'] }],
    rating: 5,
    contactPhone: '+000',
    ...overrides,
  }
}

// A non-perishable load (onions) from Musanze to Kigali, Rwanda.
function job(overrides: Partial<DeliveryJob> = {}): DeliveryJob {
  return {
    id: 'j-1',
    cropId: 'onions',
    quantityTonnes: 8,
    from: { name: 'Musanze', area: 'Northern Province', countryCode: 'RW' },
    to: { name: 'Kigali', area: 'Kigali', countryCode: 'RW' },
    scheduledDate: '2026-11-20',
    status: 'Unassigned',
    feeGHS: 1000,
    commissionGHS: 100,
    ...overrides,
  }
}

describe('scorePartnerForJob', () => {
  it('gives full marks to a partner covering both ends, in one trip, with a top rating', () => {
    const s = scorePartnerForJob(partner(), job())
    expect(s.coverage).toBe('both')
    expect(s.trips).toBe(1)
    expect(s.score).toBe(100)
    expect(s.vehicleFit).toBe(true)
  })

  it('weights the pickup more than the drop-off', () => {
    const pickupOnly = scorePartnerForJob(partner({ serviceAreas: [{ countryCode: 'RW', areas: ['Northern Province'] }] }), job())
    const dropoffOnly = scorePartnerForJob(partner({ serviceAreas: [{ countryCode: 'RW', areas: ['Kigali'] }] }), job())
    expect(pickupOnly.coverage).toBe('pickup')
    expect(dropoffOnly.coverage).toBe('dropoff')
    expect(pickupOnly.score - dropoffOnly.score).toBe(SCORE_WEIGHTS.pickupCovered - SCORE_WEIGHTS.dropoffCovered)
  })

  it('marks partners covering neither end as ineligible', () => {
    const s = scorePartnerForJob(partner({ serviceAreas: [{ countryCode: 'KE' }] }), job())
    expect(s.coverage).toBe('none')
    expect(s.eligible).toBe(false)
    expect(s.regionMatch).toBe(false)
  })

  it('works out trips from vehicle capacity, not the vehicle name', () => {
    const smallTruck = partner({ vehicle: { label: 'Truck (3t)', capacityTonnes: 3, refrigerated: false } })
    const s = scorePartnerForJob(smallTruck, job({ quantityTonnes: 8 }))
    expect(s.trips).toBe(3)
    expect(s.vehicleFit).toBe(false)
    expect(s.breakdown.capacity).toBeCloseTo(SCORE_WEIGHTS.capacity / 3, 1)
  })

  it('counts an exactly full vehicle as one trip', () => {
    expect(scorePartnerForJob(partner(), job({ quantityTonnes: 10 })).trips).toBe(1)
  })

  it('requires a refrigerated vehicle for perishable crops', () => {
    const tomatoes = job({ cropId: 'tomatoes' })
    const open = scorePartnerForJob(partner(), tomatoes)
    const cold = scorePartnerForJob(partner({ vehicle: { label: 'Reefer (10t)', capacityTonnes: 10, refrigerated: true } }), tomatoes)
    expect(open.coldChainOk).toBe(false)
    expect(open.vehicleFit).toBe(false)
    expect(cold.coldChainOk).toBe(true)
    expect(cold.score - open.score).toBe(SCORE_WEIGHTS.coldChain)
  })

  it('does not require refrigeration for non-perishable crops', () => {
    expect(scorePartnerForJob(partner(), job({ cropId: 'cassava' })).coldChainOk).toBe(true)
  })

  it('scales the rating to its weight and clamps out-of-range ratings', () => {
    expect(scorePartnerForJob(partner({ rating: 2.5 }), job()).breakdown.rating).toBe(SCORE_WEIGHTS.rating / 2)
    expect(scorePartnerForJob(partner({ rating: 9 }), job()).breakdown.rating).toBe(SCORE_WEIGHTS.rating)
  })

  it('never scores above 100', () => {
    const s = scorePartnerForJob(partner({ rating: 99 }), job())
    expect(s.score).toBeLessThanOrEqual(100)
  })
})

describe('rankPartnersForJob and recommendPartnersForJob', () => {
  const local = partner({ id: 'local', rating: 3 })
  const crossBorder = partner({ id: 'cross-border', serviceAreas: [{ countryCode: 'UG' }], rating: 5 })
  const halfway = partner({ id: 'halfway', serviceAreas: [{ countryCode: 'RW', areas: ['Kigali'] }], rating: 5 })

  it('ranks every partner, best first', () => {
    expect(rankPartnersForJob(job(), [crossBorder, halfway, local]).map((s) => s.partner.id)).toEqual(['local', 'halfway', 'cross-border'])
  })

  it('only recommends partners that cover at least one end of the trip', () => {
    expect(recommendPartnersForJob(job(), [crossBorder, halfway, local]).map((s) => s.partner.id)).toEqual(['local', 'halfway'])
  })

  it('returns an empty list when there are no partners', () => {
    expect(rankPartnersForJob(job(), [])).toEqual([])
  })
})

describe('rankJobsForPartner', () => {
  it('puts jobs in the partner’s areas first, but keeps the others visible', () => {
    const inArea = job({ id: 'near' })
    const outOfArea = job({
      id: 'far',
      from: { name: 'Nakuru', area: 'Nakuru', countryCode: 'KE' },
      to: { name: 'Nairobi', area: 'Nairobi', countryCode: 'KE' },
    })
    const ranked = rankJobsForPartner(partner(), [outOfArea, inArea])
    expect(ranked.map((r) => r.job.id)).toEqual(['near', 'far'])
    expect(ranked.map((r) => r.regionMatch)).toEqual([true, false])
  })
})

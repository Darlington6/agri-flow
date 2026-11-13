import { describe, expect, it } from 'vitest'
import type { DeliveryJob, DeliveryPartner } from '@/types'
import { rankJobsForPartner, rankPartnersForJob, scorePartnerForJob } from './deliveryScore'

function partner(overrides: Partial<DeliveryPartner> = {}): DeliveryPartner {
  return {
    id: 'p-1',
    name: 'Test Movers',
    type: 'Company',
    vehicleType: 'Truck (10t)',
    regions: ['Ashanti'],
    rating: 4,
    contactPhone: '+000',
    ...overrides,
  }
}

function job(overrides: Partial<DeliveryJob> = {}): DeliveryJob {
  return {
    id: 'j-1',
    cropId: 'tomatoes',
    quantityTonnes: 2,
    fromLocation: 'Ejura, Ashanti',
    toLocation: 'Tamale, Northern',
    scheduledDate: '2026-11-20',
    status: 'Unassigned',
    feeGHS: 1000,
    commissionGHS: 100,
    ...overrides,
  }
}

describe('scorePartnerForJob', () => {
  it('adds 50 for a region match, 8 per rating point and 10 for a fitting vehicle', () => {
    const result = scorePartnerForJob(partner({ rating: 4 }), job())
    expect(result).toMatchObject({ regionMatch: true, vehicleFit: true, score: 50 + 32 + 10 })
  })

  it('matches the region on either end of the trip', () => {
    const atDestination = job({ fromLocation: 'Tamale, Northern', toLocation: 'Kumasi, Ashanti' })
    expect(scorePartnerForJob(partner(), atDestination).regionMatch).toBe(true)
  })

  it('gives no region points when neither end is in the partner’s regions', () => {
    const elsewhere = job({ fromLocation: 'Ho, Volta', toLocation: 'Tamale, Northern' })
    const result = scorePartnerForJob(partner({ rating: 4 }), elsewhere)
    expect(result.regionMatch).toBe(false)
    expect(result.score).toBe(32 + 10)
  })

  it('requires a truck for loads over 3 tonnes', () => {
    const heavy = job({ quantityTonnes: 8 })
    expect(scorePartnerForJob(partner({ vehicleType: 'Motorbike' }), heavy).vehicleFit).toBe(false)
    expect(scorePartnerForJob(partner({ vehicleType: 'Truck (10t)' }), heavy).vehicleFit).toBe(true)
  })

  it('accepts any vehicle for loads of 3 tonnes or less', () => {
    expect(scorePartnerForJob(partner({ vehicleType: 'Pickup' }), job({ quantityTonnes: 3 })).vehicleFit).toBe(true)
  })
})

describe('rankPartnersForJob', () => {
  it('puts the best-scoring partner first', () => {
    const local = partner({ id: 'local', regions: ['Ashanti'], rating: 3 })
    const remote = partner({ id: 'remote', regions: ['Volta'], rating: 5 })
    const ranked = rankPartnersForJob(job(), [remote, local])
    expect(ranked.map((r) => r.partner.id)).toEqual(['local', 'remote'])
  })

  it('returns an empty list when there are no partners', () => {
    expect(rankPartnersForJob(job(), [])).toEqual([])
  })
})

describe('rankJobsForPartner', () => {
  it('puts jobs in the partner’s regions first', () => {
    const inRegion = job({ id: 'near', fromLocation: 'Ejura, Ashanti' })
    const outOfRegion = job({ id: 'far', fromLocation: 'Ho, Volta', toLocation: 'Tamale, Northern' })
    const ranked = rankJobsForPartner(partner(), [outOfRegion, inRegion])
    expect(ranked.map((r) => r.job.id)).toEqual(['near', 'far'])
    expect(ranked[0].regionMatch).toBe(true)
  })
})

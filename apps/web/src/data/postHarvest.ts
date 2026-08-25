import type { PostHarvestCapacity } from '@/types'

export const currentPostHarvestSnapshot: PostHarvestCapacity = {
  weekLabel: 'Next 7 days',
  upcomingHarvestTonnes: 46.8,
  storageRequiredTonnes: 38,
  storageAvailableTonnes: 31,
  riskBreakdown: {
    highRiskTonnes: 12,
    mediumRiskTonnes: 19,
    lowRiskTonnes: 15.8,
  },
  recommendedActions: [
    'Allocate cold storage to highest-risk lots first',
    'Redirect surplus produce to alternate buyers',
    'Confirm buyer pickup windows for harvest-ready lots',
    'Schedule aggregation runs for dispersed farms',
    'Prioritize collection of high-risk perishable crops',
  ],
}

export const postHarvestWeeklyOutlook: { weekLabel: string; upcomingHarvestTonnes: number; storageAvailableTonnes: number }[] = [
  { weekLabel: 'This week', upcomingHarvestTonnes: 46.8, storageAvailableTonnes: 31 },
  { weekLabel: 'Next week', upcomingHarvestTonnes: 38.2, storageAvailableTonnes: 34 },
  { weekLabel: 'Week 3', upcomingHarvestTonnes: 29.5, storageAvailableTonnes: 36 },
  { weekLabel: 'Week 4', upcomingHarvestTonnes: 33.6, storageAvailableTonnes: 36 },
]
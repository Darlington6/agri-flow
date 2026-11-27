// Network-wide business metrics for the Super Admin / Executive view. Like
// dashboardMetrics, these are authored demo figures representing the full
// simulated pilot network — not computed from the browsable sample data —
// and are explicitly DEMO / simulated, never real financials.

export const platformRevenueMetrics = {
  transactionFeeRateBps: 300, // 3% demo take rate on delivered/paid contract value
  subscriptionRevenue: 2_700_000, // demo monthly recurring revenue from buyer subscription plans
  financingReferralRevenue: 0, // not live yet — see Finance Intelligence "Coming soon"
} as const

// Monthly network snapshot. August matches the current dashboardMetrics
// figures (384 farmers, RWF 276M contracted) as the latest point.
export const networkGrowthTrend: { month: string; farmers: number; buyers: number; contractedValue: number }[] = [
  { month: 'Mar', farmers: 210, buyers: 3, contractedValue: 96_000_000 },
  { month: 'Apr', farmers: 248, buyers: 4, contractedValue: 122_000_000 },
  { month: 'May', farmers: 275, buyers: 4, contractedValue: 147_000_000 },
  { month: 'Jun', farmers: 301, buyers: 5, contractedValue: 177_000_000 },
  { month: 'Jul', farmers: 342, buyers: 6, contractedValue: 228_000_000 },
  { month: 'Aug', farmers: 384, buyers: 6, contractedValue: 276_000_000 },
]

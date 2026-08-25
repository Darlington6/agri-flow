// Network-wide business metrics for the Super Admin / Executive view. Like
// dashboardMetrics, these are authored demo figures representing the full
// simulated pilot network — not computed from the browsable sample data —
// and are explicitly DEMO / simulated, never real financials.

export const platformRevenueMetrics = {
  transactionFeeRateBps: 300, // 3% demo take rate on delivered/paid contract value
  subscriptionRevenueGHS: 18_000, // demo monthly recurring revenue from buyer subscription plans
  financingReferralRevenueGHS: 0, // not live yet — see Finance Intelligence "Coming soon"
} as const

// Monthly network snapshot. August matches the current dashboardMetrics
// figures (384 farmers, GHS 1.84M contracted) as the latest point.
export const networkGrowthTrend: { month: string; farmers: number; buyers: number; contractedValueGHS: number }[] = [
  { month: 'Mar', farmers: 210, buyers: 3, contractedValueGHS: 640_000 },
  { month: 'Apr', farmers: 248, buyers: 4, contractedValueGHS: 810_000 },
  { month: 'May', farmers: 275, buyers: 4, contractedValueGHS: 980_000 },
  { month: 'Jun', farmers: 301, buyers: 5, contractedValueGHS: 1_180_000 },
  { month: 'Jul', farmers: 342, buyers: 6, contractedValueGHS: 1_520_000 },
  { month: 'Aug', farmers: 384, buyers: 6, contractedValueGHS: 1_840_000 },
]

// Network-wide KPI snapshot. In production this would be a server-computed
// aggregate over the full farmer/contract/payment tables; for the prototype
// it is authored to represent a plausible pilot-scale network, of which the
// records in farmers.ts / contracts.ts are a representative browsable sample.
// All figures are DEMO / simulated data.

export const dashboardMetrics = {
  contractedDemandGHS: 1_840_000,
  expectedSupplyTonnes: 428,
  activeFarmers: 384,
  atRiskContracts: 7,
} as const

export const financeMetrics = {
  contractedValueGHS: 1_840_000,
  deliveredValueGHS: 740_000,
  pendingFarmerPaymentsGHS: 96_000,
  financingRequestedGHS: 240_000,
} as const

export const supplyDemandSeries: {
  week: string
  tomatoes: { demand: number; supply: number }
  onions: { demand: number; supply: number }
  peppers: { demand: number; supply: number }
  cassava: { demand: number; supply: number }
}[] = [
  { week: 'Wk 1', tomatoes: { demand: 12, supply: 10 }, onions: { demand: 8, supply: 7 }, peppers: { demand: 5, supply: 5 }, cassava: { demand: 20, supply: 18 } },
  { week: 'Wk 2', tomatoes: { demand: 13, supply: 11 }, onions: { demand: 9, supply: 8 }, peppers: { demand: 5, supply: 4 }, cassava: { demand: 22, supply: 19 } },
  { week: 'Wk 3', tomatoes: { demand: 14, supply: 13 }, onions: { demand: 9, supply: 8 }, peppers: { demand: 6, supply: 5 }, cassava: { demand: 21, supply: 20 } },
  { week: 'Wk 4', tomatoes: { demand: 15, supply: 13 }, onions: { demand: 10, supply: 9 }, peppers: { demand: 6, supply: 6 }, cassava: { demand: 23, supply: 22 } },
  { week: 'Wk 5', tomatoes: { demand: 16, supply: 14 }, onions: { demand: 11, supply: 9 }, peppers: { demand: 7, supply: 6 }, cassava: { demand: 24, supply: 21 } },
  { week: 'Wk 6', tomatoes: { demand: 18, supply: 15 }, onions: { demand: 11, supply: 10 }, peppers: { demand: 7, supply: 6 }, cassava: { demand: 25, supply: 23 } },
  { week: 'Wk 7', tomatoes: { demand: 19, supply: 17 }, onions: { demand: 12, supply: 10 }, peppers: { demand: 8, supply: 7 }, cassava: { demand: 26, supply: 24 } },
  { week: 'Wk 8', tomatoes: { demand: 20, supply: 18.4 }, onions: { demand: 12, supply: 9.1 }, peppers: { demand: 8, supply: 7.5 }, cassava: { demand: 28, supply: 25 } },
  { week: 'Wk 9', tomatoes: { demand: 20, supply: 19 }, onions: { demand: 13, supply: 10 }, peppers: { demand: 9, supply: 8 }, cassava: { demand: 28, supply: 26 } },
  { week: 'Wk 10', tomatoes: { demand: 21, supply: 19.5 }, onions: { demand: 13, supply: 11 }, peppers: { demand: 9, supply: 8 }, cassava: { demand: 29, supply: 27 } },
  { week: 'Wk 11', tomatoes: { demand: 22, supply: 20 }, onions: { demand: 14, supply: 12 }, peppers: { demand: 10, supply: 9 }, cassava: { demand: 30, supply: 28 } },
  { week: 'Wk 12', tomatoes: { demand: 22, supply: 20.5 }, onions: { demand: 14, supply: 12 }, peppers: { demand: 10, supply: 9 }, cassava: { demand: 31, supply: 29 } },
]
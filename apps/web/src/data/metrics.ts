// Network-wide KPI snapshot. In production this would be a server-computed
// aggregate over the full farmer/contract/payment tables; for the prototype
// it is authored to represent a plausible pilot-scale network, of which the
// records in farmers.ts / contracts.ts are a representative browsable sample.
// All figures are DEMO / simulated data.

export const dashboardMetrics = {
  contractedDemand: 276_000_000,
  expectedSupplyTonnes: 428,
  activeFarmers: 384,
  atRiskContracts: 7,
} as const

export const financeMetrics = {
  contractedValue: 276_000_000,
  deliveredValue: 111_000_000,
  pendingFarmerPayments: 14_400_000,
  financingRequested: 36_000_000,
} as const

export const supplyDemandSeries: {
  week: string
  irish_potato: { demand: number; supply: number }
  beans: { demand: number; supply: number }
  avocado: { demand: number; supply: number }
  maize: { demand: number; supply: number }
}[] = [
  {
    week: 'Wk 1',
    irish_potato: { demand: 12, supply: 10 },
    beans: { demand: 8, supply: 7 },
    avocado: { demand: 5, supply: 5 },
    maize: { demand: 20, supply: 18 },
  },
  {
    week: 'Wk 2',
    irish_potato: { demand: 13, supply: 11 },
    beans: { demand: 9, supply: 8 },
    avocado: { demand: 5, supply: 4 },
    maize: { demand: 22, supply: 19 },
  },
  {
    week: 'Wk 3',
    irish_potato: { demand: 14, supply: 13 },
    beans: { demand: 9, supply: 8 },
    avocado: { demand: 6, supply: 5 },
    maize: { demand: 21, supply: 20 },
  },
  {
    week: 'Wk 4',
    irish_potato: { demand: 15, supply: 13 },
    beans: { demand: 10, supply: 9 },
    avocado: { demand: 6, supply: 6 },
    maize: { demand: 23, supply: 22 },
  },
  {
    week: 'Wk 5',
    irish_potato: { demand: 16, supply: 14 },
    beans: { demand: 11, supply: 9 },
    avocado: { demand: 7, supply: 6 },
    maize: { demand: 24, supply: 21 },
  },
  {
    week: 'Wk 6',
    irish_potato: { demand: 18, supply: 15 },
    beans: { demand: 11, supply: 10 },
    avocado: { demand: 7, supply: 6 },
    maize: { demand: 25, supply: 23 },
  },
  {
    week: 'Wk 7',
    irish_potato: { demand: 19, supply: 17 },
    beans: { demand: 12, supply: 10 },
    avocado: { demand: 8, supply: 7 },
    maize: { demand: 26, supply: 24 },
  },
  {
    week: 'Wk 8',
    irish_potato: { demand: 20, supply: 18.4 },
    beans: { demand: 12, supply: 9.1 },
    avocado: { demand: 8, supply: 7.5 },
    maize: { demand: 28, supply: 25 },
  },
  {
    week: 'Wk 9',
    irish_potato: { demand: 20, supply: 19 },
    beans: { demand: 13, supply: 10 },
    avocado: { demand: 9, supply: 8 },
    maize: { demand: 28, supply: 26 },
  },
  {
    week: 'Wk 10',
    irish_potato: { demand: 21, supply: 19.5 },
    beans: { demand: 13, supply: 11 },
    avocado: { demand: 9, supply: 8 },
    maize: { demand: 29, supply: 27 },
  },
  {
    week: 'Wk 11',
    irish_potato: { demand: 22, supply: 20 },
    beans: { demand: 14, supply: 12 },
    avocado: { demand: 10, supply: 9 },
    maize: { demand: 30, supply: 28 },
  },
  {
    week: 'Wk 12',
    irish_potato: { demand: 22, supply: 20.5 },
    beans: { demand: 14, supply: 12 },
    avocado: { demand: 10, supply: 9 },
    maize: { demand: 31, supply: 29 },
  },
]

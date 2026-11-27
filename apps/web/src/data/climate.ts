import type { RegionClimateRisk, ClimateTrendPoint, RiskLevel } from '@/types'

// One entry per province (sample conditions for the demo, not forecasts).
export const regionClimateRisks: RegionClimateRisk[] = [
  {
    region: 'Eastern Province',
    rainfallRisk: 'high',
    heatStress: 'medium',
    waterStress: 'high',
    overallRisk: 'high',
    farmsAtRisk: 3,
    notes:
      'The drier lowlands are seeing a late start to the rains and longer dry spells, depressing maize and bean yield estimates.',
  },
  {
    region: 'Northern Province',
    rainfallRisk: 'medium',
    heatStress: 'low',
    waterStress: 'low',
    overallRisk: 'medium',
    farmsAtRisk: 2,
    notes:
      'Cool, wet conditions in the volcanic highlands raise late-blight risk on Irish potatoes; spraying schedules are being watched.',
  },
  {
    region: 'Southern Province',
    rainfallRisk: 'medium',
    heatStress: 'low',
    waterStress: 'medium',
    overallRisk: 'medium',
    farmsAtRisk: 2,
    notes:
      'Uneven rainfall across the plateau; avocado flowering is on schedule but water stress is building on hillside plots.',
  },
  {
    region: 'Western Province',
    rainfallRisk: 'medium',
    heatStress: 'low',
    waterStress: 'low',
    overallRisk: 'medium',
    farmsAtRisk: 2,
    notes:
      'Heavy downpours on steep slopes are causing soil erosion near Lake Kivu; terracing and mulching are limiting losses.',
  },
  {
    region: 'City of Kigali',
    rainfallRisk: 'low',
    heatStress: 'medium',
    waterStress: 'low',
    overallRisk: 'low',
    farmsAtRisk: 0,
    notes: 'Stable conditions on the peri-urban farms supplying Kigali markets.',
  },
]

export const regionClimateRiskByRegion = (region: string) => regionClimateRisks.find((r) => r.region === region)

export interface ClimateSnapshot {
  rainfallRisk: RiskLevel
  heatStress: RiskLevel
  waterStress: RiskLevel
  overallRisk: 'Low' | 'Moderate' | 'High'
}

export const overallClimateSnapshot: ClimateSnapshot = {
  rainfallRisk: 'medium',
  heatStress: 'low',
  waterStress: 'medium',
  overallRisk: 'Moderate',
}

export const climateTrend: ClimateTrendPoint[] = [
  { week: '01 Jun', rainfallMm: 22, avgTempC: 21.4, cropStressIndex: 18 },
  { week: '08 Jun', rainfallMm: 15, avgTempC: 21.8, cropStressIndex: 20 },
  { week: '15 Jun', rainfallMm: 8, avgTempC: 22.1, cropStressIndex: 24 },
  { week: '22 Jun', rainfallMm: 5, avgTempC: 22.0, cropStressIndex: 27 },
  { week: '29 Jun', rainfallMm: 3, avgTempC: 22.4, cropStressIndex: 30 },
  { week: '06 Jul', rainfallMm: 2, avgTempC: 22.8, cropStressIndex: 33 },
  { week: '13 Jul', rainfallMm: 4, avgTempC: 23.1, cropStressIndex: 37 },
  { week: '20 Jul', rainfallMm: 1, avgTempC: 23.4, cropStressIndex: 41 },
  { week: '27 Jul', rainfallMm: 6, avgTempC: 23.0, cropStressIndex: 38 },
  { week: '03 Aug', rainfallMm: 9, avgTempC: 22.7, cropStressIndex: 34 },
  { week: '10 Aug', rainfallMm: 18, avgTempC: 22.3, cropStressIndex: 30 },
  { week: '17 Aug', rainfallMm: 26, avgTempC: 21.9, cropStressIndex: 28 },
]

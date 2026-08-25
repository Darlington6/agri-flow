import type { RegionClimateRisk, ClimateTrendPoint, RiskLevel } from '@/types'

export const regionClimateRisks: RegionClimateRisk[] = [
  {
    region: 'Bono',
    rainfallRisk: 'medium',
    heatStress: 'low',
    waterStress: 'low',
    overallRisk: 'medium',
    farmsAtRisk: 1,
    notes: 'Localized rainfall variability is affecting tomato flowering in northern Bono.',
  },
  {
    region: 'Ashanti',
    rainfallRisk: 'low',
    heatStress: 'low',
    waterStress: 'low',
    overallRisk: 'low',
    farmsAtRisk: 1,
    notes: 'Generally favorable conditions this cycle; isolated pest pressure reported on two farms.',
  },
  {
    region: 'Bono East',
    rainfallRisk: 'high',
    heatStress: 'medium',
    waterStress: 'medium',
    overallRisk: 'high',
    farmsAtRisk: 2,
    notes: 'Above-average rainfall variability is delaying planting and depressing yield estimates.',
  },
  {
    region: 'Greater Accra',
    rainfallRisk: 'low',
    heatStress: 'medium',
    waterStress: 'low',
    overallRisk: 'low',
    farmsAtRisk: 0,
    notes: 'Coastal conditions have been stable through this production cycle.',
  },
  {
    region: 'Eastern',
    rainfallRisk: 'low',
    heatStress: 'low',
    waterStress: 'low',
    overallRisk: 'low',
    farmsAtRisk: 0,
    notes: 'Stable conditions are supporting on-schedule production.',
  },
  {
    region: 'Northern',
    rainfallRisk: 'high',
    heatStress: 'high',
    waterStress: 'high',
    overallRisk: 'high',
    farmsAtRisk: 3,
    notes: 'Erratic rainfall onset and elevated heat stress are reducing projected onion and pepper yields.',
  },
  {
    region: 'Upper East',
    rainfallRisk: 'medium',
    heatStress: 'medium',
    waterStress: 'medium',
    overallRisk: 'medium',
    farmsAtRisk: 0,
    notes: 'Seasonal transition period; monitoring for late-season dry spells.',
  },
  {
    region: 'Upper West',
    rainfallRisk: 'medium',
    heatStress: 'medium',
    waterStress: 'high',
    overallRisk: 'medium',
    farmsAtRisk: 1,
    notes: 'Water stress is building ahead of the dry season onset.',
  },
  {
    region: 'Volta',
    rainfallRisk: 'medium',
    heatStress: 'low',
    waterStress: 'low',
    overallRisk: 'medium',
    farmsAtRisk: 1,
    notes: 'Moderate rainfall variability is affecting cassava root bulking.',
  },
]

export const regionClimateRiskByRegion = (region: string) =>
  regionClimateRisks.find((r) => r.region === region)

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
  { week: '01 Jun', rainfallMm: 62, avgTempC: 27.1, cropStressIndex: 18 },
  { week: '08 Jun', rainfallMm: 74, avgTempC: 27.4, cropStressIndex: 16 },
  { week: '15 Jun', rainfallMm: 51, avgTempC: 28.0, cropStressIndex: 22 },
  { week: '22 Jun', rainfallMm: 88, avgTempC: 27.2, cropStressIndex: 15 },
  { week: '29 Jun', rainfallMm: 96, avgTempC: 26.8, cropStressIndex: 14 },
  { week: '06 Jul', rainfallMm: 70, avgTempC: 27.6, cropStressIndex: 21 },
  { week: '13 Jul', rainfallMm: 45, avgTempC: 28.5, cropStressIndex: 33 },
  { week: '20 Jul', rainfallMm: 38, avgTempC: 29.1, cropStressIndex: 41 },
  { week: '27 Jul', rainfallMm: 55, avgTempC: 28.3, cropStressIndex: 30 },
  { week: '03 Aug', rainfallMm: 102, avgTempC: 27.0, cropStressIndex: 24 },
  { week: '10 Aug', rainfallMm: 118, avgTempC: 26.5, cropStressIndex: 28 },
  { week: '17 Aug', rainfallMm: 95, avgTempC: 26.9, cropStressIndex: 32 },
]
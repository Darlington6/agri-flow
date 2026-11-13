import type { Crop } from '@/types'

export const crops: Crop[] = [
  { id: 'tomatoes', name: 'Tomatoes', unit: 'tonnes', varietyNotes: 'Roma / Pectomech', perishable: true },
  { id: 'onions', name: 'Onions', unit: 'tonnes', varietyNotes: 'Red Creole', perishable: false },
  { id: 'peppers', name: 'Peppers', unit: 'tonnes', varietyNotes: 'Scotch Bonnet / Bird Eye', perishable: true },
  { id: 'cassava', name: 'Cassava', unit: 'tonnes', varietyNotes: 'Ampong / Bankye Hemaa', perishable: false },
]

export const cropById = (id: string) => crops.find((c) => c.id === id)

// Indicative farm-gate price per tonne, GHS. Used to derive contract values in mock data.
export const cropPricePerTonneGHS: Record<string, number> = {
  tomatoes: 4200,
  onions: 3600,
  peppers: 5400,
  cassava: 1600,
}
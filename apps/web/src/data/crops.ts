import type { Crop } from '@/types'

export const crops: Crop[] = [
  { id: 'irish_potato', name: 'Irish potatoes', unit: 'tonnes', varietyNotes: 'Kinigi / Kirundo', perishable: true },
  { id: 'beans', name: 'Beans', unit: 'tonnes', varietyNotes: 'Climbing (RWV 1129) / bush', perishable: false },
  { id: 'avocado', name: 'Avocados', unit: 'tonnes', varietyNotes: 'Hass / Fuerte', perishable: true },
  { id: 'maize', name: 'Maize', unit: 'tonnes', varietyNotes: 'Hybrid / open-pollinated', perishable: false },
]

export const cropById = (id: string) => crops.find((c) => c.id === id)

// Indicative farm-gate price per tonne in the demo market's currency (RWF; sample
// figures, not market data). Used to derive contract values in mock data.
export const cropPricePerTonne: Record<string, number> = {
  irish_potato: 350_000,
  beans: 900_000,
  avocado: 600_000,
  maize: 400_000,
}

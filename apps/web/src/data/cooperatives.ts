import type { FarmerGroup } from '@/types'

// The demo cooperative: tomato and pepper growers around Techiman, already on
// the network's contracts (AG-204, AG-205, AG-207, AG-188). Abena (F001, the
// Farmer demo role) is a member, so the Cooperative, Farmer and Buyer demos
// tell the same story from different seats.
export const farmerGroups: FarmerGroup[] = [
  {
    id: 'G001',
    name: "Techiman Growers' Cooperative",
    region: 'Bono',
    leadFarmerId: 'F001',
    farmerIds: ['F001', 'F002', 'F004', 'F009', 'F010', 'F019', 'F022'],
  },
]

export function farmerGroupById(id: string): FarmerGroup | undefined {
  return farmerGroups.find((g) => g.id === id)
}

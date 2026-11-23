import { ShoppingBasket, Sprout, Truck, Users, type LucideIcon } from 'lucide-react'
import type { SelfServeRole } from '@/lib/apiClient'

export const ROLE_ICONS: Record<SelfServeRole, LucideIcon> = {
  farmer: Sprout,
  buyer: ShoppingBasket,
  cooperative: Users,
  delivery_partner: Truck,
}

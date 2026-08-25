import {
  LayoutDashboard,
  ClipboardList,
  Users,
  FileSignature,
  Sprout,
  Warehouse,
  CloudSun,
  Wallet,
  Store,
  Truck,
  Crown,
  Sparkles,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import type { DemoRole } from '@/types'
import { navKeysForRole, type NavKey } from '@/lib/permissions'

export interface NavItem {
  key: NavKey
  label: string
  to: string
  icon: LucideIcon
}

export const primaryNav: NavItem[] = [
  { key: 'dashboard', label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { key: 'demand', label: 'Demand', to: '/buyers', icon: ClipboardList },
  { key: 'farmers', label: 'Farmers', to: '/farmers', icon: Users },
  { key: 'contracts', label: 'Contracts', to: '/contracts', icon: FileSignature },
  { key: 'production', label: 'Production', to: '/production', icon: Sprout },
  { key: 'harvest', label: 'Harvest', to: '/harvest', icon: Warehouse },
  { key: 'climate', label: 'Climate', to: '/climate', icon: CloudSun },
  { key: 'finance', label: 'Finance', to: '/finance', icon: Wallet },
  { key: 'marketplace', label: 'Marketplace', to: '/marketplace', icon: Store },
  { key: 'delivery', label: 'Job Board', to: '/delivery', icon: Truck },
  { key: 'executive', label: 'Executive', to: '/executive', icon: Crown },
  { key: 'copilot', label: 'AI Copilot', to: '/copilot', icon: Sparkles },
]

export const secondaryNav: NavItem[] = [{ key: 'settings', label: 'Settings', to: '/settings', icon: Settings }]

// Per-role label overrides for nav items whose default wording doesn't fit
// every role — e.g. a Farmer's "Farmers" link really means "my own profile."
const LABEL_OVERRIDES: Partial<Record<DemoRole, Partial<Record<NavKey, string>>>> = {
  Farmer: { farmers: 'My Farm' },
}

export function navForRole(role: DemoRole): NavItem[] {
  const allowed = new Set(navKeysForRole(role))
  const overrides = LABEL_OVERRIDES[role]
  return primaryNav
    .filter((item) => allowed.has(item.key))
    .map((item) => (overrides?.[item.key] ? { ...item, label: overrides[item.key]! } : item))
}

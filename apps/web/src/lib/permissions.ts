import type { DemoRole } from '@/types'

export type NavKey =
  | 'dashboard'
  | 'demand'
  | 'farmers'
  | 'contracts'
  | 'production'
  | 'harvest'
  | 'climate'
  | 'finance'
  | 'marketplace'
  | 'delivery'
  | 'executive'
  | 'copilot'
  | 'settings'

// Platform Admin and Super Admin share every operational permission — Super
// Admin is that set plus the executive revenue view, not a different role
// from scratch. Anywhere in the app that special-cases "is this an admin",
// use this helper rather than comparing to 'Platform Admin' directly.
export function isAdminRole(role?: DemoRole | null): boolean {
  return role === 'Platform Admin' || role === 'Super Admin'
}

const PLATFORM_ADMIN_KEYS: NavKey[] = [
  'dashboard', 'demand', 'farmers', 'contracts', 'production', 'harvest', 'climate', 'finance', 'marketplace', 'copilot', 'settings',
]

// What each demo role is allowed to reach. This gates both the sidebar (see
// navigation.ts) and direct URL access (see AppLayout's route guard) —
// removing a nav item alone would still leave the page reachable by typing
// the URL.
export const ROLE_PERMISSIONS: Record<DemoRole, NavKey[]> = {
  'Platform Admin': PLATFORM_ADMIN_KEYS,
  'Super Admin': [...PLATFORM_ADMIN_KEYS, 'executive'],
  Buyer: ['dashboard', 'demand', 'contracts', 'harvest', 'climate', 'finance', 'marketplace', 'copilot', 'settings'],
  'Field Agent': ['dashboard', 'farmers', 'production', 'harvest', 'climate', 'copilot', 'settings'],
  Farmer: ['dashboard', 'farmers', 'contracts', 'harvest', 'climate', 'marketplace', 'copilot', 'settings'],
  'Delivery Partner': ['dashboard', 'delivery', 'settings'],
}

// Keys a role is permitted to reach (e.g. their own contract detail page)
// but that shouldn't get a top-level sidebar entry — a Farmer can open their
// own contract from a link on their dashboard without "Contracts" appearing
// as if they can browse the network's contract pipeline.
const NAV_HIDDEN: Partial<Record<DemoRole, NavKey[]>> = {
  Farmer: ['contracts'],
}

const PATH_PREFIX_TO_KEY: [string, NavKey][] = [
  ['/dashboard', 'dashboard'],
  ['/buyers', 'demand'],
  ['/farmers', 'farmers'],
  ['/contracts', 'contracts'],
  ['/production', 'production'],
  ['/harvest', 'harvest'],
  ['/climate', 'climate'],
  ['/finance', 'finance'],
  ['/marketplace', 'marketplace'],
  ['/delivery', 'delivery'],
  ['/executive', 'executive'],
  ['/copilot', 'copilot'],
  ['/settings', 'settings'],
]

export function keyForPath(pathname: string): NavKey | null {
  const match = PATH_PREFIX_TO_KEY.find(([prefix]) => pathname.startsWith(prefix))
  return match ? match[1] : null
}

export function canAccess(role: DemoRole, pathname: string): boolean {
  const key = keyForPath(pathname)
  if (!key) return true // unknown paths (e.g. 404) aren't gated here
  return ROLE_PERMISSIONS[role].includes(key)
}

export function navKeysForRole(role: DemoRole): NavKey[] {
  const hidden = new Set(NAV_HIDDEN[role] ?? [])
  return ROLE_PERMISSIONS[role].filter((key) => !hidden.has(key))
}

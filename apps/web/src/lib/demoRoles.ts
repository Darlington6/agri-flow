import type { DemoRole } from '@/types'
import type { SelfServeRole } from '@/lib/apiClient'

/** Roles only AgriFlow staff hold. The public demo doesn't offer them. */
export const STAFF_DEMO_ROLES: readonly DemoRole[] = ['Platform Admin', 'Super Admin']

/**
 * Staff roles appear in the demo locally and on preview deployments (for
 * development), never on production. Real staff get their roles on real
 * accounts instead (see the roles work in the README roadmap).
 */
export function showStaffDemoRoles(deployEnv: string = import.meta.env.VITE_DEPLOY_ENV): boolean {
  return deployEnv !== 'production'
}

export function visibleDemoRoles<T extends { role: DemoRole }>(roles: readonly T[], deployEnv?: string): T[] {
  return showStaffDemoRoles(deployEnv) ? [...roles] : roles.filter((r) => !STAFF_DEMO_ROLES.includes(r.role))
}

/** The demo role each sign-up choice continues into (the sign-up walkthrough). */
export const DEMO_ROLE_FOR: Record<SelfServeRole, DemoRole> = {
  farmer: 'Farmer',
  buyer: 'Buyer',
  cooperative: 'Cooperative',
  delivery_partner: 'Delivery Partner',
}

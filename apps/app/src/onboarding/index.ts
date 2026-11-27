// The rules of setting up an account, shared by the welcome flow and home.
// The same as the web app's (apps/web/src/lib/onboarding.ts and OnboardingFlow).
import type { MessageKey } from '@/i18n'

import type { OnboardingStep, SelfServeRole } from './types'

export * from './types'

/** The order roles are offered in. */
export const ROLE_ORDER: SelfServeRole[] = ['farmer', 'buyer', 'cooperative', 'delivery_partner']

/** Staff get their roles from the AgriFlow team and skip the role step. */
export const STAFF_SLUGS = ['field_agent', 'platform_admin', 'super_admin']

export function isSelfServeRole(slug: string): slug is SelfServeRole {
  return (ROLE_ORDER as string[]).includes(slug)
}

export interface FlowStart {
  /** Roles the account already has. */
  roles: SelfServeRole[]
  staff: boolean
  hasPhone: boolean
  /** Already set up: only here to agree to new terms. */
  returning: boolean
  /** The first step not done yet (null: all done but the terms). */
  next: OnboardingStep | null
}

/**
 * The steps this person sees: no phone step if they signed up with one, no
 * role step for staff, and only the terms for someone already set up.
 */
export function stepsFor(start: Pick<FlowStart, 'staff' | 'hasPhone' | 'returning'>): OnboardingStep[] {
  if (start.returning) return ['terms']
  return (['name', 'place', 'role', 'phone', 'terms'] as OnboardingStep[]).filter(
    (step) => !(step === 'phone' && start.hasPhone) && !(step === 'role' && start.staff),
  )
}

/** Where to pick up: the first step not done yet, else the terms. */
export function firstStep(steps: OnboardingStep[], next: OnboardingStep | null): number {
  return Math.max(0, steps.indexOf(next ?? 'terms'))
}

/** Who'll use someone's phone number, for their role. Several roles, or none: everyone they work with. */
export function whoCanReachYouKey(roles: readonly string[]): MessageKey {
  const own = roles.filter(isSelfServeRole)
  return own.length === 1 ? `welcome.phone.who.${own[0]}` : 'welcome.phone.who.any'
}

/** The public name to suggest from a full name: the first name and the last name's initial ("Aline U."). */
export function shortName(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return words[0] ?? ''
  return `${words[0]} ${words.at(-1)![0].toUpperCase()}.`
}

/**
 * A date of birth typed as day, month and year, as YYYY-MM-DD, or an error:
 * a real date, not in the future, from 1900 on. `today` is for tests.
 */
export function birthDate(
  day: string,
  month: string,
  year: string,
  today: Date = new Date(),
): { value: string } | { error: 'invalid' | 'future' | 'old' } {
  const [d, m, y] = [day, month, year].map((part) => Number(part.trim()))
  if (!d || !m || year.trim().length !== 4 || !y) return { error: 'invalid' }
  const date = new Date(Date.UTC(y, m - 1, d))
  // 31 February rolls over into March: not a real date.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return { error: 'invalid' }
  }
  if (y < 1900) return { error: 'old' }
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  if (date.getTime() > now) return { error: 'future' }
  return { value: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
}

/** AgriFlow is for adults; someone younger needs a parent or guardian, whom our team contacts. */
export const ADULT_AGE = 18

/** Whether someone born on `dateOfBirth` (YYYY-MM-DD) is under 18 on `today`. False until a full date is given. */
export function isMinor(dateOfBirth: string, today: Date = new Date()): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth)
  if (!match) return false
  const [year, month, day] = match.slice(1).map(Number)
  const beforeBirthday = today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)
  return today.getFullYear() - year - (beforeBirthday ? 1 : 0) < ADULT_AGE
}

export const COMING: Record<SelfServeRole, MessageKey[]> = {
  farmer: ['home.coming.farmer.1', 'home.coming.farmer.2', 'home.coming.farmer.3'],
  buyer: ['home.coming.buyer.1', 'home.coming.buyer.2', 'home.coming.buyer.3'],
  delivery_partner: [
    'home.coming.delivery_partner.1',
    'home.coming.delivery_partner.2',
    'home.coming.delivery_partner.3',
  ],
  cooperative: ['home.coming.cooperative.1', 'home.coming.cooperative.2', 'home.coming.cooperative.3'],
}

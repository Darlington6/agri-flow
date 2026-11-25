import type { AuthUser, Language, OnboardingStep, SelfServeRole, Verification } from '@/lib/apiClient'

/** The public site, for the terms and privacy notice people agree to. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://agri-flow-site.vercel.app').replace(/\/$/, '')

/** Where a signed-in person belongs: setting up their account, or their home. */
export function landingFor(user: Pick<AuthUser, 'needs_onboarding'>): string {
  return user.needs_onboarding ? '/welcome' : '/home'
}

/** The launch languages, each named in itself. */
export const LANGUAGES: { code: Language; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'rw', name: 'Ikinyarwanda' },
  { code: 'sw', name: 'Kiswahili' },
  { code: 'tw', name: 'Twi' },
]

/** The first of the device's languages we offer, else English. */
export function guessLanguage(languages: readonly string[] = navigator.languages ?? []): Language {
  for (const tag of languages) {
    const base = tag.toLowerCase().split('-')[0]
    // Kinyarwanda's code is "rw"; Twi's is "tw" (some systems say "ak", Akan).
    const code = base === 'ak' ? 'tw' : base
    const match = LANGUAGES.find((l) => l.code === code)
    if (match) return match.code
  }
  return 'en'
}

// Who someone in each role deals with, for "so … can reach you".
const REACHED_BY: Record<SelfServeRole, string> = {
  farmer: 'buyers, your cooperative and delivery partners',
  buyer: 'farmers, cooperatives and delivery partners',
  delivery_partner: 'farmers, cooperatives and buyers',
  cooperative: 'your members, buyers and delivery partners',
}

/**
 * Who'll use someone's phone number, worded for their role. Several roles,
 * none yet, or only staff roles: the people they work with.
 */
export function whoCanReachYou(roles: readonly string[]): string {
  const own = roles.filter((r): r is SelfServeRole => Object.hasOwn(REACHED_BY, r))
  return own.length === 1 ? REACHED_BY[own[0]] : 'the people you work with on AgriFlow'
}

export interface RoleInfo {
  label: string
  /** How someone in this role would describe themselves. */
  blurb: string
  /** What the role will be able to do, shown on the home page until it can. */
  coming: string[]
}

export const ROLES: Record<SelfServeRole, RoleInfo> = {
  farmer: {
    label: 'Farmer',
    blurb: 'I grow crops and want buyers I can count on.',
    coming: [
      'See what buyers need before you plant',
      'Agree contracts with prices and terms up front',
      'Record your harvest and follow your payments',
    ],
  },
  buyer: {
    label: 'Buyer',
    blurb: 'I buy produce for my business.',
    coming: [
      'Post what you need, how much and when',
      'Get matched with verified farmers and cooperatives',
      'Follow deliveries and quality checks',
    ],
  },
  delivery_partner: {
    label: 'Delivery partner',
    blurb: 'I move produce from farms to buyers.',
    coming: [
      'Pick up delivery jobs in the areas you cover',
      'Confirm pickups and drop-offs',
      'Get paid for each delivery',
    ],
  },
  cooperative: {
    label: 'Cooperative',
    blurb: "I manage a farmers' cooperative.",
    coming: [
      'Bring your members onto AgriFlow',
      'Take on larger orders together',
      "See your members' harvests in one place",
    ],
  },
}

export const ROLE_ORDER: SelfServeRole[] = ['farmer', 'buyer', 'cooperative', 'delivery_partner']

export const VERIFICATION_LABEL: Record<Verification, string> = {
  unverified: 'Not verified yet',
  pending: 'Verification in progress',
  verified: 'Verified',
  rejected: 'Verification declined',
}

/** The steps, in order, with the heading each shows. */
export const STEP_TITLES: Record<OnboardingStep, string> = {
  name: 'What should we call you?',
  place: 'Where are you?',
  role: 'What brings you to AgriFlow?',
  phone: 'Add your phone number',
  terms: 'One last thing',
}

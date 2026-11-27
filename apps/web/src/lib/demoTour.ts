import type { DemoRole } from '@/types'
import type { NavKey } from './permissions'

/**
 * The first-visit tour of the demo: who you're playing, where to start, and
 * how to switch seats. Shown once per role (remembered on this device), and
 * again from the top bar's Tour button.
 */

export const TOUR_INTRO: Record<DemoRole, string> = {
  'Platform Admin':
    'You run day-to-day operations: matching demand to farmers, watching risk, and keeping payments moving.',
  'Super Admin': 'You see everything operations does, plus how the platform itself is performing.',
  Buyer: 'You buy produce for Kigali Fresh Foods: you post what you need and follow it from contract to delivery.',
  'Field Agent':
    'You support the farmers in your regions: crop updates, climate-smart practices and problems in the field.',
  Farmer: "You're Aline, a potato farmer near Kabarondo, growing under contract for a buyer.",
  Cooperative:
    "You manage Kayonza Growers' Cooperative: seven farmers, Aline among them, supplying the network's contracts.",
  'Delivery Partner':
    'You run Eastern Freight Movers: you pick delivery jobs that fit your routes and get paid per job.',
}

/** The pages worth visiting first, in order, for each role. */
export const TOUR_STOPS: Record<DemoRole, NavKey[]> = {
  'Platform Admin': ['demand', 'contracts', 'climate', 'finance'],
  'Super Admin': ['executive', 'demand', 'contracts', 'finance'],
  Buyer: ['demand', 'contracts', 'harvest', 'finance'],
  'Field Agent': ['farmers', 'production', 'climate'],
  Farmer: ['farmers', 'marketplace', 'climate'],
  Cooperative: ['farmers', 'contracts', 'harvest'],
  'Delivery Partner': ['delivery'],
}

const HINTS: Record<NavKey, string> = {
  dashboard: 'What needs your attention today.',
  demand: "Buyers' orders: what's needed, how much and when.",
  farmers: 'Every farmer in the network, with their risk and verification.',
  contracts: 'Each contract, from demand to delivery and payment.',
  production: 'Crop stages and updates from the field.',
  harvest: "What's coming in, when, and how much.",
  climate: 'Rainfall, drought and pest risk by region.',
  finance: 'Payments, from buyer deposits to farmer payouts.',
  marketplace: 'Inputs and produce for sale across the network.',
  delivery: 'Open delivery jobs: book the ones that fit your route.',
  executive: 'Revenue, take rate and network growth.',
  copilot: 'Ask questions about your data in plain language.',
  settings: 'Your details and preferences.',
}

const ROLE_HINTS: Partial<Record<DemoRole, Partial<Record<NavKey, string>>>> = {
  Buyer: {
    demand: 'Post what you need and follow each order.',
    contracts: 'Your contracts, and how much has been supplied so far.',
  },
  'Field Agent': { farmers: 'The farmers in your regions, and who needs a visit.' },
  Farmer: {
    farmers: 'Your farm: crops, practices and your contract.',
    marketplace: 'Sell surplus produce and find inputs.',
  },
  Cooperative: {
    farmers: 'Your members, how their crops are doing, and who needs help.',
    contracts: 'The contracts your members supply, and how far along each is.',
  },
}

export function tourHint(role: DemoRole, key: NavKey): string {
  return ROLE_HINTS[role]?.[key] ?? HINTS[key]
}

const SEEN_KEY = 'agriflow.demo-tour-seen'

function seenRoles(): DemoRole[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return raw ? (JSON.parse(raw) as DemoRole[]) : []
  } catch {
    return []
  }
}

export function hasSeenTour(role: DemoRole): boolean {
  // Without storage we can't remember, so don't keep showing it.
  try {
    localStorage.getItem(SEEN_KEY)
  } catch {
    return true
  }
  return seenRoles().includes(role)
}

export function markTourSeen(role: DemoRole) {
  try {
    const seen = seenRoles()
    if (!seen.includes(role)) localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, role]))
  } catch {
    // Private mode or storage blocked: it just shows again next time.
  }
}

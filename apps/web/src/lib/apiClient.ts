// Thin fetch wrapper for the real backend — deliberately hand-written
// rather than generated/query-library-backed for now. A handful of
// endpoints don't justify TanStack Query or OpenAPI codegen yet; both become
// worthwhile once Network/Contracts bring real data-fetching-heavy
// pages (Platform Blueprint, Section 5/10).

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:8000' : '')

const ACCESS_KEY = 'agriflow.auth.access'
const REFRESH_KEY = 'agriflow.auth.refresh'

export interface Role {
  slug: string
  name: string
}

// An account has a phone number, an email, or both (never neither).
export interface AuthUser {
  id: number
  phone_number: string | null
  email: string | null
  display_name: string
  /** ISO country code (e.g. "RW"); empty until chosen while setting up. */
  country: string
  /** One of the launch languages; empty until chosen. */
  language: Language | ''
  roles: Role[]
  /** True until the account is set up, and again when the terms change. */
  needs_onboarding: boolean
  onboarded_at: string | null
  date_joined: string
}

export type Language = 'en' | 'fr' | 'rw' | 'sw' | 'tw'

/** What someone can change about their own account. */
export type AccountChanges = Partial<Pick<AuthUser, 'display_name' | 'country' | 'language'>>

export type SelfServeRole = 'farmer' | 'buyer' | 'delivery_partner' | 'cooperative'
export type Verification = 'unverified' | 'pending' | 'verified' | 'rejected'

interface ProfileBase {
  role: SelfServeRole
  verification: Verification
  created_at: string
  updated_at: string
}

export interface FarmerDetails {
  region: string
  district: string
  crops: string[]
  farm_size_hectares: string | null
  cooperative_name: string
}

export interface BuyerDetails {
  business_name: string
  business_type: string
  region: string
  district: string
  crops: string[]
}

export interface DeliveryPartnerDetails {
  business_name: string
  vehicle_types: string[]
  service_regions: string[]
}

export interface CooperativeDetails {
  name: string
  registration_number: string
  region: string
  district: string
  member_count: number | null
  crops: string[]
}

export interface RoleDetails {
  farmer: FarmerDetails
  buyer: BuyerDetails
  delivery_partner: DeliveryPartnerDetails
  cooperative: CooperativeDetails
}

/** A role the account chose, with its details. */
export type Profile = {
  [R in SelfServeRole]: ProfileBase & { role: R } & RoleDetails[R]
}[SelfServeRole]

export interface Option {
  value: string
  label: string
}

/** The pick lists for setting up an account. */
export interface SetupOptions {
  country: string
  /** Null where the country has no list: people type their region. */
  regions: { name: string; districts: string[] }[] | null
  crops: Option[]
  buyer_types: Option[]
  vehicle_types: Option[]
}

export type OnboardingStep = 'name' | 'place' | 'role' | 'phone' | 'terms'

export type Gender = 'woman' | 'man' | 'prefer_not_to_say'
export type GuardianRelationship = 'parent' | 'legal_guardian' | 'relative'

/** Who someone is, as on their ID: private (only they and our team see it), for verification later. */
export interface PersonalDetails {
  legal_name: string
  /** YYYY-MM-DD; null until given. */
  date_of_birth: string | null
  gender: Gender | ''
  /** Under 18: their parent or guardian (empty for adults). */
  guardian_name: string
  guardian_relationship: GuardianRelationship | ''
  /** E.164. */
  guardian_phone: string
  /** Worked out by the API from the date of birth. */
  is_minor?: boolean
}

export interface OnboardingState {
  steps: Record<OnboardingStep, boolean>
  next_step: OnboardingStep | null
  complete: boolean
  terms_version: string
}

export interface AuthTokens {
  access: string
  refresh: string
  user: AuthUser
  /** True when this sign-in also created the account. */
  created: boolean
}

export function getStoredTokens(): { access: string; refresh: string } | null {
  const access = localStorage.getItem(ACCESS_KEY)
  const refresh = localStorage.getItem(REFRESH_KEY)
  return access && refresh ? { access, refresh } : null
}

export function storeTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

class ApiError extends Error {
  status: number
  /** Messages for particular fields, e.g. { district: ['Choose a district in that region.'] }. */
  fields: Record<string, string[]>

  constructor(message: string, status: number, fields: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = await response.json()
    if (typeof body?.detail === 'string') return new ApiError(body.detail, response.status)
    const fields: Record<string, string[]> = {}
    for (const [key, value] of Object.entries(body ?? {})) {
      fields[key] = (Array.isArray(value) ? value : [value]).map(String)
    }
    const message = Object.values(fields).flat().join(' ') || response.statusText
    return new ApiError(message, response.status, fields)
  } catch {
    return new ApiError(response.statusText, response.status)
  }
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const tokens = getStoredTokens()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (tokens) headers.Authorization = `Bearer ${tokens.access}`

  const response = await fetch(`${API_URL}${path}`, { ...init, headers })

  if (response.status === 401 && tokens && retry) {
    // Another request may have refreshed while this one was in flight:
    // then just retry with the new tokens rather than spend the old one.
    const current = getStoredTokens()
    const refreshed = current ? current.refresh !== tokens.refresh || (await tryRefresh(current.refresh)) : false
    if (refreshed) return request<T>(path, init, false)
    clearTokens()
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

// Each refresh token works once: the API answers with a new pair and
// retires the old refresh token. So both are saved, and requests that hit
// 401 at the same moment share one refresh instead of each spending the
// same token (the second would fail and sign the user out).
let refreshing: Promise<boolean> | null = null

function tryRefresh(refresh: string): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      if (!response.ok) return false
      const body = (await response.json()) as { access: string; refresh: string }
      storeTokens(body.access, body.refresh)
      return true
    } catch {
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

/** Retires the refresh token on the server, then forgets both tokens.
 * Signs out locally even if the API can't be reached. */
export async function logout() {
  const tokens = getStoredTokens()
  clearTokens()
  if (!tokens) return
  try {
    await fetch(`${API_URL}/api/v1/auth/token/logout/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokens.refresh }),
    })
  } catch {
    // Offline: the token still expires on its own.
  }
}

export function requestOtp(phoneNumber: string) {
  return request<{ debug_code?: string }>('/api/v1/auth/otp/request/', {
    method: 'POST',
    body: JSON.stringify({ phone_number: phoneNumber }),
  })
}

export function verifyOtp(phoneNumber: string, code: string) {
  return request<AuthTokens>('/api/v1/auth/otp/verify/', {
    method: 'POST',
    body: JSON.stringify({ phone_number: phoneNumber, code }),
  })
}

export function requestMagicLink(email: string) {
  return request<{ debug_link?: string }>('/api/v1/auth/magic-link/request/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function verifyMagicLink(token: string) {
  return request<AuthTokens>(`/api/v1/auth/magic-link/verify/?token=${encodeURIComponent(token)}`)
}

/** Continue with Google: the ID token Google's button handed us. */
/** `credential`: the ID token Google sent back; `nonce`: the one we put in the request (the API checks they match). */
export function signInWithGoogle(credential: string, nonce: string) {
  return request<AuthTokens>('/api/v1/auth/google/', {
    method: 'POST',
    body: JSON.stringify({ credential, nonce }),
  })
}

export function getMe() {
  return request<AuthUser>('/api/v1/auth/me/')
}

export function updateMe(changes: AccountChanges) {
  return request<AuthUser>('/api/v1/auth/me/', { method: 'PATCH', body: JSON.stringify(changes) })
}

// ── Setting up an account ───────────────────────────────────────────────

export function getOnboarding() {
  return request<OnboardingState>('/api/v1/onboarding/')
}

export function skipPhone() {
  return request<OnboardingState>('/api/v1/onboarding/skip-phone/', { method: 'POST' })
}

export function completeOnboarding(termsVersion: string) {
  return request<AuthUser>('/api/v1/onboarding/complete/', {
    method: 'POST',
    body: JSON.stringify({ terms_version: termsVersion, accept_terms: true }),
  })
}

export function getPersonalDetails() {
  return request<PersonalDetails>('/api/v1/compliance/personal-details/')
}

export function savePersonalDetails(details: PersonalDetails) {
  return request<PersonalDetails>('/api/v1/compliance/personal-details/', {
    method: 'PUT',
    body: JSON.stringify(details),
  })
}

export function getSetupOptions(country: string) {
  return request<SetupOptions>(`/api/v1/network/options/?country=${encodeURIComponent(country)}`)
}

export function getProfiles() {
  return request<Profile[]>('/api/v1/network/profiles/')
}

export function createProfile<R extends SelfServeRole>(role: R, details: Partial<RoleDetails[R]>) {
  return request<Profile>('/api/v1/network/profiles/', {
    method: 'POST',
    body: JSON.stringify({ ...details, role }),
  })
}

export function updateProfile<R extends SelfServeRole>(role: R, details: Partial<RoleDetails[R]>) {
  return request<Profile>(`/api/v1/network/profiles/${role}/`, {
    method: 'PATCH',
    body: JSON.stringify(details),
  })
}

export function requestEmailAdd(email: string) {
  return request<{ debug_link?: string }>('/api/v1/auth/me/email/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function confirmEmail(token: string) {
  return request<{ email: string }>('/api/v1/auth/email/confirm/', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export function requestPhoneAdd(phoneNumber: string) {
  return request<{ debug_code?: string }>('/api/v1/auth/me/phone/', {
    method: 'POST',
    body: JSON.stringify({ phone_number: phoneNumber }),
  })
}

export function confirmPhoneAdd(phoneNumber: string, code: string) {
  return request<AuthUser>('/api/v1/auth/me/phone/confirm/', {
    method: 'POST',
    body: JSON.stringify({ phone_number: phoneNumber, code }),
  })
}

export { ApiError }

// The sign-in endpoints of the API, for this app. A copy of the web app's
// client (apps/web/src/lib/apiClient.ts) while both exist, with one
// difference that matters on phones: no connection is an OfflineError and
// never signs anyone out. Only the API saying the session is over does.

import { API_URL } from '@/lib/config'

import { clearSession, currentTokens, saveTokens } from './session'
import type {
  CooperativeMembers,
  Member,
  OnboardingState,
  PersonalDetails,
  Profile,
  RoleDetails,
  SelfServeRole,
  SetupOptions,
} from '@/onboarding/types'

import type { AccountChanges, AuthUser, SignedIn } from './types'

/** The API answered with an error. */
export class ApiError extends Error {
  status: number
  /** Messages for particular fields, e.g. { code: ['Enter the 6-digit code.'] }. */
  fields: Record<string, string[]>

  constructor(message: string, status: number, fields: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

/** The API couldn't be reached: no connection, or it's down. */
export class OfflineError extends Error {
  constructor() {
    super('offline')
    this.name = 'OfflineError'
  }
}

/** The API said the session is over (signed out elsewhere, or expired). */
export class SessionEndedError extends ApiError {
  constructor() {
    super('Your session has ended. Sign in again.', 401)
    this.name = 'SessionEndedError'
  }
}

let onSessionEnded: () => void = () => {}

/** Called once the API refuses the session, so the app can show sign-in. */
export function whenSessionEnds(listener: () => void) {
  onSessionEnded = listener
}

async function send(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, init)
  } catch {
    throw new OfflineError()
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
    const message = Object.values(fields).flat().join(' ') || `Error ${response.status}`
    return new ApiError(message, response.status, fields)
  } catch {
    return new ApiError(`Error ${response.status}`, response.status)
  }
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const tokens = currentTokens()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (tokens) headers.Authorization = `Bearer ${tokens.access}`

  const response = await send(path, { ...init, headers })

  if (response.status === 401 && tokens) {
    // Another request may have refreshed while this one was in flight.
    const now = currentTokens()
    if (retry && now && (now.refresh !== tokens.refresh || (await refreshTokens(now.refresh)))) {
      return request<T>(path, init, false)
    }
    await clearSession()
    onSessionEnded()
    throw new SessionEndedError()
  }

  if (!response.ok) throw await parseError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

// Each refresh token works once (the API sends a new pair), so requests that
// hit 401 together share one refresh. Throws OfflineError without a
// connection: the session is kept for when it's back.
let refreshing: Promise<boolean> | null = null

function refreshTokens(refresh: string): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const response = await send('/api/v1/auth/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      })
      if (!response.ok) return false
      await saveTokens((await response.json()) as { access: string; refresh: string })
      return true
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })

export function requestEmailSignIn(email: string) {
  return request<{ debug_code?: string; debug_link?: string }>('/api/v1/auth/magic-link/request/', post({ email }))
}

/** The 6-digit code from the sign-in email. */
export function verifyEmailCode(email: string, code: string) {
  return request<SignedIn>('/api/v1/auth/magic-link/code/', post({ email, code }))
}

export function requestPhoneCode(phoneNumber: string) {
  return request<{ debug_code?: string }>('/api/v1/auth/otp/request/', post({ phone_number: phoneNumber }))
}

export function verifyPhoneCode(phoneNumber: string, code: string) {
  return request<SignedIn>('/api/v1/auth/otp/verify/', post({ phone_number: phoneNumber, code }))
}

/** `credential`: the ID token Google sent back; `nonce`: the one we put in the request. */
export function signInWithGoogle(credential: string, nonce: string) {
  return request<SignedIn>('/api/v1/auth/google/', post({ credential, nonce }))
}

export function getMe() {
  return request<AuthUser>('/api/v1/auth/me/')
}

export function updateMe(changes: AccountChanges) {
  return request<AuthUser>('/api/v1/auth/me/', { method: 'PATCH', body: JSON.stringify(changes) })
}

/** Texts a code to a number being added to the signed-in account. */
export function requestPhoneAdd(phoneNumber: string) {
  return request<{ debug_code?: string }>('/api/v1/auth/me/phone/', post({ phone_number: phoneNumber }))
}

export function confirmPhoneAdd(phoneNumber: string, code: string) {
  return request<AuthUser>('/api/v1/auth/me/phone/confirm/', post({ phone_number: phoneNumber, code }))
}

// ── Setting up an account ────────────────────────────────────────────────

export function getOnboarding() {
  return request<OnboardingState>('/api/v1/onboarding/')
}

export function skipPhone() {
  return request<OnboardingState>('/api/v1/onboarding/skip-phone/', { method: 'POST' })
}

/** Records the terms version agreed to, and finishes setting up. */
export function completeOnboarding(termsVersion: string) {
  return request<AuthUser>('/api/v1/onboarding/complete/', post({ terms_version: termsVersion, accept_terms: true }))
}

/** Their private details (empty values before they're given). */
export function getPersonalDetails() {
  return request<PersonalDetails>('/api/v1/compliance/personal-details/')
}

export function savePersonalDetails(details: PersonalDetails) {
  return request<PersonalDetails>('/api/v1/compliance/personal-details/', {
    method: 'PUT',
    body: JSON.stringify(details),
  })
}

/** The farmers who chose the signed-in manager's cooperative. */
export function getCooperativeMembers() {
  return request<CooperativeMembers>('/api/v1/network/cooperative/members/')
}

/** Confirms a farmer as a member, or declines them (removing a member declines them too). */
export function decideMembership(id: number, status: 'confirmed' | 'declined') {
  return request<Member>(`/api/v1/network/cooperative/members/${id}/`, post({ status }))
}

export function getSetupOptions(country: string) {
  return request<SetupOptions>(`/api/v1/network/options/?country=${encodeURIComponent(country)}`)
}

export function getProfiles() {
  return request<Profile[]>('/api/v1/network/profiles/')
}

export function createProfile<R extends SelfServeRole>(role: R, details: Partial<RoleDetails[R]>) {
  return request<Profile>('/api/v1/network/profiles/', post({ ...details, role }))
}

/** Retires the refresh token on the server. Best effort: offline, it expires on its own. */
export async function retireRefreshToken(refresh: string): Promise<void> {
  try {
    await send('/api/v1/auth/token/logout/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
  } catch {
    // Offline.
  }
}

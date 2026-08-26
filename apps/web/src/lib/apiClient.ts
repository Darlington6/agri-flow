// Thin fetch wrapper for the real backend — deliberately hand-written
// rather than generated/query-library-backed for now. Six endpoints
// don't justify TanStack Query or OpenAPI codegen yet; both become
// worthwhile once Network/Contracts bring real data-fetching-heavy
// pages (Platform Blueprint, Section 5/10).

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const ACCESS_KEY = 'agriflow.auth.access'
const REFRESH_KEY = 'agriflow.auth.refresh'

export interface Role {
  slug: string
  name: string
}

export interface AuthUser {
  id: number
  phone_number: string
  email: string | null
  display_name: string
  roles: Role[]
  date_joined: string
}

export interface AuthTokens {
  access: string
  refresh: string
  user: AuthUser
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

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    return body.detail ?? Object.values(body).flat().join(' ') ?? response.statusText
  } catch {
    return response.statusText
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
    const refreshed = await tryRefresh(tokens.refresh)
    if (refreshed) return request<T>(path, init, false)
    clearTokens()
  }

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function tryRefresh(refresh: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (!response.ok) return false
    const body = (await response.json()) as { access: string }
    localStorage.setItem(ACCESS_KEY, body.access)
    return true
  } catch {
    return false
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

export function getMe() {
  return request<AuthUser>('/api/v1/auth/me/')
}

export function updateMe(displayName: string) {
  return request<AuthUser>('/api/v1/auth/me/', {
    method: 'PATCH',
    body: JSON.stringify({ display_name: displayName }),
  })
}

export { ApiError }

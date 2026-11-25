// A stand-in for the API and the device's secure storage, for tests.
import type { AuthUser } from '@/auth/types'

export const USER: AuthUser = {
  id: 7,
  phone_number: null,
  email: 'amina@example.com',
  display_name: 'Amina',
  country: 'RW',
  language: 'en',
  roles: [],
  needs_onboarding: false,
  onboarded_at: '2026-11-01T00:00:00Z',
  date_joined: '2026-10-01T00:00:00Z',
}

type Reply = { status: number; body?: unknown } | 'offline'
type Handler = (body: Record<string, unknown> | null, init: RequestInit) => Reply

/** Answers by path; anything not listed is a 404. Records each call. */
export function fakeApi(routes: Record<string, Handler>) {
  const calls: { path: string; body: Record<string, unknown> | null; auth?: string }[] = []
  const fetchMock = jest.fn(async (url: string, init: RequestInit = {}) => {
    const path = new URL(url).pathname
    const body = init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null
    const auth = (init.headers as Record<string, string> | undefined)?.Authorization
    calls.push({ path, body, auth })
    const reply = routes[path]?.(body, init) ?? { status: 404, body: { detail: 'Not found.' } }
    if (reply === 'offline') throw new TypeError('Network request failed')
    return {
      ok: reply.status >= 200 && reply.status < 300,
      status: reply.status,
      json: async () => reply.body,
    } as Response
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return { calls, fetchMock }
}

export const signedIn = (user: AuthUser = USER, created = false) => ({
  status: 200,
  body: { access: 'access-1', refresh: 'refresh-1', user, created },
})

/** In-memory secure storage; mock '@/lib/secure-storage' with it. */
export const storage = new Map<string, string>()
export const secureStorageMock = {
  getItem: async (key: string) => storage.get(key) ?? null,
  setItem: async (key: string, value: string) => void storage.set(key, value),
  removeItem: async (key: string) => void storage.delete(key),
}

export function saveSession(user: AuthUser | null = USER) {
  storage.set('agriflow.auth.access', 'access-0')
  storage.set('agriflow.auth.refresh', 'refresh-0')
  if (user) storage.set('agriflow.auth.user', JSON.stringify(user))
}

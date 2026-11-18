import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getMe, getStoredTokens, logout, storeTokens } from './apiClient'

// A stand-in for the API's token rules: each refresh token works once and
// is swapped for a new pair; only the latest access token is accepted.
function fakeApi() {
  const state = { access: 'access-1', refresh: 'refresh-1', serial: 1, refreshCalls: 0, loggedOut: [] as string[] }
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

  const fetchMock = vi.fn(async (url: string, init: RequestInit = {}) => {
    const path = new URL(url).pathname
    const body = init.body ? JSON.parse(String(init.body)) : {}
    if (path === '/api/v1/auth/token/refresh/') {
      state.refreshCalls += 1
      if (body.refresh !== state.refresh) return json(401, { detail: 'Token is blacklisted' })
      state.serial += 1
      state.access = `access-${state.serial}`
      state.refresh = `refresh-${state.serial}`
      return json(200, { access: state.access, refresh: state.refresh })
    }
    if (path === '/api/v1/auth/token/logout/') {
      state.loggedOut.push(body.refresh)
      return json(200, {})
    }
    const auth = (init.headers as Record<string, string>)?.Authorization
    if (auth !== `Bearer ${state.access}`) return json(401, { detail: 'Token expired' })
    return json(200, { id: 1, phone_number: null, email: 'a@example.com', display_name: '', roles: [] })
  })
  return { state, fetchMock }
}

describe('apiClient tokens', () => {
  let api: ReturnType<typeof fakeApi>

  beforeEach(() => {
    localStorage.clear()
    api = fakeApi()
    vi.stubGlobal('fetch', api.fetchMock)
    storeTokens('access-1', 'refresh-1')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the new refresh token, so the next refresh works too', async () => {
    api.state.access = 'expired' // the stored access token no longer works
    await getMe()
    expect(getStoredTokens()).toEqual({ access: 'access-2', refresh: 'refresh-2' })

    api.state.access = 'expired again'
    await expect(getMe()).resolves.toMatchObject({ email: 'a@example.com' })
    expect(getStoredTokens()?.refresh).toBe('refresh-3')
  })

  it('refreshes once when several requests expire at the same moment', async () => {
    api.state.access = 'expired'
    await Promise.all([getMe(), getMe(), getMe()])
    expect(api.state.refreshCalls).toBe(1)
    expect(getStoredTokens()).toEqual({ access: 'access-2', refresh: 'refresh-2' })
  })

  it('reuses tokens another request already refreshed instead of spending the old one', async () => {
    api.state.access = 'expired'
    // The second request's 401 is held back until the first request has
    // refreshed and finished.
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    const answer = api.fetchMock.getMockImplementation()!
    let meCalls = 0
    api.fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      const response = await answer(url, init)
      if (new URL(url).pathname === '/api/v1/auth/me/' && ++meCalls === 2) await gate
      return response
    })

    const first = getMe()
    const late = getMe()
    await first
    release()

    await expect(late).resolves.toMatchObject({ email: 'a@example.com' })
    expect(api.state.refreshCalls).toBe(1)
    expect(getStoredTokens()).toEqual({ access: 'access-2', refresh: 'refresh-2' })
  })

  it('logs out on the server too, and forgets the tokens', async () => {
    await logout()
    expect(api.state.loggedOut).toEqual(['refresh-1'])
    expect(getStoredTokens()).toBeNull()
  })

  it('still logs out locally when the API cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    await logout()
    expect(getStoredTokens()).toBeNull()
  })
})

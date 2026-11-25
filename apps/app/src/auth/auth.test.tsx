import { act, render, screen } from '@testing-library/react-native'
import { useEffect } from 'react'
import { Text } from 'react-native'

import { fakeApi, saveSession, signedIn, storage, USER } from '@/test/fake-api'

import { AuthProvider, useAuth } from '.'

jest.mock('@/lib/secure-storage', () => jest.requireActual('@/test/fake-api').secureStorageMock)
jest.mock('@/lib/config', () => ({ API_URL: 'http://api.test' }))

// The provider's latest value, for the test to call.
const latest: { current?: ReturnType<typeof useAuth> } = {}
function Probe() {
  const auth = useAuth()
  useEffect(() => {
    latest.current = auth
  })
  return (
    <Text>
      {auth.status} {auth.user?.display_name ?? '-'} {auth.offline ? 'offline' : 'online'}
    </Text>
  )
}

async function launch() {
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
}

afterEach(() => storage.clear())

describe('AuthProvider', () => {
  it('starts signed out when nothing is saved', async () => {
    fakeApi({})
    await launch()
    expect(await screen.findByText('signed-out - online')).toBeOnTheScreen()
  })

  it('signs in with an email code and keeps the session on the device', async () => {
    const api = fakeApi({ '/api/v1/auth/magic-link/code/': () => signedIn() })
    await launch()
    await screen.findByText(/signed-out/)
    await act(() => latest.current!.verifyEmailCode('amina@example.com', '123456'))

    expect(screen.getByText('signed-in Amina online')).toBeOnTheScreen()
    expect(api.calls[0].body).toEqual({ email: 'amina@example.com', code: '123456' })
    expect(storage.get('agriflow.auth.refresh')).toBe('refresh-1')
    expect(JSON.parse(storage.get('agriflow.auth.user')!)).toEqual(USER)
  })

  it('opens signed in from the saved session with no connection', async () => {
    saveSession()
    fakeApi({ '/api/v1/auth/me/': () => 'offline' })
    await launch()
    expect(await screen.findByText('signed-in Amina offline')).toBeOnTheScreen()
    expect(storage.has('agriflow.auth.refresh')).toBe(true)
  })

  it('shows fresh details once the API answers', async () => {
    saveSession()
    fakeApi({ '/api/v1/auth/me/': () => ({ status: 200, body: { ...USER, display_name: 'Amina K.' } }) })
    await launch()
    expect(await screen.findByText('signed-in Amina K. online')).toBeOnTheScreen()
  })

  it('refreshes an expired access token and carries on', async () => {
    saveSession()
    const api = fakeApi({
      '/api/v1/auth/me/': (_body, init) =>
        (init.headers as Record<string, string>).Authorization === 'Bearer access-2'
          ? { status: 200, body: USER }
          : { status: 401, body: { detail: 'Token expired.' } },
      '/api/v1/auth/token/refresh/': () => ({ status: 200, body: { access: 'access-2', refresh: 'refresh-2' } }),
    })
    await launch()
    expect(await screen.findByText('signed-in Amina online')).toBeOnTheScreen()
    expect(storage.get('agriflow.auth.refresh')).toBe('refresh-2')
    expect(api.calls.map((c) => c.path)).toEqual([
      '/api/v1/auth/me/',
      '/api/v1/auth/token/refresh/',
      '/api/v1/auth/me/',
    ])
  })

  it('keeps the session when the refresh itself has no connection', async () => {
    saveSession()
    fakeApi({
      '/api/v1/auth/me/': () => ({ status: 401 }),
      '/api/v1/auth/token/refresh/': () => 'offline',
    })
    await launch()
    expect(await screen.findByText('signed-in Amina offline')).toBeOnTheScreen()
    expect(storage.has('agriflow.auth.refresh')).toBe(true)
  })

  it('signs out only when the API refuses the session', async () => {
    saveSession()
    fakeApi({
      '/api/v1/auth/me/': () => ({ status: 401 }),
      '/api/v1/auth/token/refresh/': () => ({ status: 401, body: { detail: 'Token is blacklisted.' } }),
    })
    await launch()
    expect(await screen.findByText('signed-out - online')).toBeOnTheScreen()
    expect(storage.size).toBe(0)
  })

  it('asks to try again when only the tokens were saved and the API is out of reach', async () => {
    saveSession(null)
    const routes: Record<string, () => 'offline' | { status: number; body: unknown }> = {
      '/api/v1/auth/me/': () => 'offline',
    }
    fakeApi(routes)
    await launch()
    expect(await screen.findByText('unreachable - offline')).toBeOnTheScreen()

    routes['/api/v1/auth/me/'] = () => ({ status: 200, body: USER })
    await act(() => latest.current!.retry())
    expect(screen.getByText('signed-in Amina online')).toBeOnTheScreen()
  })

  it('signs out on the device and retires the refresh token', async () => {
    saveSession()
    const api = fakeApi({
      '/api/v1/auth/me/': () => ({ status: 200, body: USER }),
      '/api/v1/auth/token/logout/': () => ({ status: 200, body: {} }),
    })
    await launch()
    await screen.findByText(/signed-in/)
    await act(() => latest.current!.signOut())
    expect(screen.getByText('signed-out - online')).toBeOnTheScreen()
    expect(storage.size).toBe(0)
    expect(api.calls.at(-1)).toMatchObject({ path: '/api/v1/auth/token/logout/', body: { refresh: 'refresh-0' } })
  })
})

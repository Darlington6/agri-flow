import { act, fireEvent, screen } from '@testing-library/react-native'
import { renderRouter } from 'expo-router/testing-library'

import { fakeApi, saveSession, storage, USER } from '@/test/fake-api'

jest.mock('@/lib/secure-storage', () => jest.requireActual('@/test/fake-api').secureStorageMock)
jest.mock('@/lib/config', () => ({ API_URL: 'http://api.test' }))
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }))

// The real route files (src/app; tests live here because every file there is a route).
const routes = {
  _layout: require('@/app/_layout').default,
  index: require('@/app/index').default,
  'sign-in': require('@/app/sign-in').default,
  home: require('@/app/home').default,
  welcome: require('@/app/welcome').default,
  'auth/google': require('@/app/auth/google').default,
}

afterEach(() => storage.clear())

describe('routes', () => {
  it('opens on the start screen when signed out, and home can’t be reached', async () => {
    fakeApi({})
    await renderRouter(routes, { initialUrl: '/home' })
    expect(await screen.findByRole('button', { name: 'Sign in or create an account' })).toBeOnTheScreen()
    expect(screen.queryByText('Sign out')).toBeNull()
  })

  it('opens on home when signed in, even offline, and goes back to the start after signing out', async () => {
    saveSession()
    fakeApi({ '/api/v1/auth/me/': () => 'offline', '/api/v1/auth/token/logout/': () => 'offline' })
    await renderRouter(routes, { initialUrl: '/' })
    expect(await screen.findByRole('heading', { name: `Welcome, ${USER.display_name}` })).toBeOnTheScreen()
    expect(screen.getByText(/You’re offline. You’re still signed in/)).toBeOnTheScreen()

    await act(async () => {
      await fireEvent.press(screen.getByRole('button', { name: 'Sign out' }))
    })
    expect(await screen.findByRole('button', { name: 'Sign in or create an account' })).toBeOnTheScreen()
  })

  it('takes a new account to the welcome steps, and home can’t be reached until they’re done', async () => {
    saveSession({ ...USER, display_name: '', needs_onboarding: true, onboarded_at: null })
    fakeApi({
      '/api/v1/auth/me/': () => 'offline',
      '/api/v1/onboarding/': () => 'offline',
      '/api/v1/network/profiles/': () => 'offline',
    })
    await renderRouter(routes, { initialUrl: '/home' })
    expect(await screen.findByRole('heading', { name: 'Welcome to AgriFlow' })).toBeOnTheScreen()
    expect(
      await screen.findByText('We can’t reach AgriFlow. Check your internet connection and try again.'),
    ).toBeOnTheScreen()
    expect(screen.queryByText('Sign out')).toBeNull()
  })
})

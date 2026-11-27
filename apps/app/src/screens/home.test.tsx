import { render, screen } from '@testing-library/react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AuthProvider } from '@/auth'
import { I18nProvider } from '@/i18n'
import { fakeApi, saveSession, storage, USER } from '@/test/fake-api'

import { Home } from './home'

jest.mock('@/lib/secure-storage', () => jest.requireActual('@/test/fake-api').secureStorageMock)
jest.mock('@/lib/config', () => ({ API_URL: 'http://api.test' }))

afterEach(() => storage.clear())

describe('Home', () => {
  it('greets by first name and shows each role, its verification and what’s coming', async () => {
    const user = { ...USER, display_name: 'Aline Uwase' }
    saveSession(user)
    fakeApi({
      '/api/v1/auth/me/': () => ({ status: 200, body: user }),
      '/api/v1/network/profiles/': () => ({
        status: 200,
        body: [{ role: 'farmer', verification: 'unverified', region: 'Kigali', crops: ['maize'] }],
      }),
    })
    await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, right: 0, bottom: 0, left: 0 },
        }}
      >
        <AuthProvider>
          <I18nProvider>
            <Home />
          </I18nProvider>
        </AuthProvider>
      </SafeAreaProvider>,
    )
    expect(await screen.findByRole('heading', { name: 'Welcome, Aline' })).toBeOnTheScreen()
    expect(await screen.findByRole('heading', { name: 'Farmer' })).toBeOnTheScreen()
    expect(screen.getByText('Not verified yet')).toBeOnTheScreen()
    expect(screen.getByText(/Record your harvest and follow your payments/)).toBeOnTheScreen()
  })
})

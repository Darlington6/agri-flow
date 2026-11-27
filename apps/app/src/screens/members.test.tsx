import { fireEvent, render, screen } from '@testing-library/react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AuthProvider } from '@/auth'
import { I18nProvider } from '@/i18n'
import { fakeApi, saveSession, storage, USER } from '@/test/fake-api'

import { Home } from './home'
import { Members } from './members'

jest.mock('@/lib/secure-storage', () => jest.requireActual('@/test/fake-api').secureStorageMock)
jest.mock('@/lib/config', () => ({ API_URL: 'http://api.test' }))
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
}))

const MANAGER = { ...USER, roles: [{ slug: 'cooperative', name: 'Cooperative' }] }

const member = (id: number, name: string, status: string) => ({
  id,
  status,
  requested_at: '',
  decided_at: null,
  farmer: {
    name,
    phone_number: '+250788123456',
    region: 'Northern Province',
    district: 'Musanze',
    crops: ['Beans'],
    farm_size_hectares: null,
    verified: false,
  },
})

async function show(screenElement: React.ReactElement) {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <AuthProvider>
        <I18nProvider>{screenElement}</I18nProvider>
      </AuthProvider>
    </SafeAreaProvider>,
  )
}

afterEach(() => storage.clear())

describe('Members', () => {
  it('confirms a farmer who chose the cooperative', async () => {
    saveSession(MANAGER)
    const api = fakeApi({
      '/api/v1/auth/me/': () => ({ status: 200, body: MANAGER }),
      '/api/v1/network/cooperative/members/': () => ({
        status: 200,
        body: {
          cooperative: { name: 'Abahuzamugambi', confirmed: 1, pending: 1 },
          members: [member(2, 'Aline U.', 'pending'), member(1, 'Jean H.', 'confirmed')],
        },
      }),
      '/api/v1/network/cooperative/members/2/': () => ({ status: 200, body: member(2, 'Aline U.', 'confirmed') }),
    })
    await show(<Members />)

    expect(await screen.findByRole('heading', { name: 'Abahuzamugambi members' })).toBeOnTheScreen()
    expect(screen.getByRole('heading', { name: 'Waiting for you (1)' })).toBeOnTheScreen()
    expect(screen.getAllByRole('link', { name: 'Call +250 788 123 456' })).toHaveLength(2)

    await fireEvent.press(screen.getByRole('button', { name: 'Confirm Aline U.' }))
    expect(await screen.findByRole('heading', { name: 'Members (2)' })).toBeOnTheScreen()
    expect(screen.getByRole('heading', { name: 'Waiting for you (0)' })).toBeOnTheScreen()
    expect(api.calls.find((c) => c.body)?.body).toEqual({ status: 'confirmed' })
  })

  it('says so to someone who doesn’t manage a cooperative', async () => {
    saveSession(USER)
    fakeApi({
      '/api/v1/auth/me/': () => ({ status: 200, body: USER }),
      '/api/v1/network/cooperative/members/': () => ({
        status: 403,
        body: { detail: 'Only a cooperative’s manager can see its members.' },
      }),
    })
    await show(<Members />)
    expect(await screen.findByText('Only a cooperative’s manager can see its members.')).toBeOnTheScreen()
  })

  it('home counts the members and points to those waiting', async () => {
    saveSession(MANAGER)
    fakeApi({
      '/api/v1/auth/me/': () => ({ status: 200, body: MANAGER }),
      '/api/v1/network/profiles/': () => ({
        status: 200,
        body: [
          {
            role: 'cooperative',
            verification: 'unverified',
            name: 'Abahuzamugambi',
            crops: ['beans'],
            members: { confirmed: 3, pending: 2 },
          },
        ],
      }),
    })
    await show(<Home />)
    expect(await screen.findByText('3 members on AgriFlow. 2 waiting for you to confirm.')).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Confirm members' })).toBeOnTheScreen()
  })
})

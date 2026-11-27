import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AuthProvider, useAuth } from '@/auth'
import type { AuthUser } from '@/auth/types'
import { I18nProvider } from '@/i18n'
import { fakeApi, saveSession, storage, USER } from '@/test/fake-api'

import { Welcome } from '.'

jest.mock('@/lib/secure-storage', () => jest.requireActual('@/test/fake-api').secureStorageMock)
jest.mock('@/lib/config', () => ({ API_URL: 'http://api.test', SITE_URL: 'https://site.test' }))
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-RW', regionCode: 'RW' }],
  getCalendars: () => [{ timeZone: 'Africa/Kigali' }],
}))

const NEW: AuthUser = {
  ...USER,
  display_name: '',
  country: '',
  language: '',
  needs_onboarding: true,
  onboarded_at: null,
}

const STATE = {
  steps: { name: false, place: false, role: false, phone: false, terms: false },
  next_step: 'name',
  complete: false,
  terms_version: '2026-11-draft',
}

const NO_GUARDIAN = { guardian_name: '', guardian_relationship: '', guardian_phone: '' }
const NO_DETAILS = { legal_name: '', date_of_birth: null, gender: '', ...NO_GUARDIAN }

const OPTIONS = {
  country: 'RW',
  regions: [{ name: 'Kigali', districts: ['Gasabo', 'Kicukiro'] }],
  crops: [
    { value: 'maize', label: 'Maize' },
    { value: 'beans', label: 'Beans' },
  ],
  buyer_types: [],
  vehicle_types: [],
}

/** Shows whether the account is set up, as the layout would act on it. */
function Status() {
  const { user } = useAuth()
  return <Text>{user?.needs_onboarding === false ? 'set up' : 'setting up'}</Text>
}

async function open() {
  await render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <AuthProvider>
        <I18nProvider>
          <Status />
          <Welcome />
        </I18nProvider>
      </AuthProvider>
    </SafeAreaProvider>,
  )
}

afterEach(() => storage.clear())

describe('Welcome', () => {
  it('sets up a farmer step by step, saving each answer', async () => {
    saveSession(NEW)
    let user = NEW
    const api = fakeApi({
      '/api/v1/auth/me/': (body) => {
        if (body) user = { ...user, ...body }
        return { status: 200, body: user }
      },
      '/api/v1/onboarding/': () => ({ status: 200, body: STATE }),
      '/api/v1/network/profiles/': (body) =>
        body ? { status: 201, body: { ...body, verification: 'unverified' } } : { status: 200, body: [] },
      '/api/v1/compliance/personal-details/': (body) => ({ status: 200, body: body ?? NO_DETAILS }),
      '/api/v1/network/options/': () => ({ status: 200, body: OPTIONS }),
      '/api/v1/onboarding/skip-phone/': () => ({ status: 200, body: STATE }),
      '/api/v1/onboarding/complete/': () => ({
        status: 200,
        body: { ...user, needs_onboarding: false, onboarded_at: '2026-11-26T00:00:00Z' },
      }),
    })
    await open()

    // About you: as on their ID, private; the public name is suggested from it.
    expect(await screen.findByRole('heading', { name: 'About you' })).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
    await fireEvent.changeText(screen.getByLabelText('Full name'), '  Aline Uwase ')
    expect(screen.getByLabelText('Name others see')).toHaveDisplayValue('Aline U.')
    await fireEvent.changeText(screen.getByLabelText('Day'), '31')
    await fireEvent.changeText(screen.getByLabelText('Month'), '2')
    await fireEvent.changeText(screen.getByLabelText('Year'), '1994')
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Enter a real date: day, month and a 4-digit year.')).toBeOnTheScreen()
    await fireEvent.changeText(screen.getByLabelText('Day'), '12')
    await fireEvent.changeText(screen.getByLabelText('Month'), '3')
    await fireEvent.press(screen.getByRole('radio', { name: 'Woman' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))

    // Place: the country starts on the phone's (Rwanda), English chosen.
    expect(await screen.findByRole('heading', { name: 'Where are you?' })).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Country: Rwanda' })).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))

    // Role, then its details.
    await fireEvent.press(await screen.findByRole('button', { name: /^Farmer\./ }))
    expect(await screen.findByRole('heading', { name: 'About your farm' })).toBeOnTheScreen()
    await fireEvent.press(await screen.findByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Choose at least one crop.')).toBeOnTheScreen()

    await fireEvent.press(screen.getByRole('button', { name: 'Province: Choose…' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Kigali' }))
    await fireEvent.press(screen.getByRole('button', { name: 'District: Choose…' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Gasabo' }))
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Maize' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))

    // Phone: worded for a farmer, and skippable.
    expect(await screen.findByText(/So buyers, your cooperative and delivery partners can reach you/)).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Skip for now' }))

    // Terms: Finish only once they've agreed.
    expect(await screen.findByRole('heading', { name: 'One last thing' })).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Finish' })).toBeDisabled()
    await fireEvent.press(screen.getByRole('checkbox', { name: /I agree to the terms of use/ }))
    await fireEvent.press(screen.getByRole('button', { name: 'Finish' }))
    expect(await screen.findByText('set up')).toBeOnTheScreen()

    expect(api.calls.filter((c) => c.body).map((c) => [c.path, c.body])).toEqual([
      [
        '/api/v1/compliance/personal-details/',
        { legal_name: 'Aline Uwase', date_of_birth: '1994-03-12', gender: 'woman', ...NO_GUARDIAN },
      ],
      ['/api/v1/auth/me/', { display_name: 'Aline U.' }],
      ['/api/v1/auth/me/', { country: 'RW', language: 'en' }],
      [
        '/api/v1/network/profiles/',
        {
          role: 'farmer',
          region: 'Kigali',
          district: 'Gasabo',
          crops: ['maize'],
          farm_size_hectares: null,
          cooperative_name: '',
        },
      ],
      ['/api/v1/onboarding/complete/', { terms_version: '2026-11-draft', accept_terms: true }],
    ])
  })

  it('asks someone under 18 for a parent or guardian', async () => {
    saveSession(NEW)
    const api = fakeApi({
      '/api/v1/auth/me/': () => ({ status: 200, body: NEW }),
      '/api/v1/onboarding/': () => ({ status: 200, body: STATE }),
      '/api/v1/network/profiles/': () => ({ status: 200, body: [] }),
      '/api/v1/compliance/personal-details/': (body) => ({ status: 200, body: body ?? NO_DETAILS }),
    })
    await open()
    await fireEvent.changeText(await screen.findByLabelText('Full name'), 'Eric Habimana')
    const year = String(new Date().getFullYear() - 15)
    await fireEvent.changeText(screen.getByLabelText('Day'), '15')
    await fireEvent.changeText(screen.getByLabelText('Month'), '1')
    await fireEvent.changeText(screen.getByLabelText('Year'), year)

    expect(screen.getByText(/You’re under 18/)).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
    await fireEvent.changeText(screen.getByLabelText('Parent or guardian’s full name'), 'Jean Habimana')
    await fireEvent.press(screen.getByRole('radio', { name: 'Parent' }))
    await fireEvent.changeText(screen.getByLabelText('Their phone number'), '0788 123 456')
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByRole('heading', { name: 'Where are you?' })).toBeOnTheScreen()
    expect(api.calls.find((c) => c.path === '/api/v1/compliance/personal-details/' && c.body)?.body).toEqual({
      legal_name: 'Eric Habimana',
      date_of_birth: `${year}-01-15`,
      gender: '',
      guardian_name: 'Jean Habimana',
      guardian_relationship: 'parent',
      guardian_phone: '+250788123456',
    })
  })

  it('picks up where they stopped, and goes back a step', async () => {
    saveSession({ ...NEW, display_name: 'Aline', country: 'RW', language: 'en' })
    fakeApi({
      '/api/v1/auth/me/': () => ({
        status: 200,
        body: { ...NEW, display_name: 'Aline', country: 'RW', language: 'en' },
      }),
      '/api/v1/onboarding/': () => ({ status: 200, body: { ...STATE, next_step: 'role' } }),
      '/api/v1/network/profiles/': () => ({ status: 200, body: [] }),
      '/api/v1/compliance/personal-details/': () => ({ status: 200, body: NO_DETAILS }),
    })
    await open()
    expect(await screen.findByRole('heading', { name: 'What brings you to AgriFlow?' })).toBeOnTheScreen()
    expect(screen.getByText('Step 3 of 5')).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('heading', { name: 'Where are you?' })).toBeOnTheScreen()
  })

  it('only asks someone already set up to agree to new terms', async () => {
    const returning = { ...USER, needs_onboarding: true }
    saveSession(returning)
    fakeApi({
      '/api/v1/auth/me/': () => ({ status: 200, body: returning }),
      '/api/v1/onboarding/': () => ({ status: 200, body: { ...STATE, next_step: 'terms' } }),
      '/api/v1/network/profiles/': () => ({ status: 200, body: [] }),
      '/api/v1/compliance/personal-details/': () => ({ status: 200, body: NO_DETAILS }),
    })
    await open()
    expect(await screen.findByRole('heading', { name: 'Our terms have changed' })).toBeOnTheScreen()
    expect(screen.queryByText(/Step \d of/)).toBeNull()
  })
})

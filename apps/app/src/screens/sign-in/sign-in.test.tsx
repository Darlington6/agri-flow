import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { router } from 'expo-router'
import { Text } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AuthProvider, useAuth } from '@/auth'
import { I18nProvider } from '@/i18n'
import { fakeApi, signedIn, storage } from '@/test/fake-api'

import { SignIn } from '.'

jest.mock('@/lib/secure-storage', () => jest.requireActual('@/test/fake-api').secureStorageMock)
jest.mock('expo-router', () => ({ router: { canGoBack: jest.fn(() => true), back: jest.fn(), replace: jest.fn() } }))
jest.mock('@/lib/config', () => ({ API_URL: 'http://api.test' }))
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-RW', regionCode: 'RW' }],
  getCalendars: () => [{ timeZone: 'Africa/Kigali' }],
}))

function Status() {
  const { status, user } = useAuth()
  return <Text testID="status">{`${status} ${user?.email ?? user?.phone_number ?? ''}`}</Text>
}

const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 }

async function open(props: Parameters<typeof SignIn>[0] = {}) {
  await render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: NO_INSETS }}>
      <AuthProvider>
        <I18nProvider>
          <Status />
          <SignIn {...props} />
        </I18nProvider>
      </AuthProvider>
    </SafeAreaProvider>,
  )
  await screen.findByText('signed-out ')
}

// A local API's code is printed for developers; not needed here.
beforeEach(() => jest.spyOn(console, 'info').mockImplementation(() => {}))
afterEach(() => storage.clear())

describe('SignIn', () => {
  it('signs in with the code from the email', async () => {
    const api = fakeApi({
      '/api/v1/auth/magic-link/request/': () => ({ status: 202, body: {} }),
      '/api/v1/auth/magic-link/code/': () => signedIn(),
    })
    await open()
    expect(screen.getByRole('heading', { name: 'Sign in with email' })).toBeOnTheScreen()

    await fireEvent.changeText(screen.getByLabelText('Email'), ' Amina@Example.com ')
    await fireEvent.press(screen.getByRole('button', { name: 'Email me a code' }))
    expect(await screen.findByText(/We sent a 6-digit code to amina@example.com/)).toBeOnTheScreen()

    await fireEvent.changeText(screen.getByLabelText('6-digit code'), '123456')
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('signed-in amina@example.com')).toBeOnTheScreen()
    expect(api.calls.map((c) => c.body)).toEqual([
      { email: 'amina@example.com' },
      { email: 'amina@example.com', code: '123456' },
    ])
  })

  it('checks the email and code before asking the API', async () => {
    const api = fakeApi({ '/api/v1/auth/magic-link/request/': () => ({ status: 202, body: {} }) })
    await open()
    await fireEvent.changeText(screen.getByLabelText('Email'), 'amina')
    await fireEvent.press(screen.getByRole('button', { name: 'Email me a code' }))
    expect(screen.getByText('Enter an email address, like you@example.com.')).toBeOnTheScreen()
    expect(api.calls).toHaveLength(0)

    await fireEvent.changeText(screen.getByLabelText('Email'), 'amina@example.com')
    await fireEvent.press(screen.getByRole('button', { name: 'Email me a code' }))
    await fireEvent.changeText(await screen.findByLabelText('6-digit code'), '12 34')
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByText('Enter the 6 digits from the message.')).toBeOnTheScreen()
    expect(api.calls).toHaveLength(1)
  })

  it("shows the API's reason when a code is wrong, and can send a new one", async () => {
    fakeApi({
      '/api/v1/auth/magic-link/request/': () => ({ status: 202, body: { debug_code: '654321' } }),
      '/api/v1/auth/magic-link/code/': () => ({ status: 400, body: { detail: 'Incorrect code.' } }),
    })
    await open()
    await fireEvent.changeText(screen.getByLabelText('Email'), 'amina@example.com')
    await fireEvent.press(screen.getByRole('button', { name: 'Email me a code' }))
    // A local API sends the code back, for development.
    expect(await screen.findByText(/Dev mode: the code is 654321/)).toBeOnTheScreen()

    await fireEvent.changeText(screen.getByLabelText('6-digit code'), '000000')
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Incorrect code.')).toBeOnTheScreen()

    await fireEvent.press(screen.getByRole('button', { name: 'Send a new code' }))
    expect(await screen.findByText('New code sent.')).toBeOnTheScreen()
  })

  it('says so when there is no connection', async () => {
    fakeApi({ '/api/v1/auth/magic-link/request/': () => 'offline' })
    await open()
    await fireEvent.changeText(screen.getByLabelText('Email'), 'amina@example.com')
    await fireEvent.press(screen.getByRole('button', { name: 'Email me a code' }))
    expect(
      await screen.findByText('We can’t reach AgriFlow. Check your internet connection and try again.'),
    ).toBeOnTheScreen()
  })

  it('signs in with a texted code, reading a local number in the right country', async () => {
    const api = fakeApi({
      '/api/v1/auth/otp/request/': () => ({ status: 202, body: {} }),
      '/api/v1/auth/otp/verify/': () =>
        signedIn({ ...signedIn().body.user, email: null, phone_number: '+250788123456' }),
    })
    await open()
    await fireEvent.press(screen.getByRole('button', { name: 'Use my phone instead' }))
    expect(screen.getByRole('button', { name: 'Country: Rwanda (+250)' })).toBeOnTheScreen()

    await fireEvent.changeText(screen.getByLabelText('Phone number'), '0788 123 456')
    await fireEvent.press(screen.getByRole('button', { name: 'Text me a code' }))
    expect(await screen.findByText('We sent a 6-digit code to +250 788 123 456.')).toBeOnTheScreen()

    await fireEvent.changeText(screen.getByLabelText('6-digit code'), '123456')
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('signed-in +250788123456')).toBeOnTheScreen()
    expect(api.calls.map((c) => c.body)).toEqual([
      { phone_number: '+250788123456' },
      { phone_number: '+250788123456', code: '123456' },
    ])
  })

  it('lets people pick another country from a searchable list', async () => {
    fakeApi({})
    await open()
    await fireEvent.press(screen.getByRole('button', { name: 'Use my phone instead' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Country: Rwanda (+250)' }))
    await fireEvent.changeText(screen.getByLabelText('Search countries'), 'ken')
    await fireEvent.press(screen.getByRole('button', { name: 'Kenya (+254)' }))
    expect(screen.getByRole('button', { name: 'Country: Kenya (+254)' })).toBeOnTheScreen()
  })

  it('closes the country list without changing the country', async () => {
    fakeApi({})
    await open()
    await fireEvent.press(screen.getByRole('button', { name: 'Use my phone instead' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Country: Rwanda (+250)' }))
    expect(screen.getByText('Choose your country')).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByText('Choose your country')).toBeNull())
    expect(screen.getByRole('button', { name: 'Country: Rwanda (+250)' })).toBeOnTheScreen()
  })

  it('goes back a step at a time, then back to the welcome screen', async () => {
    fakeApi({ '/api/v1/auth/magic-link/request/': () => ({ status: 202, body: {} }) })
    await open()
    await fireEvent.press(screen.getByRole('button', { name: 'Use my phone instead' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByLabelText('Email')).toBeOnTheScreen()

    await fireEvent.changeText(screen.getByLabelText('Email'), 'amina@example.com')
    await fireEvent.press(screen.getByRole('button', { name: 'Email me a code' }))
    expect(await screen.findByLabelText('6-digit code')).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByLabelText('Email')).toHaveDisplayValue('amina@example.com')
    expect(router.back).not.toHaveBeenCalled()

    await fireEvent.press(screen.getByRole('button', { name: 'Back' }))
    expect(router.back).toHaveBeenCalled()
  })

  it('only offers Google in the browser build for now', async () => {
    fakeApi({})
    await open()
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).toBeNull()
  })

  it('says why Google sign-in came back without signing in', async () => {
    fakeApi({})
    await open({ googleError: 'stale' })
    expect(screen.getByText('That Google sign-in had expired. Try again.')).toBeOnTheScreen()
  })
})

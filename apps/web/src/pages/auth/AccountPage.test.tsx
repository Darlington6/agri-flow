import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { storeTokens } from '@/lib/apiClient'
import { AccountPage } from './AccountPage'

const phoneOnly = {
  id: 1,
  phone_number: '+250788123456',
  email: null,
  display_name: 'Abena',
  country: 'RW',
  language: 'en',
  roles: [],
  needs_onboarding: false,
  onboarded_at: '2026-11-23T10:00:00Z',
  date_joined: '',
}

const OPTIONS = {
  country: 'RW',
  regions: [
    { name: 'Northern Province', districts: ['Musanze', 'Burera'] },
    { name: 'Southern Province', districts: ['Huye'] },
  ],
  crops: [
    { value: 'maize', label: 'Maize' },
    { value: 'beans', label: 'Beans' },
  ],
  buyer_types: [{ value: 'processor', label: 'Processor' }],
  vehicle_types: [{ value: 'truck', label: 'Truck' }],
  cooperatives: [],
}

const FARMER = {
  role: 'farmer',
  verification: 'unverified',
  created_at: '',
  updated_at: '',
  region: 'Northern Province',
  district: 'Musanze',
  crops: ['maize'],
  farm_size_hectares: null,
  cooperative_name: '',
}

function renderAccount(user: object, answers: Record<string, { status: number; body: unknown }> = {}) {
  const calls: { path: string; body: unknown }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const path = new URL(url).pathname
      calls.push({ path, body: init.body ? JSON.parse(String(init.body)) : undefined })
      const answer =
        answers[path] ??
        (path === '/api/v1/network/profiles/'
          ? { status: 200, body: [] }
          : path === '/api/v1/network/options/'
            ? { status: 200, body: OPTIONS }
            : { status: 200, body: user })
      return new Response(JSON.stringify(answer.body), { status: answer.status })
    }),
  )
  storeTokens('access', 'refresh')
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/account']}>
        <Routes>
          <Route path="/account" element={<AccountPage />} />
          <Route path="/welcome" element={<p>At welcome</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
  return calls
}

describe('AccountPage contacts', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'info').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows the phone number and offers to add an email', async () => {
    renderAccount(phoneOnly)
    expect(await screen.findByText('+250788123456')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add email' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add phone number' })).not.toBeInTheDocument()
  })

  it('links back to the account home', async () => {
    renderAccount(phoneOnly)
    expect(await screen.findByRole('link', { name: 'Home' })).toHaveAttribute('href', '/home')
  })

  it('lists the chosen roles with their verification, and roles given by AgriFlow', async () => {
    renderAccount(
      {
        ...phoneOnly,
        roles: [
          { slug: 'farmer', name: 'Farmer' },
          { slug: 'field_agent', name: 'Field Agent' },
        ],
      },
      { '/api/v1/network/profiles/': { status: 200, body: [FARMER] } },
    )
    expect(await screen.findByText('Not verified yet')).toBeInTheDocument()
    expect(screen.getByText('Field Agent')).toBeInTheDocument()
    expect(screen.getByText('Given by AgriFlow')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add another role' })).toHaveAttribute('href', '/add-role')
  })

  it("edits a role's details, sending only that role's fields", async () => {
    const calls = renderAccount(phoneOnly, {
      '/api/v1/network/profiles/': { status: 200, body: [FARMER] },
      '/api/v1/network/profiles/farmer/': { status: 200, body: { ...FARMER, crops: ['maize', 'beans'] } },
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Edit details for Farmer' }))
    await userEvent.click(screen.getByRole('button', { name: 'Beans' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save details' }))

    expect(await screen.findByRole('button', { name: 'Edit details for Farmer' })).toBeInTheDocument()
    expect(calls).toContainEqual({
      path: '/api/v1/network/profiles/farmer/',
      body: {
        region: 'Northern Province',
        district: 'Musanze',
        crops: ['maize', 'beans'],
        farm_size_hectares: null,
        cooperative_id: null,
        cooperative_name: '',
      },
    })
  })

  it("shows the API's message next to the field it is about", async () => {
    renderAccount(phoneOnly, {
      '/api/v1/network/profiles/': { status: 200, body: [FARMER] },
      '/api/v1/network/profiles/farmer/': {
        status: 400,
        body: { district: ['Choose a district in that region.'] },
      },
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Edit details for Farmer' }))
    await userEvent.click(screen.getByRole('button', { name: 'Save details' }))
    expect(await screen.findByText('Choose a district in that region.')).toBeInTheDocument()
    expect(screen.getByLabelText('District')).toHaveAttribute('aria-invalid', 'true')
  })

  it('saves name, country and language together', async () => {
    const calls = renderAccount(phoneOnly)
    await userEvent.selectOptions(await screen.findByLabelText('Language'), 'rw')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Saved.')).toBeInTheDocument()
    expect(calls).toContainEqual({
      path: '/api/v1/auth/me/',
      body: { display_name: 'Abena', country: 'RW', language: 'rw' },
    })
  })

  it('sends an account that still needs setting up to /welcome', async () => {
    renderAccount({ ...phoneOnly, needs_onboarding: true })
    expect(await screen.findByText('At welcome')).toBeInTheDocument()
  })

  it('nudges an email-only account to add a phone number', async () => {
    renderAccount({ ...phoneOnly, phone_number: null, email: 'abena@example.com' })
    expect(
      await screen.findByText(/Add a phone number so the people you work with on AgriFlow can reach you/),
    ).toBeInTheDocument()
  })

  it('emails a confirmation link to the address being added', async () => {
    const calls = renderAccount(phoneOnly, { '/api/v1/auth/me/email/': { status: 202, body: {} } })
    await userEvent.click(await screen.findByRole('button', { name: 'Add email' }))
    await userEvent.type(screen.getByLabelText('Email'), 'abena@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Send link' }))

    expect(await screen.findByText(/We've sent a link to/)).toHaveTextContent('abena@example.com')
    expect(calls).toContainEqual({ path: '/api/v1/auth/me/email/', body: { email: 'abena@example.com' } })
  })

  it('says why when the email belongs to another account', async () => {
    renderAccount(phoneOnly, {
      '/api/v1/auth/me/email/': { status: 409, body: { detail: 'This email belongs to another account.' } },
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Add email' }))
    await userEvent.type(screen.getByLabelText('Email'), 'taken@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Send link' }))

    expect(await screen.findByText('This email belongs to another account.')).toBeInTheDocument()
  })

  it('adds a phone number to an email account once the texted code is confirmed', async () => {
    const emailOnly = { ...phoneOnly, phone_number: null, email: 'abena@example.com' }
    const calls = renderAccount(emailOnly, {
      '/api/v1/auth/me/phone/': { status: 202, body: { debug_code: '123456' } },
      '/api/v1/auth/me/phone/confirm/': { status: 200, body: { ...emailOnly, phone_number: '+250788123456' } },
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Add phone number' }))
    await userEvent.type(screen.getByLabelText('Phone number'), '+250788123456')
    await userEvent.click(screen.getByRole('button', { name: 'Send code' }))
    await userEvent.type(await screen.findByLabelText('6-digit code'), '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(await screen.findByText('+250788123456')).toBeInTheDocument()
    expect(console.info).toHaveBeenCalledWith('[AgriFlow dev] Code for +250788123456: 123456')
    expect(calls).toContainEqual({
      path: '/api/v1/auth/me/phone/confirm/',
      body: { phone_number: '+250788123456', code: '123456' },
    })
  })
})

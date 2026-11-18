import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { storeTokens } from '@/lib/apiClient'
import { AccountPage } from './AccountPage'

const phoneOnly = { id: 1, phone_number: '+250788123456', email: null, display_name: '', roles: [], date_joined: '' }

function renderAccount(user: object, answers: Record<string, { status: number; body: unknown }> = {}) {
  const calls: { path: string; body: unknown }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const path = new URL(url).pathname
      calls.push({ path, body: init.body ? JSON.parse(String(init.body)) : undefined })
      const answer = answers[path] ?? { status: 200, body: user }
      return new Response(JSON.stringify(answer.body), { status: answer.status })
    }),
  )
  storeTokens('access', 'refresh')
  render(
    <AuthProvider>
      <MemoryRouter>
        <AccountPage />
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

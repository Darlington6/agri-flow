import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { SignInPage } from './SignInPage'

function renderSignIn() {
  render(
    <AuthProvider>
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('SignInPage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('starts with email, since phone codes need an SMS provider', () => {
    renderSignIn()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    // Email, then the phone link, then Google last.
    expect(screen.getAllByRole('separator', { name: 'Or' })).toHaveLength(2)
    const google = screen.getByTestId('google-button')
    const phoneLink = screen.getByRole('button', { name: 'Use my phone instead' })
    expect(phoneLink.compareDocumentPosition(google) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('switches between email and phone with clearly labelled buttons', async () => {
    renderSignIn()
    await userEvent.click(screen.getByRole('button', { name: 'Use my phone instead' }))
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Use email instead' }))
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('sends a local number in international form, in the country picked', async () => {
    const bodies: unknown[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit = {}) => {
        bodies.push(JSON.parse(String(init.body)))
        return new Response(JSON.stringify({}), { status: 202 })
      }),
    )
    renderSignIn()
    await userEvent.click(screen.getByRole('button', { name: 'Use my phone instead' }))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Country' }), 'RW')
    expect(screen.getByLabelText('Phone number')).toHaveAttribute('placeholder', expect.stringMatching(/^07/))

    await userEvent.type(screen.getByLabelText('Phone number'), '0788 123 456')
    await userEvent.click(screen.getByRole('button', { name: 'Send code' }))

    expect(bodies).toContainEqual({ phone_number: '+250788123456' })
    expect(await screen.findByText('Sent to +250 788 123 456.')).toBeInTheDocument()
    // The seedling grows while the code is on its way; it's decoration, hidden from screen readers.
    expect(screen.getByTestId('growing-sprout')).toHaveAttribute('aria-hidden', 'true')
    vi.unstubAllGlobals()
  })

  it('moves the country along when a number is typed with +', async () => {
    renderSignIn()
    await userEvent.click(screen.getByRole('button', { name: 'Use my phone instead' }))
    await userEvent.type(screen.getByLabelText('Phone number'), '+254712345678')
    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveValue('KE')
  })
})

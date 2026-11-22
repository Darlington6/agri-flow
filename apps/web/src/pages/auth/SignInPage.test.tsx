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
    expect(screen.getByRole('separator', { name: 'Or' })).toBeInTheDocument()
  })

  it('switches between email and phone with clearly labelled buttons', async () => {
    renderSignIn()
    await userEvent.click(screen.getByRole('button', { name: 'Use my phone instead' }))
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Use email instead' }))
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })
})

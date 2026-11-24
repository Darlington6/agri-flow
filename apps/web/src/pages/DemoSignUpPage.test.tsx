import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SessionProvider, useSession } from '@/context/SessionContext'
import { DemoSignUpPage } from './DemoSignUpPage'

function Dashboard() {
  const { session } = useSession()
  return <p>Dashboard as {session?.role}</p>
}

function renderWalkthrough() {
  render(
    <SessionProvider>
      <MemoryRouter initialEntries={['/try-sign-up']}>
        <Routes>
          <Route path="/try-sign-up" element={<DemoSignUpPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  )
}

describe('the sign-up walkthrough', () => {
  beforeEach(() => localStorage.clear())

  it('runs the real setup screens, saves nothing, and opens the demo as the role chosen', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    renderWalkthrough()
    expect(screen.getByText(/nothing you enter is saved or sent/)).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Your name'), 'Aline')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await userEvent.selectOptions(await screen.findByLabelText('Country'), 'RW')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await userEvent.click(await screen.findByRole('button', { name: /Cooperative/ }))
    expect(screen.getByRole('heading', { name: 'About your cooperative' })).toBeInTheDocument()
    await userEvent.type(await screen.findByLabelText('Cooperative name'), 'Abahuzamugambi')
    await userEvent.selectOptions(screen.getByLabelText('Province'), 'Western Province')
    await userEvent.selectOptions(screen.getByLabelText('District'), 'Nyamasheke')
    await userEvent.click(screen.getByRole('button', { name: 'Coffee' }))
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    // The demo gives the code instead of texting it.
    await userEvent.type(await screen.findByLabelText('Phone number'), '0788123456')
    await userEvent.click(screen.getByRole('button', { name: 'Send code' }))
    expect(await screen.findByText(/no text was sent. Enter 123456/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('6-digit code'), '000000')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(await screen.findByText('Incorrect code.')).toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText('6-digit code'))
    await userEvent.type(screen.getByLabelText('6-digit code'), '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

    await userEvent.click(await screen.findByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }))

    expect(await screen.findByText('Dashboard as Cooperative')).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
    // Clicks through every setup screen, so it needs more than the default 5 s
    // when the whole repo's tests run side by side (as in CI).
  }, 20_000)
})

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SessionProvider } from '@/context/SessionContext'
import { LoginPage } from './LoginPage'

function renderLogin() {
  return render(
    <SessionProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<h1>Dashboard</h1>} />
        </Routes>
      </MemoryRouter>
    </SessionProvider>,
  )
}

const ROLES = ['Platform Admin', 'Super Admin', 'Buyer', 'Field Agent', 'Farmer', 'Delivery Partner']

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('offers every demo role as a button named after the role', () => {
    renderLogin()
    for (const role of ROLES) {
      expect(screen.getByRole('button', { name: role })).toBeInTheDocument()
    }
  })

  it('describes what each role can see', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: 'Delivery Partner' })).toHaveAccessibleDescription(
      /book the ones that fit your route/i,
    )
  })

  it('signs in with the keyboard alone: Tab to a role, then Enter', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Platform Admin' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('also works with Space, like any button', async () => {
    const user = userEvent.setup()
    renderLogin()
    screen.getByRole('button', { name: 'Farmer' }).focus()
    await user.keyboard(' ')
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('remembers the chosen role', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: 'Buyer' }))
    expect(JSON.parse(localStorage.getItem('agriflow.demo-session') ?? '{}')).toMatchObject({ role: 'Buyer' })
  })
})

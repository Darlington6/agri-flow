import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SessionProvider } from '@/context/SessionContext'
import { PlatformDataProvider } from '@/context/PlatformDataContext'
import { AppLayout } from './AppLayout'
import type { DemoRole } from '@/types'

function renderDemoAs(role: DemoRole) {
  const sessions: Record<string, object> = {
    Cooperative: { role, name: 'Akua', cooperativeId: 'G001' },
    Farmer: { role, name: 'Abena', farmerId: 'F001' },
  }
  localStorage.setItem('agriflow.demo-session', JSON.stringify(sessions[role]))
  return render(
    <SessionProvider>
      <PlatformDataProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<p>Dashboard page</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </PlatformDataProvider>
    </SessionProvider>,
  )
}

describe('the demo tour', () => {
  beforeEach(() => localStorage.clear())

  it("opens the first time a role is explored, in that role's words", async () => {
    renderDemoAs('Cooperative')
    const tour = screen.getByRole('dialog', { name: 'Welcome to the demo, Akua' })
    expect(tour).toHaveTextContent("Techiman Growers' Cooperative")

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { name: 'Where to start' })).toHaveFocus()
    expect(tour).toHaveTextContent('Members')
    expect(tour).toHaveTextContent('who needs help')

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('link', { name: 'Walk through signing up' })).toHaveAttribute('href', '/try-sign-up')
    await userEvent.click(screen.getByRole('button', { name: 'Start exploring' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it("doesn't open again once seen, but the Tour button brings it back", async () => {
    const first = renderDemoAs('Farmer')
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
    first.unmount()

    renderDemoAs('Farmer')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tour' }))
    expect(screen.getByRole('dialog', { name: 'Welcome to the demo, Abena' })).toBeInTheDocument()
  })

  it('is remembered per role', async () => {
    const farmer = renderDemoAs('Farmer')
    await userEvent.click(screen.getByRole('button', { name: 'Close the tour' }))
    farmer.unmount()
    renderDemoAs('Cooperative')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

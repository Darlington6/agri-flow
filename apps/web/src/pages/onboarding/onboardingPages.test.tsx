import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { storeTokens } from '@/lib/apiClient'
import { GoogleReturnPage } from '@/pages/auth/GoogleReturnPage'
import { SignInPage } from '@/pages/auth/SignInPage'
import { WelcomePage } from './WelcomePage'
import { HomePage } from './HomePage'

const NEW_USER = {
  id: 7,
  phone_number: '+250788123456',
  email: null,
  display_name: 'Aline',
  country: 'RW',
  language: 'en',
  roles: [],
  needs_onboarding: true,
  onboarded_at: null,
  date_joined: '',
}
const READY = { ...NEW_USER, roles: [{ slug: 'farmer', name: 'Farmer' }], needs_onboarding: false, onboarded_at: 'x' }
const STATE = {
  steps: { name: true, place: true, role: true, phone: true, terms: false },
  next_step: 'terms',
  complete: false,
  terms_version: '2026-11-draft',
}
const FARMER = {
  role: 'farmer',
  verification: 'pending',
  created_at: '',
  updated_at: '',
  region: 'Northern Province',
  district: 'Musanze',
  crops: ['maize'],
  farm_size_hectares: null,
  cooperative_name: '',
}

type Answers = Record<string, { status?: number; body: unknown }>

function renderAt(path: string, answers: Answers, signedIn = true) {
  const calls: { path: string; method: string; body: unknown }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const p = new URL(url).pathname
      calls.push({ path: p, method: init.method ?? 'GET', body: init.body ? JSON.parse(String(init.body)) : undefined })
      const answer = answers[`${init.method ?? 'GET'} ${p}`] ??
        answers[p] ?? { status: 404, body: { detail: 'Not found' } }
      return new Response(JSON.stringify(answer.body), { status: answer.status ?? 200 })
    }),
  )
  if (signedIn) storeTokens('access', 'refresh')
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/auth/google" element={<GoogleReturnPage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/home" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
  return calls
}

describe('account setup pages', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('sends a new account from sign-in to /welcome', async () => {
    renderAt('/signin', {
      '/api/v1/auth/me/': { body: NEW_USER },
      '/api/v1/onboarding/': { body: STATE },
      '/api/v1/network/profiles/': { body: [FARMER] },
    })
    expect(await screen.findByRole('heading', { name: 'Welcome to AgriFlow' })).toBeInTheDocument()
  })

  it('picks up where they stopped, then goes home once they agree to the terms', async () => {
    const calls = renderAt('/welcome', {
      '/api/v1/auth/me/': { body: NEW_USER },
      '/api/v1/onboarding/': { body: STATE },
      '/api/v1/network/profiles/': { body: [FARMER] },
      'POST /api/v1/onboarding/complete/': { body: READY },
    })
    expect(await screen.findByRole('heading', { name: 'One last thing' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }))

    expect(await screen.findByRole('heading', { name: 'Welcome, Aline' })).toBeInTheDocument()
    expect(calls).toContainEqual({
      path: '/api/v1/onboarding/complete/',
      method: 'POST',
      body: { terms_version: '2026-11-draft', accept_terms: true },
    })
  })

  it("says when the account can't be loaded, and tries again", async () => {
    renderAt('/welcome', {
      '/api/v1/auth/me/': { body: NEW_USER },
      '/api/v1/onboarding/': { status: 500, body: { detail: 'Server error' } },
      '/api/v1/network/profiles/': { body: [] },
    })
    expect(await screen.findByRole('alert')).toHaveTextContent('Server error')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('keeps a set-up account out of /welcome', async () => {
    renderAt('/welcome', { '/api/v1/auth/me/': { body: READY }, '/api/v1/network/profiles/': { body: [FARMER] } })
    expect(await screen.findByRole('heading', { name: 'Welcome, Aline' })).toBeInTheDocument()
  })

  it('sends someone signed out from /home to sign in', async () => {
    renderAt('/home', {}, false)
    expect(await screen.findByRole('button', { name: 'Send link' })).toBeInTheDocument()
  })

  it("home shows each role's verification and what's coming, with the demo a click away", async () => {
    renderAt('/home', { '/api/v1/auth/me/': { body: READY }, '/api/v1/network/profiles/': { body: [FARMER] } })
    expect(await screen.findByRole('heading', { name: 'Farmer' })).toBeInTheDocument()
    expect(screen.getByText('Verification in progress')).toBeInTheDocument()
    expect(screen.getByText('See what buyers need before you plant')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explore the demo' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Add another role' })).toHaveAttribute('href', '/add-role')
  })

  describe('continue with Google', () => {
    // What startGoogleSignIn leaves in this tab before going to Google.
    function cameBackFromGoogle(fragment: string) {
      sessionStorage.setItem('agriflow.google-sign-in', JSON.stringify({ state: 's1', nonce: 'n1', at: Date.now() }))
      window.history.replaceState(null, '', `/auth/google#${fragment}`)
    }
    afterEach(() => {
      sessionStorage.clear()
      window.history.replaceState(null, '', '/')
    })

    it('signs in a new Google account and takes them to set up', async () => {
      cameBackFromGoogle('state=s1&id_token=google-id-token&authuser=0')
      const calls = renderAt(
        '/auth/google',
        {
          'POST /api/v1/auth/google/': { body: { access: 'a', refresh: 'r', user: NEW_USER, created: true } },
          '/api/v1/onboarding/': { body: { ...STATE, next_step: 'role' } },
          '/api/v1/network/profiles/': { body: [] },
          '/api/v1/network/options/': {
            body: { country: 'RW', regions: [], crops: [], buyer_types: [], vehicle_types: [] },
          },
        },
        false,
      )

      expect(await screen.findByRole('heading', { name: 'Welcome to AgriFlow' })).toBeInTheDocument()
      expect(calls).toContainEqual({
        path: '/api/v1/auth/google/',
        method: 'POST',
        body: { credential: 'google-id-token', nonce: 'n1' },
      })
      expect(localStorage.getItem('agriflow.auth.access')).toBe('a')
      // The token is gone from the address, and the request can't be used again.
      expect(window.location.hash).toBe('')
      expect(sessionStorage.getItem('agriflow.google-sign-in')).toBeNull()
    })

    it("goes back to sign-in and says why when Google sign-in can't be used", async () => {
      cameBackFromGoogle('state=s1&id_token=x')
      renderAt(
        '/auth/google',
        {
          'POST /api/v1/auth/google/': {
            status: 409,
            body: { detail: 'This email is linked to a different Google account.' },
          },
        },
        false,
      )
      expect(await screen.findByRole('alert')).toHaveTextContent('linked to a different Google account')
      expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
    })

    it('refuses an answer this tab never asked for, without calling the API', async () => {
      cameBackFromGoogle('state=someone-elses&id_token=x')
      const calls = renderAt('/auth/google', {}, false)
      expect(await screen.findByRole('alert')).toHaveTextContent('expired')
      expect(calls.filter((c) => c.path === '/api/v1/auth/google/')).toHaveLength(0)
    })

    it("goes quietly back to sign-in when they close Google's picker", async () => {
      cameBackFromGoogle('error=access_denied&state=s1')
      renderAt('/auth/google', {}, false)
      expect(await screen.findByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})

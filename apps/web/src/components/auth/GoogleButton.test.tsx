import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoogleButton } from './GoogleButton'

describe('GoogleButton', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    sessionStorage.clear()
  })

  it('is our own button, there at once, the same size as the other sign-in buttons', () => {
    render(<GoogleButton before={<p>Or</p>} />)
    const button = screen.getByRole('button', { name: 'Continue with Google' })
    expect(button).toBeEnabled()
    expect(button).toHaveClass('h-11', 'rounded-full')
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden')
    expect(screen.getByText('Or')).toBeInTheDocument()
    // Nothing of Google's is loaded until someone taps it.
    expect(document.querySelector('script[src*="accounts.google.com"]')).toBeNull()
  })

  it("goes to Google's account picker when tapped", async () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, origin: 'https://app.example', assign })
    render(<GoogleButton />)
    await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))

    const url = new URL(assign.mock.calls[0][0])
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect(url.searchParams.get('redirect_uri')).toBe('https://app.example/auth/google')
    expect(url.searchParams.get('prompt')).toBe('select_account')
    expect(screen.getByRole('button', { name: 'Opening Google…' })).toBeDisabled()
  })

  it('explains how to open a real browser inside apps that block Google', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Linux; Android 14; wv) WhatsApp')
    render(<GoogleButton before={<p>Or</p>} />)
    expect(screen.getByText(/open this page in your browser/)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

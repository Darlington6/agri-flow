import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GoogleButton } from './GoogleButton'
import type { GoogleIdentity } from '@/lib/google'

function fakeGoogle() {
  const id = {
    initialize: vi.fn(),
    renderButton: vi.fn((parent: HTMLElement, _options: Parameters<GoogleIdentity['renderButton']>[1]) => {
      parent.innerHTML = '<button>Continue with Google</button>'
    }),
    disableAutoSelect: vi.fn(),
  } satisfies GoogleIdentity
  window.google = { accounts: { id } }
  return id
}

describe('GoogleButton', () => {
  afterEach(() => {
    delete window.google
    vi.restoreAllMocks()
  })

  it("draws Google's button and passes on the credential it hands back", async () => {
    const google = fakeGoogle()
    const onCredential = vi.fn()
    render(<GoogleButton onCredential={onCredential} before={<p>Or</p>} />)

    expect(await screen.findByRole('button', { name: 'Continue with Google' })).toBeInTheDocument()
    expect(screen.getByText('Or')).toBeInTheDocument()
    const config = google.initialize.mock.calls[0][0]
    expect(config.client_id).toMatch(/\.apps\.googleusercontent\.com$/)
    expect(google.renderButton.mock.calls[0][1]).toMatchObject({
      text: 'continue_with',
      theme: 'outline',
      locale: 'en',
    })

    config.callback({ credential: 'id-token' })
    expect(onCredential).toHaveBeenCalledWith('id-token')
  })

  it('explains how to open a real browser inside apps that block Google', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (Linux; Android 14; wv) WhatsApp')
    const google = fakeGoogle()
    render(<GoogleButton onCredential={() => {}} before={<p>Or</p>} />)
    expect(screen.getByText(/open this page in your browser/)).toBeInTheDocument()
    expect(screen.getByText('Or')).toBeInTheDocument()
    expect(google.initialize).not.toHaveBeenCalled()
  })
})

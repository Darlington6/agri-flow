import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as Sentry from '@sentry/react'
import { identify, initMonitoring, scrubBreadcrumb, scrubEvent, scrubText, scrubUrl } from './monitoring'

vi.mock('@sentry/react', () => ({ init: vi.fn(), setUser: vi.fn(), setTag: vi.fn() }))

const env = (extra: Partial<ImportMetaEnv> = {}) =>
  ({ VITE_DEPLOY_ENV: 'preview', VITE_RELEASE: 'abc123', ...extra }) as ImportMetaEnv

describe('scrubbing', () => {
  it('hides emails and phone numbers in text', () => {
    expect(scrubText('No account for abena@example.com or +250 788 123 456')).toBe(
      'No account for [Filtered] or [Filtered]',
    )
  })

  it('hides the one-time token in sign-in and confirmation links', () => {
    expect(scrubUrl('https://app.example/magic-link?token=secret')).toBe(
      'https://app.example/magic-link?token=[Filtered]',
    )
    expect(scrubUrl('/confirm-email?token=secret&from=mail#top')).toBe('/confirm-email?token=[Filtered]&from=mail#top')
    expect(scrubUrl('https://app.example/account')).toBe('https://app.example/account')
  })

  it('cleans a whole error report', () => {
    const event = scrubEvent({
      type: undefined,
      request: { url: 'https://app.example/magic-link?token=secret', cookies: { a: 'b' }, data: { email: 'x@y.z' } },
      exception: { values: [{ type: 'Error', value: 'Code 123456 for +250788123456 failed' }] },
      breadcrumbs: [
        { category: 'fetch', data: { url: 'https://api.example/api/v1/auth/magic-link/verify/?token=secret' } },
      ],
    })
    const sent = JSON.stringify(event)
    for (const secret of ['secret', '+250788123456', 'x@y.z', 'cookies']) expect(sent).not.toContain(secret)
  })

  it('cleans navigation breadcrumbs', () => {
    const crumb = scrubBreadcrumb({ category: 'navigation', data: { from: '/signin', to: '/magic-link?token=secret' } })
    expect(crumb.data).toEqual({ from: '/signin', to: '/magic-link?token=[Filtered]' })
  })
})

describe('initMonitoring', () => {
  beforeEach(() => vi.mocked(Sentry.init).mockClear())

  it('sends nothing unless a DSN is set', () => {
    expect(initMonitoring(env())).toBe(false)
    expect(Sentry.init).not.toHaveBeenCalled()
  })

  it('reports errors for this deployment without personal data', () => {
    expect(initMonitoring(env({ VITE_SENTRY_DSN: 'https://public@o0.ingest.de.sentry.io/0' }))).toBe(true)
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: 'preview',
        release: 'abc123',
        dataCollection: expect.objectContaining({ userInfo: false, cookies: false, httpBodies: [] }),
        beforeSend: scrubEvent,
      }),
    )
  })
})

describe('identify', () => {
  it('tags reports with the user id and roles only', () => {
    identify({
      id: 42,
      phone_number: '+250788123456',
      email: 'abena@example.com',
      display_name: 'Abena',
      roles: [{ slug: 'buyer', name: 'Buyer' }],
      date_joined: '',
    })
    expect(Sentry.setUser).toHaveBeenLastCalledWith({ id: '42' })
    expect(Sentry.setTag).toHaveBeenLastCalledWith('roles', 'buyer')
  })

  it('forgets the user on sign-out', () => {
    identify(null)
    expect(Sentry.setUser).toHaveBeenLastCalledWith(null)
  })
})

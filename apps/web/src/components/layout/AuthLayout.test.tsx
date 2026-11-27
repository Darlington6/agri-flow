import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { APP_PHOTOS } from '@agriflow/media'
import { AuthLayout } from './AuthLayout'

function prefersReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: reduce, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  )
}

// The photos only, not the logo in the page's backdrop.
const images = (container: HTMLElement) => [...container.querySelectorAll<HTMLImageElement>('img[sizes]')]

describe('AuthLayout photos', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('loads the first photo, then the rest, and crossfades only once all are in', () => {
    prefersReducedMotion(false)
    const { container } = render(<AuthLayout photo="signIn">form</AuthLayout>)
    expect(images(container)).toHaveLength(1)

    fireEvent.load(images(container)[0])
    expect(images(container)).toHaveLength(APP_PHOTOS.signIn.length)
    expect(container.querySelector('.auth-slide')).toBeNull()

    for (const img of images(container).slice(1)) fireEvent.load(img)
    expect(container.querySelectorAll('.auth-slide')).toHaveLength(APP_PHOTOS.signIn.length)
  })

  it('shows only the first photo, still, for people who ask for less motion', () => {
    prefersReducedMotion(true)
    const { container } = render(<AuthLayout photo="signIn">form</AuthLayout>)
    fireEvent.load(images(container)[0])
    expect(images(container)).toHaveLength(1)
    expect(container.querySelector('.auth-slide')).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LogoMark } from './LogoMark'

describe('LogoMark', () => {
  it('is hidden from screen readers by default, since the brand name sits next to it', () => {
    const { container } = render(<LogoMark />)
    const img = container.querySelector('img')
    expect(img).toHaveAttribute('alt', '')
    expect(img).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img', { name: 'AgriFlow' })).not.toBeInTheDocument()
  })

  it('is announced as "AgriFlow" when it stands alone', () => {
    render(<LogoMark decorative={false} />)
    expect(screen.getByRole('img', { name: 'AgriFlow' })).not.toHaveAttribute('aria-hidden')
  })

  it('uses the reversed artwork (cream ring) for dark backgrounds', () => {
    // Small SVGs are inlined as data URLs, so check the artwork itself rather
    // than a file name: the reversed mark swaps the forest ring for cream.
    const { unmount } = render(<LogoMark decorative={false} />)
    const standardSrc = screen.getByRole('img', { name: 'AgriFlow' }).getAttribute('src') ?? ''
    unmount()
    render(<LogoMark decorative={false} variant="reversed" />)
    const reversedSrc = screen.getByRole('img', { name: 'AgriFlow' }).getAttribute('src') ?? ''

    expect(reversedSrc).not.toBe(standardSrc)
    expect(decodeURIComponent(reversedSrc).toUpperCase()).toContain('F5F1E6')
    expect(decodeURIComponent(standardSrc).toUpperCase()).toContain('283F2F')
  })

  it('keeps the caller’s sizing class', () => {
    render(<LogoMark decorative={false} className="h-9" />)
    expect(screen.getByRole('img', { name: 'AgriFlow' })).toHaveClass('h-9')
  })
})

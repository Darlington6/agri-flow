import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Backdrop } from './Backdrop'

describe('Backdrop', () => {
  it('is hidden from screen readers and lets clicks through to the page', () => {
    const { container } = render(<Backdrop />)
    const backdrop = container.firstElementChild!
    expect(backdrop).toHaveAttribute('aria-hidden', 'true')
    expect(backdrop).toHaveClass('pointer-events-none')
    for (const img of backdrop.querySelectorAll('img')) expect(img).toHaveAttribute('alt', '')
  })
})

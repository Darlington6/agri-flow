import { render } from '@testing-library/react-native'

import { colors } from '@/theme'

import { GLOW, LAYER_OPACITY, LAYOUT, LogoGlow, RING, SAGE, SUN } from './logo-glow'

// WCAG contrast ratio between two #rrggbb colours.
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** `top` laid over `under` at `opacity`, as the screen draws it. */
function over(under: string, top: string, opacity: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(i, i + 2), 16)
  return `#${[1, 3, 5]
    .map((i) => Math.round(channel(under, i) * (1 - opacity) + channel(top, i) * opacity))
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`
}

describe('LogoGlow', () => {
  // The glow and the ring share a centre; the glow fades to nothing at its
  // edge, so just outside the ring it's at this share of its full strength.
  const glowAtRing = 1 - LAYOUT.ring[2] / LAYOUT.glow[2]

  it('keeps grey text readable outside the ring, where screens put their text', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const palette = colors[scheme]
      const behind = over(palette.canvas, GLOW, LAYER_OPACITY[scheme].glow * glowAtRing)
      expect(contrast(palette.muted, behind)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps text and links readable over the ring and sun, in the corner', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const palette = colors[scheme]
      const o = LAYER_OPACITY[scheme]
      const darkest = [
        [GLOW, o.glow],
        [RING[scheme], o.ring],
        [SUN, o.sun],
        [SAGE, o.sage],
      ].reduce((under, [top, opacity]) => over(under, top as string, opacity as number), palette.canvas as string)
      for (const role of ['text', 'heading', 'link'] as const) {
        expect(contrast(palette[role], darkest)).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('is hidden from screen readers', async () => {
    const { toJSON } = await render(<LogoGlow size={300} breathing />)
    expect(toJSON()).toMatchObject({ props: { 'aria-hidden': true, pointerEvents: 'none' } })
  })
})

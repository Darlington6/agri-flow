import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { brand, chat, gold, ink, primary, sage, status } from '@agriflow/design-tokens'

// Read from disk: the test config skips CSS processing, which would make a
// `?raw` import empty. (Avoid `new URL(path, import.meta.url)` too: Vite
// rewrites that pattern into a web asset URL.)
const here = dirname(fileURLToPath(import.meta.url))
const themeCss = readFileSync(resolve(here, '../../../../packages/design-tokens/src/theme.css'), 'utf8')

// theme.css is the palette every app uses (through Tailwind); index.ts mirrors
// it for code that needs raw values. These tests keep the two identical, lock
// in the logo colours, and fail if a palette change makes text unreadable.
const css: Record<string, string> = Object.fromEntries(
  [...themeCss.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1], m[2]]),
)
const color = (token: string) => {
  const value = css[token]
  if (!value) throw new Error(`theme.css has no --color-${token}`)
  return value
}

describe('palette files', () => {
  it.each([
    ['primary', primary],
    ['brand', brand],
    ['gold', gold],
    ['sage', sage],
    ['ink', ink],
  ] as const)('theme.css and index.ts agree on %s', (name, ramp) => {
    for (const [step, hex] of Object.entries(ramp)) {
      expect(color(`${name}-${step}`), `${name}-${step}`).toBe(hex)
    }
  })

  it('theme.css and index.ts agree on status colours', () => {
    expect(color('status-good')).toBe(status.good)
    expect(color('status-warn')).toBe(status.warn)
    expect(color('status-risk')).toBe(status.risk)
    expect(color('status-info')).toBe(status.info)
    expect(color('status-good-text')).toBe(status.goodText)
    expect(color('status-warn-text')).toBe(status.warnText)
    expect(color('status-risk-text')).toBe(status.riskText)
    expect(color('status-info-text')).toBe(status.infoText)
  })

  it('theme.css and index.ts agree on the chat bubble colour', () => {
    expect(color('chat-own')).toBe(chat.own)
  })

  it('keeps the exact logo colours in the scales', () => {
    expect(color('brand-800')).toBe('#283f2f') // logo ring
    expect(color('gold-400')).toBe('#b2934d') // logo centre
    expect(color('sage-400')).toBe('#93a281') // logo lower circle
  })
})

// WCAG 2 relative luminance and contrast ratio.
function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const WHITE = '#ffffff'

describe('contrast (WCAG AA)', () => {
  // Text needs 4.5:1. These are the pairings the app actually renders.
  it.each([
    ['button text: white on primary-600', WHITE, 'primary-600'],
    ['links: primary-700 on white', 'primary-700', WHITE],
    ['links: primary-700 on the ink-50 page', 'primary-700', 'ink-50'],
    ['selected nav: primary-800 on primary-50', 'primary-800', 'primary-50'],
    ['pilot tag: gold-700 on gold-100', 'gold-700', 'gold-100'],
    ['icon chips: brand-700 on brand-50', 'brand-700', 'brand-50'],
    ['avatars: white on brand-700', WHITE, 'brand-700'],
    ['your chat bubbles: white on chat-own', WHITE, 'chat-own'],
    ['dark cards: brand-100 on brand-950', 'brand-100', 'brand-950'],
    ['secondary text: ink-600 on white', 'ink-600', WHITE],
    ['small grey text: ink-500 on white', 'ink-500', WHITE],
    ['small grey text: ink-500 on the ink-50 page', 'ink-500', 'ink-50'],
    ['KYC Verified / Low risk badge', 'status-good-text', 'status-good-bg'],
    ['KYC Pending / Medium risk badge', 'status-warn-text', 'status-warn-bg'],
    ['High risk badge', 'status-risk-text', 'status-risk-bg'],
    ['info badge', 'status-info-text', 'status-info-bg'],
  ])('%s', (_label, fg, bg) => {
    const ratio = contrast(fg.startsWith('#') ? fg : color(fg), bg.startsWith('#') ? bg : color(bg))
    expect(ratio).toBeGreaterThanOrEqual(4.5)
  })

  // Non-text UI (focus rings, bars) needs 3:1 against what's next to it.
  it.each([
    ['focus ring: primary-500 on white', 'primary-500', WHITE],
    ['focus ring: primary-500 on primary-50 buttons', 'primary-500', 'primary-50'],
    ['field focus border: primary-400 on white', 'primary-400', WHITE],
    ['progress bar: brand-600 on its sage-100 track', 'brand-600', 'sage-100'],
  ])('%s', (_label, fg, bg) => {
    const ratio = contrast(color(fg), bg.startsWith('#') ? bg : color(bg))
    expect(ratio).toBeGreaterThanOrEqual(3)
  })

  it('never uses the light logo gold or sage as text on white', () => {
    // A reminder of why the palette says "fills only" for these two.
    expect(contrast(color('gold-400'), WHITE)).toBeLessThan(4.5)
    expect(contrast(color('sage-400'), WHITE)).toBeLessThan(4.5)
  })
})

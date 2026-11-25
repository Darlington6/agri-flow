import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { colors, type ColorRole } from './colors'

// The web app (apps/web) is still where most screens live, so a role must
// mean the same colour in both apps. This reads the web app's CSS and fails
// when the two drift apart. Remove it once apps/web is retired.
const css = readFileSync(join(__dirname, '../../../web/src/index.css'), 'utf8')
const darkBlock = css.slice(css.indexOf(":root[data-theme='dark']"))
const lightBlock = css.slice(0, css.indexOf(":root[data-theme='dark']"))
const tokensCss = readFileSync(join(__dirname, '../../../../packages/design-tokens/src/theme.css'), 'utf8')

function value(block: string, variable: string): string {
  const match = block.match(new RegExp(`--color-${variable}:\\s*(#[0-9a-fA-F]{6})`))
  if (!match) throw new Error(`--color-${variable} not found`)
  return match[1].toLowerCase()
}

// Our role -> the web app's CSS variable.
const WEB_VARIABLE: Record<ColorRole, string> = {
  canvas: 'canvas',
  surface: 'surface',
  text: 'ink-800',
  heading: 'ink-900',
  // The web app's secondary text is ink-600 (ink-500 is too faint on cream).
  muted: 'ink-600',
  border: 'ink-200',
  action: 'action',
  actionPressed: 'action-hover',
  onAction: 'on-action',
  accent: 'accent',
  link: 'primary-700',
  focus: 'primary-500',
  good: 'status-good-text',
  warn: 'status-warn-text',
  risk: 'status-risk-text',
  info: 'status-info-text',
}

describe('colour roles match the web app', () => {
  const roles = Object.keys(WEB_VARIABLE) as ColorRole[]

  it.each(roles)('light %s', (role) => {
    const variable = WEB_VARIABLE[role]
    // Named roles are in the web app's CSS; the scales come from the shared tokens.
    const source = lightBlock.includes(`--color-${variable}:`) ? lightBlock : tokensCss
    expect(colors.light[role].toLowerCase()).toBe(value(source, variable))
  })

  // Focus stays teal-500 in dark mode on the web; the app uses the lighter
  // link teal so the focus ring stands out on near-black.
  it.each(roles.filter((role) => role !== 'focus'))('dark %s', (role) => {
    expect(colors.dark[role].toLowerCase()).toBe(value(darkBlock, WEB_VARIABLE[role]))
  })
})

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

describe('text is readable', () => {
  it.each(['light', 'dark'] as const)('%s: grey text has at least 4.5:1 on the canvas and on cards', (scheme) => {
    const palette = colors[scheme]
    for (const background of [palette.canvas, palette.surface]) {
      expect(contrast(palette.muted, background)).toBeGreaterThanOrEqual(4.5)
      expect(contrast(palette.text, background)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

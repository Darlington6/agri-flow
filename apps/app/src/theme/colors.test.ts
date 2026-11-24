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
  muted: 'ink-500',
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

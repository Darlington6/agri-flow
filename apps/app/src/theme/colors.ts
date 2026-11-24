import { brand, cream, gold, ink, primary, status } from '@agriflow/design-tokens'

// Named colour roles, light and dark. Same roles and values as the web app's
// apps/web/src/index.css (colors.test.ts fails if they drift apart), so a
// screen looks the same whichever app it's in. Screens use these roles, never
// raw hex values or the scales directly.
export const colors = {
  light: {
    canvas: cream, // page background: the site's cream
    surface: '#ffffff', // cards, panels, inputs
    text: ink[800],
    heading: ink[900],
    muted: ink[500], // secondary text; 4.5:1 on canvas and surface
    border: ink[200],
    action: brand[800], // filled buttons: forest, like the site
    actionPressed: brand[700],
    onAction: cream,
    accent: brand[700], // green text
    link: primary[700], // teal for links and focus
    focus: primary[500],
    good: status.goodText,
    warn: status.warnText,
    risk: status.riskText,
    info: status.infoText,
  },
  dark: {
    canvas: '#181a20',
    surface: '#1e2329',
    text: '#e8eaed',
    heading: '#f1f2f4',
    muted: '#a0a8b3',
    border: '#363c45',
    action: gold[400], // gold, as the site's buttons on dark sections
    actionPressed: gold[300],
    onAction: brand[950],
    accent: '#9cc4a6',
    link: '#7cc6d2',
    focus: '#7cc6d2',
    good: '#6fd4a2',
    warn: '#f0bd62',
    risk: '#f59a8f',
    info: '#8cc2f0',
  },
} as const

export type ColorScheme = keyof typeof colors
export type ColorRole = keyof typeof colors.light
export type Palette = Record<ColorRole, string>

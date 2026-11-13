import { brand } from '@agriflow/design-tokens'

// Chart color roles, following the platform's dataviz method: identity colors
// are used sparingly (one hue per series), status colors are reserved and
// never reused as series colors, and reference/target lines use neutral ink
// rather than a second hue.
export const chartColors = {
  actual: brand[700], // the single identity hue used for "actual/supply" series
  actualFill: `${brand[700]}1f`, // brand-700 at 12% opacity
  target: '#9aa59b', // ink-400 — neutral reference line (demand/target), not identity-coded
  grid: '#e1e0d9',
  axis: '#898781',
  textSecondary: '#52514e',
  good: '#0ca30c',
  warning: '#b8791f',
  critical: '#c14639',
  surface: '#ffffff',
} as const

export const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #eef0ee',
  boxShadow: '0 8px 24px -12px rgba(16,21,16,0.25)',
  fontSize: 12,
  padding: '8px 12px',
}

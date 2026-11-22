// Chart color roles, following the platform's dataviz method: identity colors
// are used sparingly (one hue per series), status colors are reserved and
// never reused as series colors, and reference/target lines use neutral ink
// rather than a second hue.
//
// Colours are CSS variables (index.css) so charts follow the light/dark theme.
export const chartColors = {
  actual: 'var(--color-chart-actual)', // the single identity hue used for "actual/supply" series
  target: 'var(--color-chart-target)', // neutral reference line (demand/target), not identity-coded
  grid: 'var(--color-chart-grid)',
  axis: 'var(--color-chart-axis)',
  textSecondary: 'var(--color-chart-text)',
  good: '#0ca30c',
  warning: '#b8791f',
  critical: '#c14639',
  surface: 'var(--color-surface)',
} as const

export const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid var(--color-ink-100)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-ink-800)',
  boxShadow: '0 8px 24px -12px rgba(16,21,16,0.25)',
  fontSize: 12,
  padding: '8px 12px',
}

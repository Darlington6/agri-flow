// Central brand config so the product name/claims can change without
// touching component code.
export const brand = {
  name: 'AgriFlow',
  tagline: 'Climate-Smart Demand-to-Farm Platform',
  statement: 'Turn agricultural demand into reliable, climate-smart supply.',
  substatement:
    'Know what the market needs. Grow with confidence. Deliver reliably.',
  environmentLabel: 'Demo / Pilot Simulation',
  country: 'Ghana',
} as const

export type Brand = typeof brand
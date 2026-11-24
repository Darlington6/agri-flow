// English: the source language. Every other dictionary translates these
// keys (never the keys themselves). Keep `{name}`-style placeholders as they are.
export const en = {
  'app.name': 'AgriFlow',
  'start.title': 'Grow, sell and deliver with confidence',
  'start.body': 'Farmers, cooperatives, buyers and drivers working from the same plan, online or off.',
  'start.comingSoon': 'Signing in to the app is coming soon.',
} as const

export type MessageKey = keyof typeof en
export type Dictionary = Record<MessageKey, string>

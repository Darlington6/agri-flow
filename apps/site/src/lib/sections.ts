// Home-page sections the main menu jumps to. The header links point at
// "<home>#<id>" in the current language, so they work from any page.
export const SECTIONS = {
  howItWorks: 'how-it-works',
  buyers: 'buyers',
  farmers: 'farmers',
  partners: 'partners',
  about: 'about',
  app: 'app',
} as const

export type SectionKey = keyof typeof SECTIONS

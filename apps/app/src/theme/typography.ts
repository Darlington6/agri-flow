// Per-weight imports, so only these five files go into the app.
import { Fraunces_500Medium } from '@expo-google-fonts/fraunces/500Medium'
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold'
import { IBMPlexSans_400Regular } from '@expo-google-fonts/ibm-plex-sans/400Regular'
import { IBMPlexSans_500Medium } from '@expo-google-fonts/ibm-plex-sans/500Medium'
import { IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans/600SemiBold'

// The site's type pairing: Fraunces for headings, IBM Plex Sans for
// everything else. The font files ship inside the app (no font server, so it
// works offline). On native each weight is its own family, so screens pick a
// family from `fonts` instead of setting fontWeight.
export const fontFiles = {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
}

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayMedium: 'Fraunces_500Medium',
  body: 'IBMPlexSans_400Regular',
  bodyMedium: 'IBMPlexSans_500Medium',
  bodySemiBold: 'IBMPlexSans_600SemiBold',
} as const

// Sizes follow the web app's scale (in px; React Native's unit). Line heights
// are set explicitly so text lines up the same on iOS, Android and the web.
export const type = {
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22 },
  button: { fontFamily: fonts.bodySemiBold, fontSize: 16, lineHeight: 22 },
} as const

export type TextVariant = keyof typeof type

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const

export const radius = { md: 12, lg: 20, pill: 999 } as const

/** Content never gets wider than this on tablets and desktop browsers. */
export const maxContentWidth = 480

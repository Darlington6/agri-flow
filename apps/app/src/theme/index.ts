import { useColorScheme } from 'react-native'

import { colors, type ColorScheme, type Palette } from './colors'

export { colors, type ColorRole, type ColorScheme, type Palette } from './colors'
export { fontFiles, fonts, maxContentWidth, radius, space, type, type TextVariant } from './typography'

/** The device's light or dark setting. A manual choice comes with the account settings. */
export function useScheme(): ColorScheme {
  return useColorScheme() === 'dark' ? 'dark' : 'light'
}

/** The colour roles for the current light or dark setting. */
export function usePalette(): Palette {
  return colors[useScheme()]
}

import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native'

import { type, usePalette, type ColorRole, type TextVariant } from '@/theme'

export type TextProps = NativeTextProps & {
  variant?: TextVariant
  /** A colour role from the theme. Headings default to `heading`, the rest to `text`. */
  color?: ColorRole
}

const HEADINGS: TextVariant[] = ['title', 'heading']

/** All text in the app. Picks the typeface, size and colour from the theme. */
export function Text({ variant = 'body', color, style, ...props }: TextProps) {
  const palette = usePalette()
  const isHeading = HEADINGS.includes(variant)
  return (
    <NativeText
      role={isHeading ? 'heading' : undefined}
      maxFontSizeMultiplier={2}
      {...props}
      style={[type[variant], { color: palette[color ?? (isHeading ? 'heading' : 'text')] }, style]}
    />
  )
}

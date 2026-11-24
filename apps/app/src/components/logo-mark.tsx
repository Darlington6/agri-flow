import { Image } from 'expo-image'

import { useScheme } from '@/theme'

// Source of truth: packages/design-tokens/assets/logos (never a copy).
const mark = require('@agriflow/design-tokens/assets/logos/agriflow-mark.svg')
const markReversed = require('@agriflow/design-tokens/assets/logos/agriflow-mark-reversed.svg')

type LogoMarkProps = {
  size?: number
  /** Pass a label when the mark stands alone, so screen readers announce it. */
  label?: string
}

/** The AgriFlow mark: forest ring in light mode, cream ring in dark mode. */
export function LogoMark({ size = 56, label }: LogoMarkProps) {
  const scheme = useScheme()
  return (
    <Image
      source={scheme === 'dark' ? markReversed : mark}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessible={!!label}
      accessibilityLabel={label}
      role={label ? 'img' : 'none'}
    />
  )
}

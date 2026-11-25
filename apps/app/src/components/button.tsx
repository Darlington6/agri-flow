import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native'

import { radius, space, usePalette } from '@/theme'

import { Text } from './text'

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string
  /** `primary`: filled, the one main action on a screen. `secondary`: outlined. */
  variant?: 'primary' | 'secondary'
  busy?: boolean
  /** Shown before the label, e.g. Google's logo. Decorative: the label says it all. */
  icon?: ReactNode
}

/** The site's pill button: forest with cream text, gold in dark mode. */
export function Button({ label, variant = 'primary', busy = false, icon, disabled, style, ...props }: ButtonProps) {
  const palette = usePalette()
  const filled = variant === 'primary'
  const inactive = disabled || busy
  return (
    <Pressable
      role="button"
      accessibilityState={{ disabled: !!inactive, busy }}
      disabled={inactive}
      hitSlop={4}
      {...props}
      style={(state) => [
        styles.base,
        filled
          ? { backgroundColor: state.pressed ? palette.actionPressed : palette.action }
          : { borderColor: palette.border, backgroundColor: state.pressed ? palette.canvas : palette.surface },
        inactive && styles.inactive,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={filled ? palette.onAction : palette.text} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text variant="button" color={filled ? 'onAction' : 'heading'} numberOfLines={2} style={styles.label}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48, // comfortable touch target on every platform
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  inactive: { opacity: 0.55 },
  label: { textAlign: 'center' },
})

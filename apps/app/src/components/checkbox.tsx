import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { radius, space, usePalette } from '@/theme'

/** A tick box with its label beside it; the whole row is the target. */
export function Checkbox({
  checked,
  onChange,
  label,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  /** What screen readers announce. */
  label: string
  /** What's shown beside the box. */
  children: ReactNode
}) {
  const palette = usePalette()
  return (
    <Pressable
      role="checkbox"
      aria-checked={checked}
      accessibilityLabel={label}
      onPress={() => onChange(!checked)}
      style={({ pressed }) => [
        styles.row,
        { borderColor: palette.border, backgroundColor: pressed ? palette.canvas : palette.surface },
      ]}
    >
      <View
        aria-hidden
        style={[
          styles.box,
          { borderColor: checked ? palette.action : palette.muted },
          checked && { backgroundColor: palette.action },
        ]}
      >
        {checked ? <View style={[styles.tick, { borderColor: palette.onAction }]} /> : null}
      </View>
      <View style={styles.label}>{children}</View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    padding: space.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  box: { width: 22, height: 22, borderWidth: 2, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  tick: {
    width: 6,
    height: 11,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
    marginTop: -2,
  },
  label: { flex: 1 },
})

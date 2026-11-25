import type { ReactNode } from 'react'
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { maxContentWidth, space, usePalette } from '@/theme'

import { LogoMark } from './logo-mark'

/**
 * A full screen on the canvas colour. Content scrolls when it doesn't fit
 * (small phones, large text) and stays a readable width on tablets and
 * desktop browsers. `backdrop` adds the AgriFlow mark, large and faint,
 * behind the content (welcome, sign-in and home screens; not busy ones).
 */
export function Screen({
  children,
  centered = false,
  backdrop = false,
}: {
  children: ReactNode
  centered?: boolean
  backdrop?: boolean
}) {
  const palette = usePalette()
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: palette.canvas }]}>
      {backdrop && <Backdrop />}
      <ScrollView
        contentContainerStyle={[styles.scroll, centered && styles.centered]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.column}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  )
}

/** The mark, cut off at the bottom corner, sized to the screen. Decorative. */
function Backdrop() {
  const { width, height } = useWindowDimensions()
  const size = Math.min(Math.max(width, height) * 0.75, 720)
  return (
    <View pointerEvents="none" aria-hidden style={StyleSheet.absoluteFill}>
      <View style={[styles.backdrop, { width: size, height: size, right: -size * 0.3, bottom: -size * 0.25 }]}>
        <LogoMark size={size} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1, padding: space.lg, alignItems: 'center' },
  centered: { justifyContent: 'center' },
  column: { width: '100%', maxWidth: maxContentWidth, gap: space.md },
  // Faint enough that grey text over it keeps 4.5:1 (4.65:1 at the darkest point).
  backdrop: { position: 'absolute', opacity: 0.05 },
})

import type { ReactNode } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { maxContentWidth, space, usePalette } from '@/theme'

/**
 * A full screen on the canvas colour. Content scrolls when it doesn't fit
 * (small phones, large text) and stays a readable width on tablets and
 * desktop browsers.
 */
export function Screen({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  const palette = usePalette()
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: palette.canvas }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, centered && styles.centered]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.column}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flexGrow: 1, padding: space.lg, alignItems: 'center' },
  centered: { justifyContent: 'center' },
  column: { width: '100%', maxWidth: maxContentWidth, gap: space.md },
})

import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { maxContentWidth, space, usePalette } from '@/theme'

import { LogoGlow } from './logo-glow'
import { LogoMark } from './logo-mark'

/**
 * A full screen on the canvas colour. Content scrolls when it doesn't fit
 * (small phones, large text) and stays a readable width on tablets and
 * desktop browsers. `backdrop` adds the AgriFlow mark, large and faint,
 * behind the content (welcome, sign-in and home screens; not busy ones).
 * `glow` adds the illuminated mark from the top corner, `breathing` or `still`.
 * `header` stays at the top (a Back link) while the content is centred.
 *
 * When the keyboard opens, the screen shrinks to the space above it, so the
 * field and its buttons move up with it (on Android too: apps draw behind the
 * system bars now, so the window no longer shrinks by itself).
 */
export function Screen({
  children,
  centered = false,
  backdrop = false,
  glow,
  header,
}: {
  children: ReactNode
  centered?: boolean
  backdrop?: boolean
  glow?: 'still' | 'breathing'
  header?: ReactNode
}) {
  const palette = usePalette()
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: palette.canvas }]}>
      {backdrop && <Backdrop />}
      {glow && <CornerGlow breathing={glow === 'breathing'} />}
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'web' ? undefined : 'padding'}>
        {header && (
          <View style={styles.header}>
            <View style={styles.column}>{header}</View>
          </View>
        )}
        <ScrollView
          contentContainerStyle={[styles.scroll, header ? styles.underHeader : null, centered && styles.centered]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.column}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

/** The glowing mark, its sun just inside the top corner. Decorative. */
function CornerGlow({ breathing }: { breathing: boolean }) {
  const { width, height } = useWindowDimensions()
  const size = Math.min(Math.max(width, height) * 0.8, 760)
  return (
    <View pointerEvents="none" aria-hidden style={StyleSheet.absoluteFill}>
      <View style={{ position: 'absolute', left: -size * 0.36, top: -size * 0.36 }}>
        <LogoGlow size={size} breathing={breathing} />
      </View>
    </View>
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
  header: { paddingHorizontal: space.lg, paddingTop: space.sm, alignItems: 'center' },
  underHeader: { paddingTop: space.sm },
  column: { width: '100%', maxWidth: maxContentWidth, gap: space.md },
  // Faint enough that grey text over it keeps 4.5:1 (4.65:1 at the darkest point).
  backdrop: { position: 'absolute', opacity: 0.05 },
})

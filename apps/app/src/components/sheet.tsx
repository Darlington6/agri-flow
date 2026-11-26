import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { maxContentWidth, radius, space, usePalette } from '@/theme'

import { Text } from './text'

const useNativeDriver = Platform.OS !== 'web'

// Dragged further than this, or flicked down, it closes; otherwise it settles back.
const CLOSE_DISTANCE = 100
const CLOSE_SPEED = 0.8

/**
 * A card that slides up from the bottom, the same on iOS, Android and the web.
 * It closes with its Close button, a tap on the dimmed screen behind it, the
 * Android back button, or a drag down on its top bar (the handle and title).
 */
export function Sheet({
  visible,
  title,
  closeLabel,
  onClose,
  children,
}: {
  visible: boolean
  title: string
  closeLabel: string
  onClose: () => void
  children: ReactNode
}) {
  const palette = usePalette()
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const [offset] = useState(() => new Animated.Value(height))
  // Stays shown while it slides away after `visible` turns false.
  const [shown, setShown] = useState(visible)
  if (visible && !shown) setShown(true)

  useEffect(() => {
    if (visible) {
      offset.setValue(height)
      Animated.timing(offset, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver,
      }).start()
    } else {
      Animated.timing(offset, {
        toValue: height,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver,
      }).start(() => setShown(false))
    }
  }, [visible, height, offset])

  const drag = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
        onPanResponderMove: (_, g) => offset.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_, g) => {
          if (g.dy > CLOSE_DISTANCE || g.vy > CLOSE_SPEED) onClose()
          else Animated.spring(offset, { toValue: 0, bounciness: 0, useNativeDriver }).start()
        },
        onPanResponderTerminate: () => {
          Animated.spring(offset, { toValue: 0, bounciness: 0, useNativeDriver }).start()
        },
      }),
    [offset, onClose],
  )

  const dim = offset.interpolate({ inputRange: [0, height], outputRange: [1, 0], extrapolate: 'clamp' })

  return (
    <Modal
      visible={visible || shown}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.fill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.dim, { opacity: dim }]}>
          <Pressable style={styles.fill} onPress={onClose} accessible={false} />
        </Animated.View>
        <Animated.View
          role="dialog"
          aria-modal
          aria-label={title}
          style={[
            styles.sheet,
            {
              backgroundColor: palette.canvas,
              marginTop: insets.top + space.lg,
              paddingBottom: insets.bottom,
              transform: [{ translateY: offset }],
            },
          ]}
        >
          <View {...drag.panHandlers} style={styles.top}>
            <View style={[styles.handle, { backgroundColor: palette.border }]} />
            <View style={styles.header}>
              <Text variant="heading" style={styles.title}>
                {title}
              </Text>
              <Pressable role="button" onPress={onClose} hitSlop={12}>
                <Text variant="label" color="link">
                  {closeLabel}
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.body}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  dim: { backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  sheet: {
    flex: 1,
    width: '100%',
    maxWidth: maxContentWidth + 2 * space.lg,
    alignSelf: 'center',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
  },
  // Tall enough to grab easily: the whole bar, not just the handle.
  top: { paddingTop: space.sm, paddingHorizontal: space.lg, paddingBottom: space.sm },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: space.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  title: { flex: 1 },
  body: { flex: 1, paddingHorizontal: space.lg, gap: space.md },
})

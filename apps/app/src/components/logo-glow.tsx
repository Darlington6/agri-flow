import { Image } from 'expo-image'
import { useEffect, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, Platform, View } from 'react-native'

import { useScheme, type ColorScheme } from '@/theme'

const glow = require('../../assets/glow.svg')

// The mark's own colours (packages/design-tokens/assets/logos): the ring is
// forest on light screens and cream on dark ones, as in the reversed logo.
export const RING = { light: '#283f2f', dark: '#f5f1e6' } as const
export const SUN = '#b2934d'
export const SAGE = '#93a281'
export const GLOW = '#d1bf98'

/**
 * How strongly each layer shows, per theme (logo-glow.test.ts checks text
 * over it). Outside the ring, where screens put their text, grey text keeps
 * 4.5:1. The ring and sun sit in the corner, under at most the Back link:
 * text and links keep 4.5:1 there, so a short line of grey text that lands
 * there on a small phone stays easy to read too. The glow fades from its
 * centre to nothing at its edge.
 */
export const LAYER_OPACITY: Record<ColorScheme, { glow: number; ring: number; sun: number; sage: number }> = {
  light: { glow: 0.4, ring: 0.02, sun: 0.035, sage: 0.03 },
  dark: { glow: 0.15, ring: 0.04, sun: 0.1, sage: 0.07 },
}

/** Left, top and diameter of each layer as fractions of the box, from the site's component. */
export const LAYOUT = {
  glow: [0.0278, 0.0111, 0.9444],
  ring: [0.2611, 0.2444, 0.4778],
  sun: [0.3389, 0.3389, 0.3222],
  sage: [0.3222, 0.6, 0.1667],
} as const

/**
 * The website's illuminated logo (apps/site LogoGlow.astro), drawn for the
 * app: a soft gold glow, the ring, the sun and the sage circle, in the same
 * proportions. The box is centred on the sun. `breathing` swells it gently
 * (the site's 9-second breath), unless the phone asks for less motion.
 * Decorative: screen readers skip it.
 */
export function LogoGlow({ size, breathing = false }: { size: number; breathing?: boolean }) {
  const scheme = useScheme()
  const opacity = LAYER_OPACITY[scheme]
  const scale = useBreath(breathing)

  const layer = ([left, top, diameter]: readonly [number, number, number]) => ({
    position: 'absolute' as const,
    left: size * left,
    top: size * top,
    width: size * diameter,
    height: size * diameter,
    borderRadius: (size * diameter) / 2,
  })

  return (
    <Animated.View pointerEvents="none" aria-hidden style={{ width: size, height: size, transform: [{ scale }] }}>
      <Image source={glow} style={[layer(LAYOUT.glow), { opacity: opacity.glow }]} accessible={false} />
      <View style={[layer(LAYOUT.ring), { backgroundColor: RING[scheme], opacity: opacity.ring }]} />
      <View style={[layer(LAYOUT.sun), { backgroundColor: SUN, opacity: opacity.sun }]} />
      <View style={[layer(LAYOUT.sage), { backgroundColor: SAGE, opacity: opacity.sage }]} />
    </Animated.View>
  )
}

const BREATH_MS = 4500

/** 1 → 1.03 → 1 every 9 seconds while `on`, and only when motion is welcome. */
function useBreath(on: boolean): Animated.Value {
  const [scale] = useState(() => new Animated.Value(1))
  useEffect(() => {
    if (!on) return
    let loop: Animated.CompositeAnimation | undefined
    let stopped = false
    const ease = Easing.inOut(Easing.sin)
    const useNativeDriver = Platform.OS !== 'web'
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (reduce || stopped) return
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(scale, { toValue: 1.03, duration: BREATH_MS, easing: ease, useNativeDriver }),
            Animated.timing(scale, { toValue: 1, duration: BREATH_MS, easing: ease, useNativeDriver }),
          ]),
        )
        loop.start()
      })
    return () => {
      stopped = true
      loop?.stop()
    }
  }, [on, scale])
  return scale
}

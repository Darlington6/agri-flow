import { Pressable, StyleSheet, View } from 'react-native'

import { space, usePalette } from '@/theme'

import { Text } from './text'

/**
 * A visible way back, top left, for people who don't know the iOS edge swipe
 * or Android's back gesture. The chevron is drawn, not a character, so it
 * looks the same in every font.
 */
export function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  const palette = usePalette()
  return (
    <Pressable role="button" accessibilityLabel={label} onPress={onPress} hitSlop={8} style={styles.link}>
      {({ pressed }) => (
        <>
          <View aria-hidden style={[styles.chevron, { borderColor: palette.link }]} />
          <Text variant="label" color="link" style={pressed && styles.pressed}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  link: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: space.sm, alignSelf: 'flex-start' },
  chevron: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
    marginLeft: 2,
  },
  pressed: { opacity: 0.6 },
})

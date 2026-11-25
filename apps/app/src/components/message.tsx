import { StyleSheet, View } from 'react-native'

import { radius, space, usePalette } from '@/theme'

import { Text } from './text'

/**
 * A short note in a tinted box. `risk` (something went wrong) is announced
 * to screen readers as soon as it appears; `info` isn't.
 */
export function Message({ tone = 'info', children }: { tone?: 'info' | 'risk' | 'good'; children: string }) {
  const palette = usePalette()
  return (
    <View style={[styles.box, { borderColor: palette[tone] }]} role={tone === 'risk' ? 'alert' : undefined}>
      <Text variant="small" color={tone}>
        {children}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderLeftWidth: 4, borderRadius: radius.md, padding: space.md },
})

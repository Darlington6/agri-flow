import { Pressable, StyleSheet, View } from 'react-native'

import { radius, space, usePalette } from '@/theme'

import { Text } from './text'
import { FieldError, FieldLabel } from './text-field'

export interface ChipOption {
  value: string
  label: string
}

/**
 * Choose any number of options (or one, with `single`). Each chip is a
 * toggle, announced as checked or not, big enough to tap, and the row wraps.
 */
export function ChipGroup({
  legend,
  options,
  value,
  onChange,
  error,
  optional,
  single = false,
}: {
  legend: string
  options: ChipOption[]
  value: string[]
  onChange: (value: string[]) => void
  error?: string | null
  optional?: boolean
  single?: boolean
}) {
  const palette = usePalette()
  function toggle(code: string) {
    if (single) return onChange([code])
    onChange(value.includes(code) ? value.filter((v) => v !== code) : [...value, code])
  }
  return (
    <View style={styles.group} role={single ? 'radiogroup' : 'group'} aria-label={legend}>
      <FieldLabel label={legend} optional={optional} />
      <View style={styles.chips}>
        {options.map((option) => {
          const on = value.includes(option.value)
          return (
            <Pressable
              key={option.value}
              role={single ? 'radio' : 'checkbox'}
              aria-checked={on}
              accessibilityLabel={option.label}
              onPress={() => toggle(option.value)}
              style={({ pressed }) => [
                styles.chip,
                {
                  borderColor: on ? palette.link : palette.border,
                  backgroundColor: on || pressed ? palette.canvas : palette.surface,
                  borderWidth: on ? 2 : 1,
                },
              ]}
            >
              {on ? <View aria-hidden style={[styles.tick, { borderColor: palette.link }]} /> : null}
              <Text variant="small" color={on ? 'link' : 'text'}>
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
      <FieldError error={error} />
    </View>
  )
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: 44,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  // A drawn tick, so it looks the same in every font.
  tick: {
    width: 6,
    height: 11,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
    marginTop: -3,
  },
})

import { useId } from 'react'
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native'

import { fonts, radius, space, usePalette } from '@/theme'

import { Text } from './text'

export type TextFieldProps = TextInputProps & {
  label: string
  /** Shown under the field and read out with it. */
  error?: string | null
}

/** A labelled text input. The label is tied to the input for screen readers. */
export function TextField({ label, error, style, ...props }: TextFieldProps) {
  const palette = usePalette()
  const id = useId()
  return (
    <View style={styles.field}>
      <Text variant="label" nativeID={`${id}-label`}>
        {label}
      </Text>
      <TextInput
        aria-labelledby={`${id}-label`}
        accessibilityLabel={label}
        aria-invalid={!!error}
        placeholderTextColor={palette.muted}
        maxFontSizeMultiplier={2}
        {...props}
        style={[
          styles.input,
          { color: palette.text, backgroundColor: palette.surface, borderColor: error ? palette.risk : palette.border },
          style,
        ]}
      />
      {error ? (
        <Text variant="small" color="risk" role="alert">
          {error}
        </Text>
      ) : null}
    </View>
  )
}

export const inputStyle = {
  minHeight: 48,
  borderWidth: 1,
  borderRadius: radius.md,
  paddingHorizontal: space.md,
  fontFamily: fonts.body,
  fontSize: 16,
} as const

const styles = StyleSheet.create({
  field: { gap: space.xs },
  input: inputStyle,
})

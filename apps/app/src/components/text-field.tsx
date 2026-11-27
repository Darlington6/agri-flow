import { useId } from 'react'
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native'

import { useI18n } from '@/i18n'
import { fonts, radius, space, usePalette } from '@/theme'

import { Text } from './text'

export type TextFieldProps = TextInputProps & {
  label: string
  /** Shown under the field and read out with it. */
  error?: string | null
  /** A line of help under the field, read out after the label. */
  hint?: string
  /** Marks the field "(optional)". */
  optional?: boolean
}

/** A labelled text input. The label is tied to the input for screen readers. */
export function TextField({ label, error, hint, optional, style, ...props }: TextFieldProps) {
  const palette = usePalette()
  const { t } = useI18n()
  const id = useId()
  return (
    <View style={styles.field}>
      <FieldLabel id={`${id}-label`} label={label} optional={optional} />
      <TextInput
        aria-labelledby={`${id}-label`}
        accessibilityLabel={optional ? `${label} ${t('common.optional')}` : label}
        accessibilityHint={hint}
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
      {hint ? (
        <Text variant="small" color="muted">
          {hint}
        </Text>
      ) : null}
      <FieldError error={error} />
    </View>
  )
}

/** A field's label, with "(optional)" in grey when it is. */
export function FieldLabel({ id, label, optional }: { id?: string; label: string; optional?: boolean }) {
  const { t } = useI18n()
  return (
    <Text variant="label" nativeID={id}>
      {label}
      {optional ? <Text color="muted">{` ${t('common.optional')}`}</Text> : null}
    </Text>
  )
}

/** A field's error, announced as it appears. */
export function FieldError({ error }: { error?: string | null }) {
  if (!error) return null
  return (
    <Text variant="small" color="risk" role="alert">
      {error}
    </Text>
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

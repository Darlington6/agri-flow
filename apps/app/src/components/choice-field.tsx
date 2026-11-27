import { useMemo, useState } from 'react'
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { useI18n } from '@/i18n'
import { radius, space, usePalette } from '@/theme'

import { Sheet } from './sheet'
import { Text } from './text'
import { FieldError, FieldLabel, inputStyle } from './text-field'

export interface Choice {
  value: string
  label: string
  /** Shown before the label, e.g. a flag. */
  leading?: string
}

// Lists longer than this get a search box.
const SEARCH_FROM = 12

/**
 * One choice from a list: the field shows the current one, and tapping it
 * opens the list in a sheet (searchable when it's long). The phone's own
 * picker differs on every platform; this looks and works the same everywhere.
 */
export function ChoiceField({
  label,
  choices,
  value,
  onChange,
  placeholder,
  hint,
  error,
  disabled = false,
  searchLabel,
}: {
  label: string
  choices: Choice[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  error?: string | null
  disabled?: boolean
  /** The search box's label, for long lists. */
  searchLabel?: string
}) {
  const palette = usePalette()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const current = choices.find((c) => c.value === value)
  const searchable = choices.length > SEARCH_FROM

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return choices
    return choices.filter((c) =>
      c.label
        .toLowerCase()
        .split(/[\s,.()'-]+/)
        .some((word) => word.startsWith(q)),
    )
  }, [choices, query])

  return (
    <View style={styles.field}>
      <FieldLabel label={label} />
      <Pressable
        role="button"
        accessibilityLabel={`${label}: ${current?.label ?? placeholder ?? t('common.choose')}`}
        accessibilityHint={hint}
        accessibilityState={{ disabled }}
        aria-invalid={!!error}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.box,
          {
            borderColor: error ? palette.risk : palette.border,
            backgroundColor: pressed ? palette.canvas : palette.surface,
            opacity: disabled ? 0.55 : 1,
          },
        ]}
      >
        <Text color={current ? 'text' : 'muted'} style={styles.value} numberOfLines={1}>
          {current
            ? `${current.leading ? `${current.leading}  ` : ''}${current.label}`
            : (placeholder ?? t('common.choose'))}
        </Text>
        <View aria-hidden style={[styles.chevron, { borderColor: palette.muted }]} />
      </Pressable>
      {hint ? (
        <Text variant="small" color="muted">
          {hint}
        </Text>
      ) : null}
      <FieldError error={error} />

      <Sheet
        visible={open}
        title={label}
        closeLabel={t('common.close')}
        onClose={() => {
          setOpen(false)
          setQuery('')
        }}
      >
        {searchable ? (
          <TextInput
            accessibilityLabel={searchLabel ?? t('countries.search')}
            placeholder={searchLabel ?? t('countries.search')}
            placeholderTextColor={palette.muted}
            autoCorrect={false}
            value={query}
            onChangeText={setQuery}
            style={[inputStyle, { color: palette.text, backgroundColor: palette.surface, borderColor: palette.border }]}
          />
        ) : null}
        <FlatList
          data={shown}
          keyExtractor={(c) => c.value}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          initialNumToRender={20}
          renderItem={({ item }) => (
            <Pressable
              role="button"
              aria-selected={item.value === value}
              accessibilityLabel={item.label}
              onPress={() => {
                onChange(item.value)
                setOpen(false)
                setQuery('')
              }}
              style={({ pressed }) => [
                styles.option,
                { borderBottomColor: palette.border },
                (pressed || item.value === value) && { backgroundColor: palette.surface },
              ]}
            >
              {item.leading ? (
                <Text aria-hidden style={styles.leading}>
                  {item.leading}
                </Text>
              ) : null}
              <Text style={styles.optionLabel}>{item.label}</Text>
              {item.value === value ? <View aria-hidden style={[styles.tick, { borderColor: palette.link }]} /> : null}
            </Pressable>
          )}
        />
      </Sheet>
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: space.xs },
  box: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  value: { flex: 1 },
  // A drawn down-chevron: this opens a list.
  chevron: {
    width: 9,
    height: 9,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
    marginTop: -4,
  },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
  leading: { fontSize: 20, lineHeight: 26 },
  optionLabel: { flex: 1 },
  tick: {
    width: 7,
    height: 13,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
    marginRight: space.sm,
    marginTop: -3,
  },
})

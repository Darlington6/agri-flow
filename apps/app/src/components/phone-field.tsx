import { useEffect, useId, useMemo, useState } from 'react'
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { useI18n } from '@/i18n'
import {
  countryName,
  countryOf,
  countryOptions,
  dialCode,
  examplePlaceholder,
  flag,
  guessCountry,
  phoneValue,
  searchCountries,
  type CountryCode,
} from '@/lib/phone'
import { radius, space, usePalette } from '@/theme'

import { Sheet } from './sheet'
import { Text } from './text'
import { inputStyle } from './text-field'

export interface PhoneFieldState {
  country: CountryCode
  setCountry: (country: CountryCode) => void
  /** What the person typed, as they typed it. */
  number: string
  setNumber: (number: string) => void
  /** The number to send: international (E.164) once it's valid. Empty until something is typed. */
  value: string
}

/**
 * State for a PhoneField, kept by the screen so going back a step shows what
 * was typed. Starts on the account's country, else the device's.
 * `initialNumber`: one saved before (international, so it keeps its own country).
 */
export function usePhoneField(accountCountry?: string, initialNumber = ''): PhoneFieldState {
  const [country, setCountry] = useState<CountryCode>(() => guessCountry(accountCountry))
  const [number, setNumber] = useState(initialNumber)
  return { country, setCountry, number, setNumber, value: number.trim() ? phoneValue(number, country) : '' }
}

/**
 * A phone number with its country: the flag and dialling code (tap to pick
 * from a searchable list), then the local number. Typing a number with +
 * moves the country along.
 */
export function PhoneField({
  field,
  label,
  error,
  onSubmitEditing,
}: {
  field: PhoneFieldState
  label: string
  error?: string | null
  onSubmitEditing?: () => void
}) {
  const palette = usePalette()
  const { t, language } = useI18n()
  const id = useId()
  const [picking, setPicking] = useState(false)
  const { country, setCountry, number, setNumber } = field
  const name = useMemo(() => countryName(country, language), [country, language])

  // The full list is only needed once the picker opens. Build it just after
  // the field appears, so the phone step opens at once and the picker too.
  useEffect(() => {
    const later = setTimeout(() => countryOptions(language), 300)
    return () => clearTimeout(later)
  }, [language])

  function handleNumber(next: string) {
    setNumber(next)
    const typed = countryOf(next)
    if (typed && typed !== country) setCountry(typed)
  }

  return (
    <View style={styles.field}>
      <Text variant="label" nativeID={`${id}-label`}>
        {label}
      </Text>
      <View style={styles.row}>
        <Pressable
          role="button"
          accessibilityLabel={t('signIn.phone.country', { country: `${name} (${dialCode(country)})` })}
          onPress={() => setPicking(true)}
          style={({ pressed }) => [
            styles.country,
            { borderColor: palette.border, backgroundColor: pressed ? palette.canvas : palette.surface },
          ]}
        >
          <Text aria-hidden style={styles.flag}>
            {flag(country)}
          </Text>
          <Text aria-hidden style={styles.dial}>
            {dialCode(country)}
          </Text>
        </Pressable>
        <TextInput
          aria-labelledby={`${id}-label`}
          accessibilityLabel={label}
          aria-invalid={!!error}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          returnKeyType="send"
          maxFontSizeMultiplier={2}
          placeholder={examplePlaceholder(country)}
          placeholderTextColor={palette.muted}
          value={number}
          onChangeText={handleNumber}
          onSubmitEditing={onSubmitEditing}
          style={[
            inputStyle,
            styles.number,
            {
              color: palette.text,
              backgroundColor: palette.surface,
              borderColor: error ? palette.risk : palette.border,
            },
          ]}
        />
      </View>
      {error ? (
        <Text variant="small" color="risk" role="alert">
          {error}
        </Text>
      ) : null}
      <CountryPicker
        visible={picking}
        language={language}
        selected={country}
        onClose={() => setPicking(false)}
        onPick={(code) => {
          setCountry(code)
          setPicking(false)
        }}
      />
    </View>
  )
}

function CountryPicker({
  visible,
  language,
  selected,
  onClose,
  onPick,
}: {
  visible: boolean
  language?: string
  selected: CountryCode
  onClose: () => void
  onPick: (code: CountryCode) => void
}) {
  const palette = usePalette()
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const options = useMemo(() => (visible ? countryOptions(language) : []), [visible, language])
  const shown = useMemo(() => searchCountries(options, query), [options, query])

  return (
    <Sheet visible={visible} title={t('countries.title')} closeLabel={t('countries.close')} onClose={onClose}>
      <TextInput
        accessibilityLabel={t('countries.search')}
        placeholder={t('countries.search')}
        placeholderTextColor={palette.muted}
        autoCorrect={false}
        value={query}
        onChangeText={setQuery}
        style={[inputStyle, { color: palette.text, backgroundColor: palette.surface, borderColor: palette.border }]}
      />
      <FlatList
        data={shown}
        keyExtractor={(o) => o.code}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        initialNumToRender={20}
        ListEmptyComponent={
          <Text color="muted" style={styles.empty}>
            {t('countries.none', { query })}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            role="button"
            aria-selected={item.code === selected}
            accessibilityLabel={`${item.name} (${item.dial})`}
            onPress={() => onPick(item.code)}
            style={({ pressed }) => [
              styles.option,
              { borderBottomColor: palette.border },
              (pressed || item.code === selected) && { backgroundColor: palette.surface },
            ]}
          >
            <Text aria-hidden style={styles.flag}>
              {flag(item.code)}
            </Text>
            <Text style={styles.optionName}>{item.name}</Text>
            <Text color="muted">{item.dial}</Text>
          </Pressable>
        )}
      />
    </Sheet>
  )
}

const styles = StyleSheet.create({
  field: { gap: space.xs },
  row: { flexDirection: 'row', gap: space.sm },
  country: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  flag: { fontSize: 20, lineHeight: 26 },
  dial: { fontVariant: ['tabular-nums'] },
  number: { flex: 1, minWidth: 0 },
  empty: { paddingVertical: space.lg, textAlign: 'center' },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
  optionName: { flex: 1 },
})

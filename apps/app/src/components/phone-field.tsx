import { useId, useMemo, useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useI18n } from '@/i18n'
import {
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
import { maxContentWidth, radius, space, usePalette } from '@/theme'

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
 */
export function usePhoneField(accountCountry?: string): PhoneFieldState {
  const [country, setCountry] = useState<CountryCode>(() => guessCountry(accountCountry))
  const [number, setNumber] = useState('')
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
  const options = useMemo(() => countryOptions(language), [language])
  const { country, setCountry, number, setNumber } = field
  const countryName = options.find((o) => o.code === country)?.name ?? country

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
          accessibilityLabel={t('signIn.phone.country', { country: `${countryName} (${dialCode(country)})` })}
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
        options={options}
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
  options,
  selected,
  onClose,
  onPick,
}: {
  visible: boolean
  options: ReturnType<typeof countryOptions>
  selected: CountryCode
  onClose: () => void
  onPick: (code: CountryCode) => void
}) {
  const palette = usePalette()
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const shown = useMemo(() => searchCountries(options, query), [options, query])

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.sheet, { backgroundColor: palette.canvas }]}>
        <View style={styles.sheetColumn}>
          <View style={styles.sheetHeader}>
            <Text variant="heading" style={styles.sheetTitle}>
              {t('countries.title')}
            </Text>
            <Pressable role="button" onPress={onClose} hitSlop={12}>
              <Text variant="label" color="link">
                {t('countries.close')}
              </Text>
            </Pressable>
          </View>
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
        </View>
      </SafeAreaView>
    </Modal>
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
  sheet: { flex: 1, alignItems: 'center' },
  sheetColumn: { flex: 1, width: '100%', maxWidth: maxContentWidth, padding: space.lg, gap: space.md },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  sheetTitle: { flex: 1 },
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

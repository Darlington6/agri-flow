import { useState, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { ApiError, OfflineError } from '@/auth'
import { Button } from '@/components/button'
import { ChipGroup } from '@/components/chip-group'
import { ChoiceField } from '@/components/choice-field'
import { Message } from '@/components/message'
import { TextField } from '@/components/text-field'
import { useI18n, type MessageKey, type Translate } from '@/i18n'
import type { RoleDetails, SelfServeRole, SetupOptions } from '@/onboarding'
import { space } from '@/theme'

type Draft = Record<string, unknown>

// The farmer's cooperative choices besides those on AgriFlow.
const NONE = 'none'
const NOT_LISTED = 'not-listed'
type FieldErrors = Record<string, string>

const EMPTY: { [R in SelfServeRole]: RoleDetails[R] } = {
  farmer: {
    region: '',
    district: '',
    crops: [],
    farm_size_hectares: null,
    cooperative_id: null,
    cooperative_name: '',
  },
  buyer: { business_name: '', business_type: '', region: '', district: '', crops: [] },
  delivery_partner: { business_name: '', vehicle_types: [], service_regions: [] },
  cooperative: { name: '', registration_number: '', region: '', district: '', member_count: null, crops: [] },
}

/** Lists that need at least one choice, and text that can't be empty: checked here first, to answer at once. */
const NEEDS_ONE: Partial<Record<SelfServeRole, { field: string; message: MessageKey }[]>> = {
  farmer: [{ field: 'crops', message: 'details.crops.needOne' }],
  cooperative: [{ field: 'crops', message: 'details.crops.needOne' }],
  delivery_partner: [
    { field: 'vehicle_types', message: 'details.vehicles.needOne' },
    { field: 'service_regions', message: 'details.serviceRegions.needOne' },
  ],
}

const REQUIRED: Record<SelfServeRole, string[]> = {
  farmer: ['region'],
  buyer: ['business_name', 'business_type', 'region'],
  delivery_partner: [],
  cooperative: ['name', 'region'],
}

function errorMessage(error: unknown, t: Translate): string {
  if (error instanceof OfflineError) return t('common.offline')
  if (error instanceof ApiError) return error.message
  return t('common.failed')
}

/**
 * The few details each role needs (the web app's RoleDetailsForm). `onSubmit`
 * saves; the API's messages about particular fields show beside them.
 */
export function RoleDetailsForm<R extends SelfServeRole>({
  role,
  options,
  submitLabel,
  onSubmit,
  secondary,
}: {
  role: R
  options: SetupOptions
  submitLabel: string
  onSubmit: (details: RoleDetails[R]) => Promise<void>
  /** E.g. a Back button, under the submit button. */
  secondary?: ReactNode
}) {
  const { t } = useI18n()
  const [details, setDetails] = useState<Draft>(() => ({ ...EMPTY[role] }))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // A farmer whose cooperative isn't on AgriFlow types its name.
  const [notListed, setNotListed] = useState(false)
  // Where a delivery partner works, typed where the country has no list.
  const [typedRegions, setTypedRegions] = useState('')

  const set = (changes: Draft) => setDetails((current) => ({ ...current, ...changes }))
  const d = details
  const text = (field: string) => String(d[field] ?? '')
  const list = (field: string) => (d[field] as string[]) ?? []

  async function submit() {
    setError(null)
    const payload: Draft = { ...details }
    if (role === 'delivery_partner' && !options.regions) {
      payload.service_regions = typedRegions
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean)
    }
    const missing: FieldErrors = {}
    for (const field of REQUIRED[role]) {
      if (!String(payload[field] ?? '').trim()) missing[field] = t('details.required')
    }
    if (options.regions && 'district' in payload && payload.region && !payload.district) {
      missing.district = t('details.required')
    }
    for (const { field, message } of NEEDS_ONE[role] ?? []) {
      if (!(payload[field] as unknown[]).length) missing[field] = t(message)
    }
    setErrors(missing)
    if (Object.keys(missing).length) return

    setBusy(true)
    try {
      await onSubmit(payload as unknown as RoleDetails[R])
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) {
        setErrors(Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [k, v.join(' ')])))
      } else {
        setError(errorMessage(err, t))
      }
    } finally {
      setBusy(false)
    }
  }

  const place = options.regions ? (
    <>
      <ChoiceField
        label={t('details.province')}
        choices={options.regions.map((r) => ({ value: r.name, label: r.name }))}
        value={text('region')}
        onChange={(region) => set({ region, district: '' })}
        error={errors.region}
      />
      <ChoiceField
        label={t('details.district')}
        choices={(options.regions.find((r) => r.name === d.region)?.districts ?? []).map((name) => ({
          value: name,
          label: name,
        }))}
        value={text('district')}
        onChange={(district) => set({ district })}
        disabled={!d.region}
        placeholder={d.region ? undefined : t('details.chooseProvinceFirst')}
        error={errors.district}
      />
    </>
  ) : (
    <>
      <TextField
        label={t('details.region')}
        value={text('region')}
        onChangeText={(region) => set({ region })}
        error={errors.region}
      />
      <TextField
        label={t('details.area')}
        optional
        value={text('district')}
        onChangeText={(district) => set({ district })}
        error={errors.district}
      />
    </>
  )

  return (
    <View style={styles.form}>
      {role === 'farmer' && (
        <>
          {place}
          <ChipGroup
            legend={t('details.crops.grow')}
            options={options.crops}
            value={list('crops')}
            onChange={(crops) => set({ crops })}
            error={errors.crops}
          />
          <TextField
            label={t('details.farmSize')}
            optional
            hint={t('details.farmSizeHint')}
            keyboardType="decimal-pad"
            value={text('farm_size_hectares')}
            onChangeText={(value) => set({ farm_size_hectares: value.replace(',', '.') || null })}
            error={errors.farm_size_hectares}
          />
          <ChoiceField
            label={t('details.cooperativeName')}
            choices={[
              { value: NONE, label: t('details.cooperative.none') },
              ...options.cooperatives.map((c) => {
                const name = [c.name, c.district || c.region].filter(Boolean).join(', ')
                return {
                  value: String(c.id),
                  label: c.verified ? name : t('details.cooperative.unverified', { name }),
                }
              }),
              { value: NOT_LISTED, label: t('details.cooperative.notListed') },
            ]}
            value={d.cooperative_id != null ? String(d.cooperative_id) : notListed ? NOT_LISTED : NONE}
            onChange={(picked) => {
              setNotListed(picked === NOT_LISTED)
              if (picked === NONE) set({ cooperative_id: null, cooperative_name: '' })
              else if (picked === NOT_LISTED) set({ cooperative_id: null })
              else set({ cooperative_id: Number(picked), cooperative_name: '' })
            }}
            hint={d.cooperative_id != null ? t('details.cooperative.confirm') : undefined}
            error={errors.cooperative_id}
          />
          {notListed && (
            <TextField
              label={t('details.cooperative.typed')}
              maxLength={150}
              autoCapitalize="words"
              value={text('cooperative_name')}
              onChangeText={(cooperative_name) => set({ cooperative_name })}
              error={errors.cooperative_name}
            />
          )}
        </>
      )}

      {role === 'buyer' && (
        <>
          <TextField
            label={t('details.businessName')}
            autoComplete="organization"
            value={text('business_name')}
            onChangeText={(business_name) => set({ business_name })}
            error={errors.business_name}
          />
          <ChoiceField
            label={t('details.businessType')}
            choices={options.buyer_types}
            value={text('business_type')}
            onChange={(business_type) => set({ business_type })}
            error={errors.business_type}
          />
          {place}
          <ChipGroup
            legend={t('details.crops.buy')}
            optional
            options={options.crops}
            value={list('crops')}
            onChange={(crops) => set({ crops })}
            error={errors.crops}
          />
        </>
      )}

      {role === 'cooperative' && (
        <>
          <TextField
            label={t('details.coopName')}
            autoComplete="organization"
            value={text('name')}
            onChangeText={(name) => set({ name })}
            error={errors.name}
          />
          <TextField
            label={t('details.registration')}
            optional
            autoCapitalize="characters"
            value={text('registration_number')}
            onChangeText={(registration_number) => set({ registration_number })}
            error={errors.registration_number}
          />
          {place}
          <TextField
            label={t('details.members')}
            optional
            keyboardType="number-pad"
            value={d.member_count == null ? '' : String(d.member_count)}
            onChangeText={(value) => {
              const digits = value.replace(/\D/g, '')
              set({ member_count: digits ? Number(digits) : null })
            }}
            error={errors.member_count}
          />
          <ChipGroup
            legend={t('details.crops.members')}
            options={options.crops}
            value={list('crops')}
            onChange={(crops) => set({ crops })}
            error={errors.crops}
          />
        </>
      )}

      {role === 'delivery_partner' && (
        <>
          <TextField
            label={t('details.businessName')}
            optional
            hint={t('details.ownBusinessHint')}
            autoComplete="organization"
            value={text('business_name')}
            onChangeText={(business_name) => set({ business_name })}
            error={errors.business_name}
          />
          <ChipGroup
            legend={t('details.vehicles')}
            options={options.vehicle_types}
            value={list('vehicle_types')}
            onChange={(vehicle_types) => set({ vehicle_types })}
            error={errors.vehicle_types}
          />
          {options.regions ? (
            <ChipGroup
              legend={t('details.serviceRegions')}
              options={options.regions.map((r) => ({ value: r.name, label: r.name }))}
              value={list('service_regions')}
              onChange={(service_regions) => set({ service_regions })}
              error={errors.service_regions}
            />
          ) : (
            <TextField
              label={t('details.serviceRegions')}
              hint={t('details.serviceRegionsHint')}
              value={typedRegions}
              onChangeText={setTypedRegions}
              error={errors.service_regions}
            />
          )}
        </>
      )}

      {error ? <Message tone="risk">{error}</Message> : null}
      <Button label={busy ? t('common.saving') : submitLabel} busy={busy} onPress={submit} />
      {secondary}
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: space.md },
})

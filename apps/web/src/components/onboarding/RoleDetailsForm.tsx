import { useState, type FormEvent, type ReactNode } from 'react'
import { Button, inputClass } from '@/components/ui'
import {
  ApiError,
  type CooperativeOption,
  type RoleDetails,
  type SelfServeRole,
  type SetupOptions,
} from '@/lib/apiClient'
import { ChipGroup, ErrorText, LabelledField, PlaceFields, type FieldErrors } from './fields'

type Draft = Record<string, unknown>

const EMPTY: { [R in SelfServeRole]: RoleDetails[R] } = {
  farmer: { region: '', district: '', crops: [], farm_size_hectares: null, cooperative_id: null, cooperative_name: '' },
  buyer: { business_name: '', business_type: '', region: '', district: '', crops: [] },
  delivery_partner: { business_name: '', vehicle_types: [], service_regions: [] },
  cooperative: { name: '', registration_number: '', region: '', district: '', member_count: null, crops: [] },
}

/** Lists the API needs at least one of (checked here first, to answer straight away). */
const NEEDS_ONE: Partial<Record<SelfServeRole, { field: string; message: string }[]>> = {
  farmer: [{ field: 'crops', message: 'Choose at least one crop.' }],
  cooperative: [{ field: 'crops', message: 'Choose at least one crop.' }],
  delivery_partner: [
    { field: 'vehicle_types', message: 'Choose at least one vehicle.' },
    { field: 'service_regions', message: 'Choose at least one region.' },
  ],
}

/**
 * The few details each role needs, used while setting up an account and to
 * edit them later. `onSubmit` saves; an ApiError's field messages show next
 * to the fields they're about.
 */
export function RoleDetailsForm<R extends SelfServeRole>({
  role,
  options,
  initial,
  submitLabel,
  busyLabel = 'Saving…',
  onSubmit,
  secondary,
}: {
  role: R
  options: SetupOptions
  initial?: Partial<RoleDetails[R]>
  submitLabel: string
  busyLabel?: string
  onSubmit: (details: RoleDetails[R]) => Promise<void>
  /** E.g. a Back or Cancel button, shown beside the submit button. */
  secondary?: ReactNode
}) {
  // The draft, as a plain record of this role's fields only (an existing
  // profile also carries its status and dates, which aren't sent back).
  const [details, setDetails] = useState<Draft>(() => {
    const start: Draft = { ...EMPTY[role] }
    for (const key of Object.keys(start)) {
      const value = (initial as Draft | undefined)?.[key]
      if (value !== undefined) start[key] = value
    }
    // An existing farmer's cooperative on AgriFlow comes back as an object.
    const joined = (initial as { cooperative?: { id: number } | null } | undefined)?.cooperative
    if (role === 'farmer' && joined) start.cooperative_id = joined.id
    return start
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // Typed list of regions for a delivery partner where there's no list to pick from.
  const [typedRegions, setTypedRegions] = useState(
    ((initial as Partial<RoleDetails['delivery_partner']>)?.service_regions ?? []).join(', '),
  )

  const set = (changes: Draft) => setDetails((current) => ({ ...current, ...changes }))
  const d = details

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const payload: Draft = { ...details }
    if (role === 'delivery_partner' && !options.regions) {
      payload.service_regions = typedRegions
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean)
    }
    const missing: FieldErrors = {}
    for (const { field, message } of NEEDS_ONE[role] ?? []) {
      if (!(payload[field] as unknown[]).length) missing[field] = [message]
    }
    setErrors(missing)
    if (Object.keys(missing).length) return

    setBusy(true)
    try {
      await onSubmit(payload as unknown as RoleDetails[R])
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(err.fields)
      else setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const place = (
    <PlaceFields
      regions={options.regions}
      value={{ region: String(d.region ?? ''), district: String(d.district ?? '') }}
      onChange={(p) => set({ ...p })}
      errors={errors}
    />
  )

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      {role === 'farmer' && (
        <>
          {place}
          <ChipGroup
            legend="What do you grow?"
            options={options.crops}
            value={d.crops as string[]}
            onChange={(crops) => set({ crops })}
            error={errors.crops}
          />
          <LabelledField
            label="Farm size in hectares"
            optional
            hint="Your best guess is fine. 1 hectare is 100 m × 100 m."
            error={errors.farm_size_hectares}
          >
            {(props) => (
              <input
                {...props}
                className={inputClass}
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={(d.farm_size_hectares as string | null) ?? ''}
                onChange={(e) => set({ farm_size_hectares: e.target.value || null })}
              />
            )}
          </LabelledField>
          <CooperativeField
            cooperatives={options.cooperatives}
            cooperativeId={d.cooperative_id as number | null}
            typedName={d.cooperative_name as string}
            onChange={(cooperative_id, cooperative_name) => set({ cooperative_id, cooperative_name })}
            errors={errors}
          />
        </>
      )}

      {role === 'buyer' && (
        <>
          <LabelledField label="Business name" error={errors.business_name}>
            {(props) => (
              <input
                {...props}
                className={inputClass}
                required
                autoComplete="organization"
                value={d.business_name as string}
                onChange={(e) => set({ business_name: e.target.value })}
              />
            )}
          </LabelledField>
          <LabelledField label="Type of business" error={errors.business_type}>
            {(props) => (
              <select
                {...props}
                className={inputClass}
                required
                value={d.business_type as string}
                onChange={(e) => set({ business_type: e.target.value })}
              >
                <option value="" disabled>
                  Choose…
                </option>
                {options.buyer_types.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}
          </LabelledField>
          {place}
          <ChipGroup
            legend="What do you buy?"
            optional
            options={options.crops}
            value={d.crops as string[]}
            onChange={(crops) => set({ crops })}
            error={errors.crops}
          />
        </>
      )}

      {role === 'cooperative' && (
        <>
          <LabelledField label="Cooperative name" error={errors.name}>
            {(props) => (
              <input
                {...props}
                className={inputClass}
                required
                autoComplete="organization"
                value={d.name as string}
                onChange={(e) => set({ name: e.target.value })}
              />
            )}
          </LabelledField>
          <LabelledField label="Registration number" optional error={errors.registration_number}>
            {(props) => (
              <input
                {...props}
                className={inputClass}
                value={d.registration_number as string}
                onChange={(e) => set({ registration_number: e.target.value })}
              />
            )}
          </LabelledField>
          {place}
          <LabelledField label="Number of members" optional error={errors.member_count}>
            {(props) => (
              <input
                {...props}
                className={inputClass}
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={(d.member_count as number | null) ?? ''}
                onChange={(e) => set({ member_count: e.target.value ? Number(e.target.value) : null })}
              />
            )}
          </LabelledField>
          <ChipGroup
            legend="What do your members grow?"
            options={options.crops}
            value={d.crops as string[]}
            onChange={(crops) => set({ crops })}
            error={errors.crops}
          />
        </>
      )}

      {role === 'delivery_partner' && (
        <>
          <LabelledField
            label="Business name"
            optional
            hint="Leave it empty if you work on your own."
            error={errors.business_name}
          >
            {(props) => (
              <input
                {...props}
                className={inputClass}
                autoComplete="organization"
                value={d.business_name as string}
                onChange={(e) => set({ business_name: e.target.value })}
              />
            )}
          </LabelledField>
          <ChipGroup
            legend="Your vehicles"
            options={options.vehicle_types}
            value={d.vehicle_types as string[]}
            onChange={(vehicle_types) => set({ vehicle_types })}
            error={errors.vehicle_types}
          />
          {options.regions ? (
            <ChipGroup
              legend="Where you deliver"
              options={options.regions.map((r) => ({ value: r.name, label: r.name }))}
              value={d.service_regions as string[]}
              onChange={(service_regions) => set({ service_regions })}
              error={errors.service_regions}
            />
          ) : (
            <LabelledField
              label="Where you deliver"
              hint="Regions, separated by commas."
              error={errors.service_regions}
            >
              {(props) => (
                <input
                  {...props}
                  className={inputClass}
                  required
                  value={typedRegions}
                  onChange={(e) => setTypedRegions(e.target.value)}
                />
              )}
            </LabelledField>
          )}
        </>
      )}

      <ErrorText messages={error ? [error] : undefined} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {secondary}
        <Button type="submit" disabled={busy}>
          {busy ? busyLabel : submitLabel}
        </Button>
      </div>
    </form>
  )
}

const NOT_LISTED = 'not-listed'

/**
 * The farmer's cooperative: one on AgriFlow (they're a member once it
 * confirms them), one not on AgriFlow yet (typed), or none.
 */
function CooperativeField({
  cooperatives,
  cooperativeId,
  typedName,
  onChange,
  errors,
}: {
  cooperatives: CooperativeOption[]
  cooperativeId: number | null
  typedName: string
  onChange: (cooperativeId: number | null, typedName: string) => void
  errors: FieldErrors
}) {
  // Typing a name is chosen explicitly, or comes back from a saved profile.
  const [notListed, setNotListed] = useState(cooperativeId === null && typedName !== '')
  const value = cooperativeId !== null ? String(cooperativeId) : notListed ? NOT_LISTED : ''
  return (
    <>
      <LabelledField
        label="Your cooperative"
        optional
        hint={cooperativeId !== null ? 'They’ll confirm you’re a member.' : undefined}
        error={errors.cooperative_id}
      >
        {(props) => (
          <select
            {...props}
            className={inputClass}
            value={value}
            onChange={(e) => {
              const picked = e.target.value
              setNotListed(picked === NOT_LISTED)
              if (picked === '' || picked === NOT_LISTED) onChange(null, picked === NOT_LISTED ? typedName : '')
              else onChange(Number(picked), '')
            }}
          >
            <option value="">I’m not in a cooperative</option>
            {cooperatives.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.district || c.region ? `, ${c.district || c.region}` : ''}
                {c.verified ? '' : ' (not verified yet)'}
              </option>
            ))}
            <option value={NOT_LISTED}>Mine isn’t on AgriFlow yet</option>
          </select>
        )}
      </LabelledField>
      {notListed && (
        <LabelledField label="Cooperative name" error={errors.cooperative_name}>
          {(props) => (
            <input
              {...props}
              className={inputClass}
              required
              maxLength={150}
              value={typedName}
              onChange={(e) => onChange(null, e.target.value)}
            />
          )}
        </LabelledField>
      )}
    </>
  )
}

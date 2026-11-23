import { useId, type ReactNode } from 'react'
import clsx from 'clsx'
import { Check } from 'lucide-react'
import { inputClass } from '@/components/ui'
import type { Option, SetupOptions } from '@/lib/apiClient'

/** Field errors from the API, keyed by field name. */
export type FieldErrors = Record<string, string[]>

export function ErrorText({ id, messages }: { id?: string; messages?: string[] }) {
  if (!messages?.length) return null
  return (
    <p id={id} className="text-xs text-status-risk">
      {messages.join(' ')}
    </p>
  )
}

/** A labelled input, select or textarea with its hint and error underneath. */
export function LabelledField({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string
  hint?: string
  error?: string[]
  optional?: boolean
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error?.length && errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-ink-600">
        {label}
        {optional && <span className="font-normal text-ink-500"> (optional)</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error?.length ? true : undefined })}
      {hint && (
        <p id={hintId} className="text-xs text-ink-500">
          {hint}
        </p>
      )}
      <ErrorText id={errorId} messages={error} />
    </div>
  )
}

/**
 * Choose any number of options. Each is a toggle button (announced as
 * pressed or not), big enough to tap, and the group wraps on small screens.
 */
export function ChipGroup({
  legend,
  options,
  value,
  onChange,
  error,
  optional,
}: {
  legend: string
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  error?: string[]
  optional?: boolean
}) {
  const errorId = useId()
  function toggle(code: string) {
    onChange(value.includes(code) ? value.filter((v) => v !== code) : [...value, code])
  }
  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={error?.length ? errorId : undefined}>
      <legend className="mb-2 text-xs font-medium text-ink-600">
        {legend}
        {optional && <span className="font-normal text-ink-500"> (optional)</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const on = value.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(option.value)}
              className={clsx(
                'inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors',
                'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none',
                on
                  ? 'border-primary-500 bg-primary-50 text-primary-800'
                  : 'border-ink-200 bg-surface text-ink-700 hover:border-ink-300',
              )}
            >
              {on && <Check className="h-3.5 w-3.5" aria-hidden />}
              {option.label}
            </button>
          )
        })}
      </div>
      <ErrorText id={errorId} messages={error} />
    </fieldset>
  )
}

export interface Place {
  region: string
  district: string
}

/**
 * Region and district: lists to choose from where the country has them
 * (Rwanda's provinces and districts), typed elsewhere.
 */
export function PlaceFields({
  regions,
  value,
  onChange,
  errors = {},
}: {
  regions: SetupOptions['regions']
  value: Place
  onChange: (place: Place) => void
  errors?: FieldErrors
}) {
  if (!regions) {
    return (
      <>
        <LabelledField label="Region, state or province" error={errors.region}>
          {(props) => (
            <input
              {...props}
              className={inputClass}
              required
              autoComplete="address-level1"
              value={value.region}
              onChange={(e) => onChange({ ...value, region: e.target.value })}
            />
          )}
        </LabelledField>
        <LabelledField label="District or area" optional error={errors.district}>
          {(props) => (
            <input
              {...props}
              className={inputClass}
              autoComplete="address-level2"
              value={value.district}
              onChange={(e) => onChange({ ...value, district: e.target.value })}
            />
          )}
        </LabelledField>
      </>
    )
  }

  const districts = regions.find((r) => r.name === value.region)?.districts ?? []
  return (
    <>
      <LabelledField label="Province" error={errors.region}>
        {(props) => (
          <select
            {...props}
            className={inputClass}
            required
            value={value.region}
            onChange={(e) => onChange({ region: e.target.value, district: '' })}
          >
            <option value="" disabled>
              Choose…
            </option>
            {regions.map((r) => (
              <option key={r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        )}
      </LabelledField>
      <LabelledField label="District" error={errors.district}>
        {(props) => (
          <select
            {...props}
            className={inputClass}
            required
            disabled={!value.region}
            value={value.district}
            onChange={(e) => onChange({ ...value, district: e.target.value })}
          >
            <option value="" disabled>
              {value.region ? 'Choose…' : 'Choose a province first'}
            </option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
      </LabelledField>
    </>
  )
}

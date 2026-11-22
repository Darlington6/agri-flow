import { useId, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { countryOf, countryOptions, dialCode, examplePlaceholder, flag, type CountryCode } from '@/lib/phone'
import type { PhoneField } from './usePhoneField'

/**
 * A phone number with its country: the flag and dialling code on the left (a
 * native picker, so phones show their own list), the local number on the
 * right. Used wherever a number is typed (sign-in, adding a number), so the
 * rules are the same everywhere. Typing a number with + moves the country.
 */
export function PhoneInput({
  field,
  label = 'Phone number',
  autoFocus,
}: {
  field: PhoneField
  label?: string
  autoFocus?: boolean
}) {
  const id = useId()
  const options = useMemo(() => countryOptions(navigator.language), [])
  const { country, setCountry, number, setNumber } = field

  function handleNumber(next: string) {
    setNumber(next)
    const typed = countryOf(next)
    if (typed && typed !== country) setCountry(typed)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-ink-600">
        {label}
      </label>
      <div className="flex rounded-xl border border-ink-200 bg-surface transition-colors focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100">
        <div className="relative flex shrink-0 items-center gap-1.5 border-r border-ink-200 pr-2 pl-3 text-sm text-ink-800 focus-within:text-ink-900">
          <span aria-hidden className="text-base leading-none">
            {flag(country)}
          </span>
          <span aria-hidden className="tabular-nums">
            {dialCode(country)}
          </span>
          <ChevronDown aria-hidden className="h-3.5 w-3.5 text-ink-500" />
          {/* The real control sits on top, invisible: tapping anywhere here opens it. */}
          <select
            aria-label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value as CountryCode)}
            className="absolute inset-0 cursor-pointer appearance-none opacity-0"
          >
            {options.map((o) => (
              <option key={o.code} value={o.code}>
                {o.name} ({o.dial})
              </option>
            ))}
          </select>
        </div>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          autoFocus={autoFocus}
          placeholder={examplePlaceholder(country)}
          value={number}
          onChange={(e) => handleNumber(e.target.value)}
          className="min-w-0 flex-1 rounded-r-xl bg-transparent px-3 py-2 text-sm text-ink-800 outline-none placeholder:text-ink-500"
        />
      </div>
    </div>
  )
}

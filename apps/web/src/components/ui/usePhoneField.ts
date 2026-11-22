import { useState } from 'react'
import { guessCountry, phoneValue, type CountryCode } from '@/lib/phone'

export interface PhoneField {
  country: CountryCode
  setCountry: (country: CountryCode) => void
  /** What the person typed, as they typed it. */
  number: string
  setNumber: (number: string) => void
  /** The number to send: international (E.164) once it's valid. Empty until something is typed. */
  value: string
}

/**
 * State for a PhoneInput. Kept by the page, not the input, so going back a
 * step ("Use a different number") shows what was typed. `accountCountry` is
 * the account's country once accounts have one; until then the device decides.
 */
export function usePhoneField(accountCountry?: string): PhoneField {
  const [country, setCountry] = useState<CountryCode>(() => guessCountry(accountCountry))
  const [number, setNumber] = useState('')
  return { country, setCountry, number, setNumber, value: number.trim() ? phoneValue(number, country) : '' }
}

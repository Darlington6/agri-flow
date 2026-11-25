// What the API sends about an account (apps/api/apps/identity). The same
// shape as the web app's AuthUser (apps/web/src/lib/apiClient.ts).

export type Language = 'en' | 'fr' | 'rw' | 'sw' | 'tw'

export interface Role {
  slug: string
  name: string
}

/** An account has a phone number, an email, or both (never neither). */
export interface AuthUser {
  id: number
  phone_number: string | null
  email: string | null
  display_name: string
  /** ISO country code (e.g. "RW"); empty until chosen while setting up. */
  country: string
  language: Language | ''
  roles: Role[]
  /** True until the account is set up, and again when the terms change. */
  needs_onboarding: boolean
  onboarded_at: string | null
  date_joined: string
}

export interface SignedIn {
  access: string
  refresh: string
  user: AuthUser
  /** True when this sign-in also created the account. */
  created: boolean
}

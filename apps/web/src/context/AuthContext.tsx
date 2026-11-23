import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  clearTokens,
  confirmEmail,
  confirmPhoneAdd,
  getMe,
  getStoredTokens,
  requestMagicLink,
  logout as logoutFromApi,
  requestEmailAdd,
  requestOtp,
  requestPhoneAdd,
  signInWithGoogle,
  storeTokens,
  updateMe,
  verifyMagicLink,
  verifyOtp,
  type AccountChanges,
  type AuthUser,
} from '@/lib/apiClient'
import { identify } from '@/lib/monitoring'

// Real backend auth — deliberately separate from SessionContext (the
// six-role demo picker driving the rest of the app today). A real login
// currently produces a user with roles: [] since Network doesn't exist
// yet; merging this into SessionContext/scope.ts only makes sense once
// there's a real role/actor profile to represent. See the plan this
// shipped under for the full reasoning.

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  requestOtp: (phoneNumber: string) => Promise<{ debugCode?: string }>
  /** Signs in; answers with the user, to decide where they go next. */
  verifyOtp: (phoneNumber: string, code: string) => Promise<AuthUser>
  requestMagicLink: (email: string) => Promise<{ debugLink?: string }>
  verifyMagicLink: (token: string) => Promise<AuthUser>
  /** Continue with Google, with the credential from Google's button. */
  signInWithGoogle: (credential: string) => Promise<AuthUser>
  /** Name, country or language. */
  updateAccount: (changes: AccountChanges) => Promise<void>
  /** Shows a user the API just answered with (e.g. after finishing setup). */
  replaceUser: (user: AuthUser) => void
  /** Fetches the user again, e.g. after choosing a role. */
  refreshUser: () => Promise<void>
  /** Sends a confirmation link; the email is only added once it's used. */
  requestEmailAdd: (email: string) => Promise<{ debugLink?: string }>
  /** Uses that link (works signed in or not, on any device). */
  confirmEmail: (token: string) => Promise<string>
  /** Texts a code; the number is only added once it's confirmed. */
  requestPhoneAdd: (phoneNumber: string) => Promise<{ debugCode?: string }>
  confirmPhoneAdd: (phoneNumber: string, code: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Local development only: the API returns the code or link (it does so only
// in DEBUG, never in staging or production), so it's also printed in the
// browser console. The API's own terminal prints them too.
function logForDev(what: string, value: string | undefined) {
  if (value) console.info(`[AgriFlow dev] ${what}: ${value}`)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Error reports say who was signed in (id and roles only).
  useEffect(() => identify(user), [user])

  useEffect(() => {
    if (!getStoredTokens()) {
      setLoading(false)
      return
    }
    getMe()
      .then(setUser)
      .catch(() => clearTokens())
      .finally(() => setLoading(false))
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    async requestOtp(phoneNumber) {
      const { debug_code } = await requestOtp(phoneNumber)
      logForDev(`Code for ${phoneNumber}`, debug_code)
      return { debugCode: debug_code }
    },
    async verifyOtp(phoneNumber, code) {
      const tokens = await verifyOtp(phoneNumber, code)
      storeTokens(tokens.access, tokens.refresh)
      setUser(tokens.user)
      return tokens.user
    },
    async requestMagicLink(email) {
      const { debug_link } = await requestMagicLink(email)
      logForDev(`Sign-in link for ${email}`, debug_link)
      return { debugLink: debug_link }
    },
    async verifyMagicLink(token) {
      const tokens = await verifyMagicLink(token)
      storeTokens(tokens.access, tokens.refresh)
      setUser(tokens.user)
      return tokens.user
    },
    async signInWithGoogle(credential) {
      const tokens = await signInWithGoogle(credential)
      storeTokens(tokens.access, tokens.refresh)
      setUser(tokens.user)
      return tokens.user
    },
    async updateAccount(changes) {
      setUser(await updateMe(changes))
    },
    replaceUser: setUser,
    async refreshUser() {
      setUser(await getMe())
    },
    async requestEmailAdd(email) {
      const { debug_link } = await requestEmailAdd(email)
      logForDev(`Confirmation link for ${email}`, debug_link)
      return { debugLink: debug_link }
    },
    async confirmEmail(token) {
      const { email } = await confirmEmail(token)
      // Signed in here too: show the new email straight away.
      if (getStoredTokens()) setUser(await getMe())
      return email
    },
    async requestPhoneAdd(phoneNumber) {
      const { debug_code } = await requestPhoneAdd(phoneNumber)
      logForDev(`Code for ${phoneNumber}`, debug_code)
      return { debugCode: debug_code }
    },
    async confirmPhoneAdd(phoneNumber, code) {
      setUser(await confirmPhoneAdd(phoneNumber, code))
    },
    async logout() {
      setUser(null)
      await logoutFromApi()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

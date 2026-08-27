import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  clearTokens,
  getMe,
  getStoredTokens,
  requestMagicLink,
  requestOtp,
  storeTokens,
  updateMe,
  verifyMagicLink,
  verifyOtp,
  type AuthUser,
} from '@/lib/apiClient'

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
  verifyOtp: (phoneNumber: string, code: string) => Promise<void>
  requestMagicLink: (email: string) => Promise<{ debugLink?: string }>
  verifyMagicLink: (token: string) => Promise<void>
  updateDisplayName: (displayName: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

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
      return { debugCode: debug_code }
    },
    async verifyOtp(phoneNumber, code) {
      const tokens = await verifyOtp(phoneNumber, code)
      storeTokens(tokens.access, tokens.refresh)
      setUser(tokens.user)
    },
    async requestMagicLink(email) {
      const { debug_link } = await requestMagicLink(email)
      return { debugLink: debug_link }
    },
    async verifyMagicLink(token) {
      const tokens = await verifyMagicLink(token)
      storeTokens(tokens.access, tokens.refresh)
      setUser(tokens.user)
    },
    async updateDisplayName(displayName) {
      const updated = await updateMe(displayName)
      setUser(updated)
    },
    logout() {
      clearTokens()
      setUser(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

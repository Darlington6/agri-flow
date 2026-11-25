import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { AppState } from 'react-native'

import * as api from './api'
import { clearSession, currentTokens, loadSession, saveTokens, saveUser } from './session'
import type { AuthUser, SignedIn } from './types'

export { ApiError, OfflineError } from './api'
export type { AuthUser } from './types'

/**
 * `loading`: reading the saved session (a moment, at launch).
 * `signed-in`: `user` is set; it may be the saved copy while offline.
 * `unreachable`: a session is saved but the account details aren't, and the
 * API can't be reached to fetch them. Rare (storage partly lost); retry.
 */
type Status = 'loading' | 'signed-out' | 'signed-in' | 'unreachable'

interface Auth {
  status: Status
  user: AuthUser | null
  /** The last check with the API couldn't reach it; `user` is the saved copy. */
  offline: boolean
  /** Emails a link and a code. `debugCode` only from a local API. */
  requestEmailCode: (email: string) => Promise<{ debugCode?: string }>
  verifyEmailCode: (email: string, code: string) => Promise<AuthUser>
  requestPhoneCode: (phoneNumber: string) => Promise<{ debugCode?: string }>
  verifyPhoneCode: (phoneNumber: string, code: string) => Promise<AuthUser>
  signInWithGoogle: (credential: string, nonce: string) => Promise<AuthUser>
  /** Tries again after `unreachable`. */
  retry: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<Auth | null>(null)

// A local API returns the code (only with DEBUG on, never in staging or
// production); it's printed here too, like the web app does.
function logForDev(what: string, value: string | undefined) {
  if (__DEV__ && value) console.info(`[AgriFlow dev] ${what}: ${value}`)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [offline, setOffline] = useState(false)

  const show = useCallback((next: AuthUser) => {
    setUser(next)
    setStatus('signed-in')
    void saveUser(next)
  }, [])

  const forget = useCallback(() => {
    setUser(null)
    setStatus('signed-out')
  }, [])

  /** Fresh details from the API. Offline, whatever is on screen stays. */
  const refresh = useCallback(
    async (hasSaved: boolean) => {
      try {
        show(await api.getMe())
        setOffline(false)
      } catch (error) {
        if (error instanceof api.OfflineError) {
          setOffline(true)
          if (!hasSaved) setStatus('unreachable')
        } else if (error instanceof api.SessionEndedError) {
          forget()
        } else if (!hasSaved) {
          setStatus('unreachable')
        }
      }
    },
    [show, forget],
  )

  useEffect(() => {
    api.whenSessionEnds(forget)
    let cancelled = false
    void (async () => {
      const saved = await loadSession().catch(() => null)
      if (cancelled) return
      if (!saved) return forget()
      // Signed in straight away from the saved copy, connection or not.
      if (saved.user) {
        setUser(saved.user)
        setStatus('signed-in')
      }
      await refresh(!!saved.user)
    })()
    return () => {
      cancelled = true
    }
  }, [forget, refresh])

  // Coming back to the app checks again, so details catch up once the
  // connection is back (and a session ended elsewhere shows sign-in).
  useEffect(() => {
    if (status !== 'signed-in') return
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh(true)
    })
    return () => subscription.remove()
  }, [status, refresh])

  const value = useMemo<Auth>(() => {
    async function signedIn(result: SignedIn) {
      await saveTokens({ access: result.access, refresh: result.refresh })
      setOffline(false)
      show(result.user)
      return result.user
    }
    return {
      status,
      user,
      offline,
      async requestEmailCode(email) {
        const { debug_code } = await api.requestEmailSignIn(email)
        logForDev(`Code for ${email}`, debug_code)
        return { debugCode: debug_code }
      },
      verifyEmailCode: async (email, code) => signedIn(await api.verifyEmailCode(email, code)),
      async requestPhoneCode(phoneNumber) {
        const { debug_code } = await api.requestPhoneCode(phoneNumber)
        logForDev(`Code for ${phoneNumber}`, debug_code)
        return { debugCode: debug_code }
      },
      verifyPhoneCode: async (phoneNumber, code) => signedIn(await api.verifyPhoneCode(phoneNumber, code)),
      signInWithGoogle: async (credential, nonce) => signedIn(await api.signInWithGoogle(credential, nonce)),
      async retry() {
        setStatus('loading')
        await refresh(false)
      },
      async signOut() {
        const tokens = currentTokens()
        await clearSession()
        forget()
        if (tokens) await api.retireRefreshToken(tokens.refresh)
      },
    }
  }, [status, user, offline, show, forget, refresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>')
  return auth
}

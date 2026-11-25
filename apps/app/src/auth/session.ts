// The signed-in session, kept on the device so the app opens signed in,
// with or without a connection: the API's two tokens and the last account
// details it sent. Kept in secure storage (the keychain on iOS, the keystore
// on Android). Memory holds a copy so requests don't wait on storage.

import { getItem, removeItem, setItem } from '@/lib/secure-storage'

import type { AuthUser } from './types'

const ACCESS_KEY = 'agriflow.auth.access'
const REFRESH_KEY = 'agriflow.auth.refresh'
const USER_KEY = 'agriflow.auth.user'

export interface Tokens {
  access: string
  refresh: string
}

let current: Tokens | null = null

export function currentTokens(): Tokens | null {
  return current
}

/** Reads what the last visit left. The user is null if it wasn't saved or can't be read. */
export async function loadSession(): Promise<{ tokens: Tokens; user: AuthUser | null } | null> {
  const [access, refresh, saved] = await Promise.all([getItem(ACCESS_KEY), getItem(REFRESH_KEY), getItem(USER_KEY)])
  if (!access || !refresh) return null
  current = { access, refresh }
  let user: AuthUser | null = null
  try {
    user = saved ? (JSON.parse(saved) as AuthUser) : null
  } catch {
    user = null
  }
  return { tokens: current, user }
}

export async function saveTokens(tokens: Tokens): Promise<void> {
  current = tokens
  await Promise.all([setItem(ACCESS_KEY, tokens.access), setItem(REFRESH_KEY, tokens.refresh)])
}

export async function saveUser(user: AuthUser): Promise<void> {
  await setItem(USER_KEY, JSON.stringify(user))
}

export async function clearSession(): Promise<void> {
  current = null
  await Promise.all([removeItem(ACCESS_KEY), removeItem(REFRESH_KEY), removeItem(USER_KEY)])
}

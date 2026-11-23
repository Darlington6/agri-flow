import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { PageLoading } from './PageLoading'

/**
 * For pages that need a real, set-up account: signed-out visitors go to sign
 * in, and anyone who hasn't finished setting up (or has new terms to agree
 * to) goes to /welcome first.
 */
export function RequireAccount({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoading fullScreen />
  if (!user) return <Navigate to="/signin" replace />
  if (user.needs_onboarding) return <Navigate to="/welcome" replace />
  return children
}

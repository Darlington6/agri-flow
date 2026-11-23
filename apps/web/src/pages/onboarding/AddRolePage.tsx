import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AccountShell } from '@/components/layout/AccountShell'
import { PageLoading } from '@/components/layout/PageLoading'
import { RequireAccount } from '@/components/layout/RequireAccount'
import { Button, Card } from '@/components/ui'
import { RoleStep } from '@/components/onboarding/OnboardingFlow'
import { ApiError, createProfile, getProfiles, getSetupOptions, type SelfServeRole } from '@/lib/apiClient'

/** Adding another role to a set-up account (/add-role), e.g. a farmer who also buys. */
export function AddRolePage() {
  return (
    <RequireAccount>
      <AddRole />
    </RequireAccount>
  )
}

function AddRole() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [held, setHeld] = useState<SelfServeRole[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getProfiles()
      .then((profiles) => setHeld(profiles.map((p) => p.role)))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your roles."))
  }, [])

  return (
    <AccountShell title="Add a role">
      <Card className="w-full max-w-md">
        {error ? (
          <p role="alert" className="text-sm text-status-risk">
            {error}
          </p>
        ) : !held || !user ? (
          <PageLoading />
        ) : (
          <RoleStep
            driver={{
              loadOptions: getSetupOptions,
              async chooseRole(role, details) {
                await createProfile(role, details)
              },
            }}
            country={user.country}
            held={held}
            onChosen={async () => {
              await refreshUser()
              navigate('/home')
            }}
          />
        )}
        <Button variant="ghost" className="mt-4 w-full" onClick={() => navigate('/home')}>
          Cancel
        </Button>
      </Card>
    </AccountShell>
  )
}

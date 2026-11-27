import { useEffect, useState } from 'react'

import { useAuth } from '@/auth'
import * as api from '@/auth/api'
import { Button } from '@/components/button'
import { Message } from '@/components/message'
import { Screen } from '@/components/screen'
import { Text } from '@/components/text'
import { useI18n } from '@/i18n'
import { isSelfServeRole, STAFF_SLUGS, type OnboardingState, type PersonalDetails, type Profile } from '@/onboarding'

import { OnboardingFlow } from './flow'

/**
 * Setting up a new account. Loads where they got to (on any device) and
 * their roles, then runs the flow from the first step not done yet. Needs
 * a connection: each step is saved as it's answered.
 */
export function Welcome() {
  const { t } = useI18n()
  const { user, offline } = useAuth()
  const [loaded, setLoaded] = useState<{
    state: OnboardingState
    profiles: Profile[]
    personal: PersonalDetails
  } | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    let current = true
    Promise.all([api.getOnboarding(), api.getProfiles(), api.getPersonalDetails()])
      .then(([state, profiles, personal]) => current && setLoaded({ state, profiles, personal }))
      .catch(() => current && setFailed(true))
    return () => {
      current = false
    }
  }, [userId, attempt])

  if (!user) return null

  if (!loaded) {
    return (
      <Screen centered backdrop glow="still">
        <Text variant="title">{user.onboarded_at ? t('welcome.titleReturning') : t('welcome.title')}</Text>
        {failed ? (
          <>
            <Message tone="risk">{offline ? t('common.offline') : t('welcome.loadFailed')}</Message>
            <Button
              variant="secondary"
              label={t('common.tryAgain')}
              onPress={() => {
                setFailed(false)
                setAttempt((a) => a + 1)
              }}
            />
          </>
        ) : (
          <Text color="muted">{t('common.loading')}</Text>
        )}
      </Screen>
    )
  }

  return (
    <OnboardingFlow
      start={{
        name: user.display_name,
        personal: loaded.personal,
        country: user.country,
        language: user.language,
        roles: loaded.profiles.map((p) => p.role).filter(isSelfServeRole),
        staff: user.roles.some((r) => STAFF_SLUGS.includes(r.slug)),
        hasPhone: Boolean(user.phone_number),
        returning: Boolean(user.onboarded_at),
        next: loaded.state.next_step,
      }}
      termsVersion={loaded.state.terms_version}
    />
  )
}

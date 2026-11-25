import { router } from 'expo-router'
import { useEffect, useRef } from 'react'

import { useAuth } from '@/auth'
import { Screen } from '@/components/screen'
import { Text } from '@/components/text'
import { useI18n } from '@/i18n'
import { takeGoogleReturn } from '@/lib/google'

/**
 * Where Google sends people back (web only): signs in with the token, or
 * returns to sign-in with what went wrong. Closing the picker isn't an error.
 */
export function GoogleReturn() {
  const { t } = useI18n()
  const { signInWithGoogle } = useAuth()
  // The token is in the address once; read it once (effects can run twice).
  const read = useRef(false)

  useEffect(() => {
    if (read.current) return
    read.current = true
    const fragment = typeof window === 'undefined' ? '' : window.location.hash
    // Keep the token out of the address bar and history.
    if (typeof window !== 'undefined') window.history.replaceState(null, '', window.location.pathname)
    const answer = takeGoogleReturn(fragment)
    if ('error' in answer) {
      router.replace(
        answer.error === 'cancelled' ? '/sign-in' : { pathname: '/sign-in', params: { google: answer.error } },
      )
      return
    }
    signInWithGoogle(answer.credential, answer.nonce)
      .then(() => router.replace('/home'))
      .catch(() => router.replace({ pathname: '/sign-in', params: { google: 'failed' } }))
  }, [signInWithGoogle])

  return (
    <Screen centered>
      <Text color="muted" style={{ textAlign: 'center' }}>
        {t('signIn.google.signingIn')}
      </Text>
    </Screen>
  )
}

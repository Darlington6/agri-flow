import { StyleSheet, View } from 'react-native'

import { useAuth } from '@/auth'
import { Button } from '@/components/button'
import { LogoMark } from '@/components/logo-mark'
import { Message } from '@/components/message'
import { Screen } from '@/components/screen'
import { Text } from '@/components/text'
import { useI18n } from '@/i18n'
import { formatPhone } from '@/lib/phone'
import { space } from '@/theme'

/**
 * Where a signed-in account lands, for now: who's signed in, what comes
 * next, and signing out. Works offline from the saved account details.
 */
export function Home() {
  const { t } = useI18n()
  const { user, offline, signOut } = useAuth()
  if (!user) return null

  const who = user.email ?? (user.phone_number ? formatPhone(user.phone_number) : '')
  return (
    <Screen backdrop>
      <View style={styles.logo}>
        <LogoMark size={48} label={t('app.name')} />
      </View>
      <Text variant="title">
        {user.display_name ? t('home.greeting', { name: user.display_name }) : t('home.greetingNoName')}
      </Text>
      {who ? <Text color="muted">{t('home.signedInAs', { who })}</Text> : null}
      {offline && <Message>{t('home.offline')}</Message>}
      {user.needs_onboarding ? (
        <View style={styles.section}>
          <Text variant="heading">{t('home.setup.heading')}</Text>
          <Text>{t('home.setup.body')}</Text>
        </View>
      ) : (
        <Text>{t('home.ready.body')}</Text>
      )}
      <Button variant="secondary" label={t('home.signOut')} onPress={signOut} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  logo: { alignItems: 'flex-start' },
  section: { gap: space.sm },
})

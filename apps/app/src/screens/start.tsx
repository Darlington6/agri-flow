import { router } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { Button } from '@/components/button'
import { LogoMark } from '@/components/logo-mark'
import { Screen } from '@/components/screen'
import { Text } from '@/components/text'
import { useI18n } from '@/i18n'
import { space } from '@/theme'

/** The first screen for someone signed out. */
export function Start() {
  const { t } = useI18n()
  return (
    <Screen centered backdrop>
      <View style={styles.logo}>
        <LogoMark size={72} label={t('app.name')} />
      </View>
      <Text variant="title" style={styles.center}>
        {t('start.title')}
      </Text>
      <Text color="muted" style={styles.center}>
        {t('start.body')}
      </Text>
      <View style={styles.action}>
        <Button label={t('start.signIn')} onPress={() => router.push('/sign-in')} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  logo: { alignItems: 'center', marginBottom: space.sm },
  center: { textAlign: 'center' },
  action: { marginTop: space.md },
})

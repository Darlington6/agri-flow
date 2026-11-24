import { StyleSheet, View } from 'react-native'

import { LogoMark } from '@/components/logo-mark'
import { Screen } from '@/components/screen'
import { Text } from '@/components/text'
import { useI18n } from '@/i18n'
import { space } from '@/theme'

/** The first screen. Sign-in replaces the note once it moves into this app. */
export function Start() {
  const { t } = useI18n()
  return (
    <Screen centered>
      <View style={styles.logo}>
        <LogoMark size={72} label={t('app.name')} />
      </View>
      <Text variant="title" style={styles.center}>
        {t('start.title')}
      </Text>
      <Text color="muted" style={styles.center}>
        {t('start.body')}
      </Text>
      <Text variant="small" color="accent" style={[styles.center, styles.note]}>
        {t('start.comingSoon')}
      </Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  logo: { alignItems: 'center', marginBottom: space.sm },
  center: { textAlign: 'center' },
  note: { marginTop: space.md },
})

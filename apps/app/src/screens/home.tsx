import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { useAuth } from '@/auth'
import * as api from '@/auth/api'
import { Button } from '@/components/button'
import { Message } from '@/components/message'
import { Screen } from '@/components/screen'
import { Text } from '@/components/text'
import { useI18n } from '@/i18n'
import { formatPhone } from '@/lib/phone'
import { COMING, type Profile } from '@/onboarding'
import { radius, space, usePalette } from '@/theme'

/**
 * Where a set-up account lands, for now: each role with its verification
 * and what it gets during the pilot (no made-up numbers on a real account),
 * and signing out. Works offline from the saved account details; the roles
 * need a connection.
 */
export function Home() {
  const { t } = useI18n()
  const { user, offline, signOut } = useAuth()
  const [profiles, setProfiles] = useState<Profile[] | null>(null)
  const [failed, setFailed] = useState(false)
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    let current = true
    api
      .getProfiles()
      .then((p) => current && setProfiles(p))
      .catch(() => current && setFailed(true))
    return () => {
      current = false
    }
  }, [userId, offline])

  if (!user) return null

  const firstName = user.display_name.trim().split(/\s+/)[0]
  const who = user.email ?? (user.phone_number ? formatPhone(user.phone_number) : '')
  return (
    <Screen backdrop glow="still">
      <Text variant="title">{firstName ? t('home.greeting', { name: firstName }) : t('home.greetingNoName')}</Text>
      {who ? <Text color="muted">{t('home.signedInAs', { who })}</Text> : null}
      {offline && <Message>{t('home.offline')}</Message>}
      <Text>{t('home.ready.body')}</Text>

      {profiles?.length === 0 && <Text>{t('home.staff', { roles: user.roles.map((r) => r.name).join(', ') })}</Text>}
      {profiles?.map((profile) => (
        <RoleCard key={profile.role} profile={profile} />
      ))}
      {failed && !offline && !profiles && <Message tone="risk">{t('home.rolesFailed')}</Message>}

      <Button variant="secondary" label={t('home.signOut')} onPress={signOut} />
    </Screen>
  )
}

function RoleCard({ profile }: { profile: Profile }) {
  const { t } = useI18n()
  const palette = usePalette()
  const role = t(`welcome.role.${profile.role}`)
  const verified = profile.verification === 'verified'
  return (
    <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
      <View style={styles.cardTop}>
        <Text variant="heading" style={styles.cardTitle}>
          {role}
        </Text>
        <Text variant="caption" color={verified ? 'good' : profile.verification === 'rejected' ? 'risk' : 'muted'}>
          {t(`verification.${profile.verification}`)}
        </Text>
      </View>
      {!verified && (
        <Text variant="small" color="muted">
          {t('home.checking', { role: role.toLowerCase() })}
        </Text>
      )}
      <Text variant="label" color="muted">
        {t('home.coming')}
      </Text>
      {COMING[profile.role].map((key) => (
        <Text key={key} variant="small">
          {`•  ${t(key)}`}
        </Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: space.md, gap: space.sm },
  cardTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  cardTitle: { flexShrink: 1 },
})

import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Linking, Pressable, StyleSheet, View } from 'react-native'

import { ApiError, OfflineError, useAuth } from '@/auth'
import * as api from '@/auth/api'
import { BackLink } from '@/components/back-link'
import { Button } from '@/components/button'
import { Message } from '@/components/message'
import { Screen } from '@/components/screen'
import { Text } from '@/components/text'
import { useI18n, type Translate } from '@/i18n'
import { formatPhone } from '@/lib/phone'
import type { CooperativeMembers, Member } from '@/onboarding'
import { radius, space, usePalette } from '@/theme'

function messageFor(error: unknown, t: Translate, fallback: string): string {
  if (error instanceof OfflineError) return t('common.offline')
  if (error instanceof ApiError) return error.message
  return fallback
}

/**
 * A cooperative's members, for the person who manages it: farmers who
 * chose the cooperative wait here until the manager confirms them (or
 * declines). Only confirmed members count. Needs a connection.
 */
export function Members() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [data, setData] = useState<CooperativeMembers | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    let current = true
    api
      .getCooperativeMembers()
      .then((d) => current && setData(d))
      .catch((err) => current && setError(messageFor(err, t, t('members.loadFailed'))))
    return () => {
      current = false
    }
  }, [userId, attempt, t])

  /** Shows a decision straight away, with the counts to match. */
  function decided(updated: Member) {
    setData((d) => {
      if (!d) return d
      const members = d.members.map((m) => (m.id === updated.id ? updated : m))
      return {
        cooperative: {
          ...d.cooperative,
          confirmed: members.filter((m) => m.status === 'confirmed').length,
          pending: members.filter((m) => m.status === 'pending').length,
        },
        members,
      }
    })
  }

  const waiting = data?.members.filter((m) => m.status === 'pending') ?? []
  const confirmed = data?.members.filter((m) => m.status === 'confirmed') ?? []
  const back = () => (router.canGoBack() ? router.back() : router.replace('/home'))

  return (
    <Screen backdrop header={<BackLink label={t('common.back')} onPress={back} />}>
      <Text variant="title">
        {data ? t('members.title', { name: data.cooperative.name }) : t('members.titlePlain')}
      </Text>
      {error ? (
        <>
          <Message tone="risk">{error}</Message>
          <Button
            variant="secondary"
            label={t('common.tryAgain')}
            onPress={() => {
              setError(null)
              setAttempt((a) => a + 1)
            }}
          />
        </>
      ) : !data ? (
        <Text color="muted">{t('common.loading')}</Text>
      ) : (
        <>
          <Text variant="heading">{t('members.waiting', { count: waiting.length })}</Text>
          <Text color="muted">{waiting.length ? t('members.waitingBody') : t('members.noneWaiting')}</Text>
          {waiting.map((m) => (
            <MemberCard key={m.id} member={m} onDecided={decided} />
          ))}
          <Text variant="heading">{t('members.members', { count: confirmed.length })}</Text>
          {confirmed.length ? null : <Text color="muted">{t('members.noMembers')}</Text>}
          {confirmed.map((m) => (
            <MemberCard key={m.id} member={m} onDecided={decided} />
          ))}
        </>
      )}
    </Screen>
  )
}

function MemberCard({ member, onDecided }: { member: Member; onDecided: (m: Member) => void }) {
  const { t } = useI18n()
  const palette = usePalette()
  const [busy, setBusy] = useState<'confirmed' | 'declined' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { farmer } = member
  const name = farmer.name || t('members.aFarmer')
  const place = [farmer.district, farmer.region].filter(Boolean).join(', ')

  async function decide(status: 'confirmed' | 'declined') {
    setBusy(status)
    setError(null)
    try {
      onDecided(await api.decideMembership(member.id, status))
    } catch (err) {
      setError(messageFor(err, t, t('common.failed')))
    } finally {
      setBusy(null)
    }
  }

  return (
    <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.surface }]}>
      <Text variant="label">{name}</Text>
      {place || farmer.crops.length ? (
        <Text variant="small" color="muted">
          {[place, farmer.crops.join(', ')].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
      {farmer.phone_number ? (
        <Pressable
          role="link"
          accessibilityLabel={t('members.call', { phone: formatPhone(farmer.phone_number) })}
          onPress={() => void Linking.openURL(`tel:${farmer.phone_number}`)}
          hitSlop={8}
          style={styles.phone}
        >
          <Text variant="label" color="link">
            {formatPhone(farmer.phone_number)}
          </Text>
        </Pressable>
      ) : null}
      {error ? <Message tone="risk">{error}</Message> : null}
      {member.status === 'pending' ? (
        <View style={styles.actions}>
          <Button
            style={styles.action}
            variant="secondary"
            label={t('members.decline')}
            accessibilityLabel={t('members.declineName', { name })}
            busy={busy === 'declined'}
            disabled={!!busy}
            onPress={() => decide('declined')}
          />
          <Button
            style={styles.action}
            label={t('members.confirm')}
            accessibilityLabel={t('members.confirmName', { name })}
            busy={busy === 'confirmed'}
            disabled={!!busy}
            onPress={() => decide('confirmed')}
          />
        </View>
      ) : (
        <Button
          variant="secondary"
          label={t('members.remove')}
          accessibilityLabel={t('members.removeName', { name })}
          busy={busy === 'declined'}
          disabled={!!busy}
          onPress={() => decide('declined')}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: space.md, gap: space.sm },
  phone: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  action: { flexGrow: 1, flexBasis: 140 },
})

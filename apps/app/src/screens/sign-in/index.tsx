import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { BackHandler, Platform, Pressable, StyleSheet, View } from 'react-native'

import { ApiError, OfflineError, useAuth } from '@/auth'
import { BackLink } from '@/components/back-link'
import { Button } from '@/components/button'
import { Message } from '@/components/message'
import { PhoneField, usePhoneField } from '@/components/phone-field'
import { Screen } from '@/components/screen'
import { Text } from '@/components/text'
import { TextField } from '@/components/text-field'
import { useI18n, type Translate } from '@/i18n'
import { googleAvailable, startGoogleSignIn } from '@/lib/google'
import { formatPhone } from '@/lib/phone'
import { space, usePalette } from '@/theme'

const googleLogo = require('../../../assets/google-g.svg')

type Step = 'email' | 'email-code' | 'phone' | 'phone-code'

// Where Back goes from each step: what was on screen before it.
const PREVIOUS: Record<Step, Step | null> = {
  email: null,
  phone: 'email',
  'email-code': 'email',
  'phone-code': 'phone',
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CODE = /^\d{6}$/

function messageFor(error: unknown, t: Translate): string {
  if (error instanceof OfflineError) return t('signIn.offline')
  if (error instanceof ApiError) return error.message
  return t('signIn.failed')
}

/**
 * Email first (phone codes need an SMS provider, which staging and
 * production don't have yet), phone one tap away, Google last on the web.
 * Email and phone both send a 6-digit code; the first one creates the account.
 * Once signed in, the app's layout moves on to the account's home.
 */
export function SignIn({ googleError }: { googleError?: 'stale' | 'failed' | null }) {
  const { t } = useI18n()
  const auth = useAuth()
  const phone = usePhoneField()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [debugCode, setDebugCode] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(googleError ? t(`signIn.google.${googleError}`) : null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [leaving, setLeaving] = useState(false)

  function goTo(next: Step) {
    setStep(next)
    setFieldError(null)
    setError(null)
    setNotice(null)
    if (next === 'email' || next === 'phone') {
      setCode('')
      setDebugCode(null)
    }
  }

  async function attempt(action: () => Promise<void>) {
    setError(null)
    setFieldError(null)
    setBusy(true)
    try {
      await action()
    } catch (err) {
      setError(messageFor(err, t))
    } finally {
      setBusy(false)
    }
  }

  async function sendEmailCode(again = false) {
    const address = email.trim().toLowerCase()
    if (!EMAIL.test(address)) return setFieldError(t('signIn.email.invalid'))
    await attempt(async () => {
      const { debugCode } = await auth.requestEmailCode(address)
      setDebugCode(debugCode ?? null)
      if (again) setNotice(t('signIn.code.resent'))
      else goTo('email-code')
    })
  }

  async function sendPhoneCode(again = false) {
    if (!phone.value) return setFieldError(t('signIn.phone.empty'))
    await attempt(async () => {
      const { debugCode } = await auth.requestPhoneCode(phone.value)
      setDebugCode(debugCode ?? null)
      if (again) setNotice(t('signIn.code.resent'))
      else goTo('phone-code')
    })
  }

  async function verify() {
    const digits = code.replace(/\D/g, '')
    if (!CODE.test(digits)) return setFieldError(t('signIn.code.invalid'))
    setNotice(null)
    await attempt(async () => {
      if (step === 'email-code') await auth.verifyEmailCode(email.trim().toLowerCase(), digits)
      else await auth.verifyPhoneCode(phone.value, digits)
    })
  }

  const choosing = step === 'email' || step === 'phone'

  // Back steps through sign-in first, then leaves it for the welcome screen.
  function back() {
    const previous = PREVIOUS[step]
    if (previous) goTo(previous)
    else if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  // Android's back button and gesture do the same while there's a step to go
  // back to. Only Android has one (React Native warns on the web).
  useEffect(() => {
    const previous = PREVIOUS[step]
    if (!previous || Platform.OS !== 'android') return
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goTo(previous)
      return true
    })
    return () => subscription.remove()
  }, [step])

  return (
    <Screen centered backdrop glow="still" header={<BackLink label={t('signIn.back')} onPress={back} />}>
      <Text variant="title" style={styles.center}>
        {t('signIn.title')}
      </Text>

      {step === 'email' && (
        <>
          <Text variant="heading">{t('signIn.email.heading')}</Text>
          <Text color="muted">{t('signIn.email.body')}</Text>
          <TextField
            label={t('signIn.email.label')}
            placeholder={t('signIn.email.placeholder')}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => sendEmailCode()}
            error={fieldError}
          />
          {error && <Message tone="risk">{error}</Message>}
          <Button label={t('signIn.email.send')} busy={busy} onPress={() => sendEmailCode()} />
          <Divider label={t('signIn.or')} />
          <Button variant="secondary" label={t('signIn.email.usePhone')} onPress={() => goTo('phone')} />
        </>
      )}

      {step === 'phone' && (
        <>
          <Text variant="heading">{t('signIn.phone.heading')}</Text>
          <Text color="muted">{t('signIn.phone.body')}</Text>
          <PhoneField
            field={phone}
            label={t('signIn.phone.label')}
            error={fieldError}
            onSubmitEditing={() => sendPhoneCode()}
          />
          {error && <Message tone="risk">{error}</Message>}
          <Button label={t('signIn.phone.send')} busy={busy} onPress={() => sendPhoneCode()} />
          <Divider label={t('signIn.or')} />
          <Button variant="secondary" label={t('signIn.phone.useEmail')} onPress={() => goTo('email')} />
        </>
      )}

      {(step === 'email-code' || step === 'phone-code') && (
        <>
          <Text variant="heading">{t('signIn.code.heading')}</Text>
          <Text color="muted">
            {step === 'email-code'
              ? t('signIn.code.sentToEmail', { email: email.trim().toLowerCase() })
              : t('signIn.code.sentToPhone', { phone: formatPhone(phone.value) })}
          </Text>
          {debugCode && <Message>{t('signIn.code.dev', { code: debugCode })}</Message>}
          <TextField
            label={t('signIn.code.label')}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={6}
            returnKeyType="done"
            value={code}
            onChangeText={setCode}
            onSubmitEditing={verify}
            error={fieldError}
            style={styles.code}
          />
          {error && <Message tone="risk">{error}</Message>}
          {notice && <Message tone="good">{notice}</Message>}
          <Button label={t('signIn.code.verify')} busy={busy} onPress={verify} />
          <View style={styles.links}>
            <TextLink
              label={t('signIn.code.resend')}
              disabled={busy}
              onPress={() => (step === 'email-code' ? sendEmailCode(true) : sendPhoneCode(true))}
            />
            <TextLink
              label={step === 'email-code' ? t('signIn.code.otherEmail') : t('signIn.code.otherPhone')}
              onPress={() => goTo(step === 'email-code' ? 'email' : 'phone')}
            />
          </View>
        </>
      )}

      {choosing && googleAvailable() && (
        <>
          <Divider label={t('signIn.or')} />
          <Button
            variant="secondary"
            label={leaving ? t('signIn.google.opening') : t('signIn.google')}
            disabled={leaving}
            icon={<Image source={googleLogo} style={styles.googleLogo} accessible={false} />}
            onPress={() => {
              setLeaving(true)
              startGoogleSignIn()
            }}
          />
        </>
      )}
    </Screen>
  )
}

function Divider({ label }: { label: string }) {
  const palette = usePalette()
  const line = [styles.line, { backgroundColor: palette.muted }]
  return (
    <View style={styles.divider} aria-hidden>
      <View style={line} />
      <Text variant="button" color="text" style={styles.dividerLabel}>
        {label}
      </Text>
      <View style={line} />
    </View>
  )
}

function TextLink({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable role="button" onPress={onPress} disabled={disabled} hitSlop={8} style={styles.textLink}>
      <Text variant="label" color="link">
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  code: { fontSize: 22, letterSpacing: 6, fontVariant: ['tabular-nums'] },
  links: { alignItems: 'center', gap: space.sm },
  textLink: { minHeight: 44, justifyContent: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  // Bold enough to see at a glance on cream; the lines a soft grey.
  dividerLabel: { fontSize: 15, lineHeight: 20 },
  line: { flex: 1, height: 1, opacity: 0.45 },
  googleLogo: { width: 18, height: 18 },
})

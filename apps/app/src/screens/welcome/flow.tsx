import { useEffect, useMemo, useRef, useState } from 'react'
import { BackHandler, Linking, Platform, Pressable, StyleSheet, View } from 'react-native'

import { ApiError, OfflineError, useAuth } from '@/auth'
import * as api from '@/auth/api'
import type { Language } from '@/auth/types'
import { BackLink } from '@/components/back-link'
import { Button } from '@/components/button'
import { Checkbox } from '@/components/checkbox'
import { ChipGroup } from '@/components/chip-group'
import { ChoiceField } from '@/components/choice-field'
import { Message } from '@/components/message'
import { PhoneField, usePhoneField, type PhoneFieldState } from '@/components/phone-field'
import { Screen } from '@/components/screen'
import { Text } from '@/components/text'
import { TextField } from '@/components/text-field'
import { LANGUAGES, useI18n, type Translate } from '@/i18n'
import { SITE_URL } from '@/lib/config'
import { countryOptions, flag, formatPhone, guessCountry } from '@/lib/phone'
import {
  birthDate,
  firstStep,
  isMinor,
  ROLE_ORDER,
  stepsFor,
  whoCanReachYouKey,
  shortName,
  type FlowStart,
  type Gender,
  type GuardianRelationship,
  type OnboardingStep,
  type PersonalDetails,
  type SelfServeRole,
  type SetupOptions,
} from '@/onboarding'
import { radius, space, usePalette } from '@/theme'

import { RoleDetailsForm } from './role-details'

const CODE = /^\d{6}$/

function messageFor(error: unknown, t: Translate): string {
  if (error instanceof OfflineError) return t('common.offline')
  if (error instanceof ApiError) return error.message
  return t('common.failed')
}

/** Runs a save, keeping track of busy and the error, and moves on if it worked. */
function useSave() {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function run(save: () => Promise<void>, then?: () => void) {
    setBusy(true)
    setError(null)
    try {
      await save()
      then?.()
    } catch (err) {
      setError(messageFor(err, t))
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, setError, run }
}

/**
 * Setting up an account, one question per screen, as on the web: name, place,
 * role (and its details), phone (skippable) and the terms. Each step saves as
 * it goes, so leaving and coming back, on any device, picks up where they
 * stopped. Finishing updates the account, and the app moves on to home.
 */
export function OnboardingFlow({
  start,
  termsVersion,
}: {
  start: FlowStart & { name: string; personal: PersonalDetails; country: string; language: Language | '' }
  termsVersion: string
}) {
  const { t, language: shownLanguage } = useI18n()
  const auth = useAuth()
  const steps = useMemo(() => stepsFor(start), [start])
  const [index, setIndex] = useState(() => firstStep(steps, start.next))
  const step = steps[index]

  // What's been entered, kept here so going back shows it.
  const [about, setAbout] = useState<About>(() => {
    const [year = '', month = '', day = ''] = start.personal.date_of_birth?.split('-') ?? []
    return {
      legalName: start.personal.legal_name,
      publicName: start.name,
      publicNameEdited: Boolean(start.name),
      day,
      month,
      year,
      gender: start.personal.gender,
      guardianName: start.personal.guardian_name,
      guardianRelationship: start.personal.guardian_relationship,
    }
  })
  // Kept here, not in the step, so going back a step shows what was typed.
  const guardianPhone = usePhoneField(undefined, start.personal.guardian_phone)
  const [country, setCountry] = useState(start.country || guessCountry())
  const [language, setLanguage] = useState<Language>(start.language || shownLanguage)
  const [roles, setRoles] = useState<SelfServeRole[]>(start.roles)
  // Within the role step: the role being described.
  const [picked, setPicked] = useState<SelfServeRole | null>(null)
  // Within the phone step: the number a code went to.
  const [sentTo, setSentTo] = useState<string | null>(null)

  const save = useSave()

  function go(to: number) {
    setIndex(to)
    save.setError(null)
  }
  const next = () => go(Math.min(index + 1, steps.length - 1))

  // Back undoes the last move: a sub-step first, then the step before.
  const back: (() => void) | null = picked
    ? () => setPicked(null)
    : sentTo
      ? () => setSentTo(null)
      : index > 0
        ? () => go(index - 1)
        : null

  // Android's back button does the same while there's somewhere to go back to.
  const latestBack = useRef(back)
  useEffect(() => {
    latestBack.current = back
  })
  const canGoBack = back !== null
  useEffect(() => {
    if (!canGoBack || Platform.OS !== 'android') return
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      latestBack.current?.()
      return true
    })
    return () => subscription.remove()
  }, [canGoBack])

  const title = start.returning
    ? t('welcome.terms.titleChanged')
    : step === 'role' && picked
      ? t(`welcome.role.${picked}.title`)
      : t(STEP_TITLES[step])

  return (
    <Screen backdrop glow="still" header={back ? <BackLink label={t('common.back')} onPress={back} /> : undefined}>
      <Text variant="title">{start.returning ? t('welcome.titleReturning') : t('welcome.title')}</Text>
      {!start.returning && <Text color="muted">{t('welcome.body')}</Text>}
      {steps.length > 1 && <Progress step={index + 1} total={steps.length} />}

      <Text variant="heading">{title}</Text>

      {step === 'name' && <AboutStep about={about} setAbout={setAbout} guardianPhone={guardianPhone} onDone={next} />}

      {step === 'place' && (
        <PlaceStep
          country={country}
          setCountry={setCountry}
          language={language}
          setLanguage={setLanguage}
          busy={save.busy}
          error={save.error}
          onContinue={() => save.run(() => auth.updateAccount({ country, language }), next)}
        />
      )}

      {step === 'role' && (
        <RoleStep
          country={country}
          held={roles}
          picked={picked}
          onPick={setPicked}
          onChosen={(role) => {
            setRoles((r) => [...r, role])
            setPicked(null)
            next()
          }}
          onContinue={next}
        />
      )}

      {step === 'phone' && (
        <PhoneStep
          country={country}
          roles={roles}
          sentTo={sentTo}
          setSentTo={setSentTo}
          onDone={() => {
            setSentTo(null)
            next()
          }}
        />
      )}

      {step === 'terms' && <TermsStep termsVersion={termsVersion} />}

      <SignOutLink />
    </Screen>
  )
}

/** What's entered on the first step, kept by the flow so going back shows it. */
interface About {
  legalName: string
  publicName: string
  /** Edited by hand: stop suggesting one from the full name. */
  publicNameEdited: boolean
  day: string
  month: string
  year: string
  gender: Gender | ''
  guardianName: string
  guardianRelationship: GuardianRelationship | ''
}

const RELATIONSHIPS: GuardianRelationship[] = ['parent', 'legal_guardian', 'relative']

const GENDERS: Gender[] = ['woman', 'man', 'prefer_not_to_say']

/**
 * Who they are, exactly as on their ID (kept private, for verification
 * later), and the shorter name other people see, suggested from it.
 */
function AboutStep({
  about,
  setAbout,
  guardianPhone,
  onDone,
}: {
  about: About
  setAbout: (about: About) => void
  guardianPhone: PhoneFieldState
  onDone: () => void
}) {
  const { t } = useI18n()
  const auth = useAuth()
  const save = useSave()
  const palette = usePalette()
  const [birthError, setBirthError] = useState<string | null>(null)
  // Under 18 (once the date is complete and real): a parent or guardian is needed.
  const typed = birthDate(about.day, about.month, about.year)
  const minor = 'value' in typed && isMinor(typed.value)
  const ready =
    about.legalName.trim() &&
    about.publicName.trim() &&
    about.day &&
    about.month &&
    about.year &&
    (!minor || (about.guardianName.trim() && about.guardianRelationship && guardianPhone.value))
  const set = (changes: Partial<About>) => setAbout({ ...about, ...changes })

  function submit() {
    const born = birthDate(about.day, about.month, about.year)
    if ('error' in born) return setBirthError(t(`welcome.name.birth.${born.error}`))
    setBirthError(null)
    void save.run(async () => {
      await api.savePersonalDetails({
        legal_name: about.legalName.trim(),
        date_of_birth: born.value,
        gender: about.gender,
        guardian_name: minor ? about.guardianName.trim() : '',
        guardian_relationship: minor ? about.guardianRelationship : '',
        guardian_phone: minor ? guardianPhone.value : '',
      })
      await auth.updateAccount({ display_name: about.publicName.trim() })
    }, onDone)
  }

  const digits = (value: string) => value.replace(/\D/g, '')
  return (
    <>
      <TextField
        label={t('welcome.name.label')}
        hint={t('welcome.name.hint')}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        maxLength={200}
        value={about.legalName}
        onChangeText={(legalName) =>
          set({ legalName, publicName: about.publicNameEdited ? about.publicName : shortName(legalName) })
        }
      />
      <TextField
        label={t('welcome.name.public')}
        hint={t('welcome.name.publicHint')}
        autoComplete="nickname"
        autoCapitalize="words"
        maxLength={150}
        value={about.publicName}
        onChangeText={(publicName) => set({ publicName, publicNameEdited: true })}
      />
      <View style={styles.birth} role="group" aria-label={t('welcome.name.birth')}>
        <Text variant="label">{t('welcome.name.birth')}</Text>
        <View style={styles.birthRow}>
          <View style={styles.birthPart}>
            <TextField
              label={t('welcome.name.day')}
              keyboardType="number-pad"
              autoComplete="birthdate-day"
              maxLength={2}
              placeholder="DD"
              value={about.day}
              onChangeText={(day) => set({ day: digits(day) })}
            />
          </View>
          <View style={styles.birthPart}>
            <TextField
              label={t('welcome.name.month')}
              keyboardType="number-pad"
              autoComplete="birthdate-month"
              maxLength={2}
              placeholder="MM"
              value={about.month}
              onChangeText={(month) => set({ month: digits(month) })}
            />
          </View>
          <View style={styles.birthYear}>
            <TextField
              label={t('welcome.name.year')}
              keyboardType="number-pad"
              autoComplete="birthdate-year"
              maxLength={4}
              placeholder="YYYY"
              value={about.year}
              onChangeText={(year) => set({ year: digits(year) })}
            />
          </View>
        </View>
        {birthError ? (
          <Text variant="small" color="risk" role="alert">
            {birthError}
          </Text>
        ) : (
          <Text variant="small" color="muted">
            {t('welcome.name.birthHint')}
          </Text>
        )}
      </View>
      <ChipGroup
        legend={t('welcome.name.gender')}
        optional
        single
        options={GENDERS.map((value) => ({ value, label: t(`welcome.name.gender.${value}`) }))}
        value={about.gender ? [about.gender] : []}
        onChange={([gender]) => set({ gender: gender as Gender })}
      />
      <Text variant="small" color="muted">
        {t('welcome.name.genderHint')}
      </Text>
      {minor && (
        <View style={[styles.guardian, { borderColor: palette.border }]}>
          <Text>{t('welcome.guardian.intro')}</Text>
          <TextField
            label={t('welcome.guardian.name')}
            autoCapitalize="words"
            maxLength={200}
            value={about.guardianName}
            onChangeText={(guardianName) => set({ guardianName })}
          />
          <ChipGroup
            legend={t('welcome.guardian.relationship')}
            single
            options={RELATIONSHIPS.map((value) => ({ value, label: t(`welcome.guardian.relationship.${value}`) }))}
            value={about.guardianRelationship ? [about.guardianRelationship] : []}
            onChange={([relationship]) => set({ guardianRelationship: relationship as GuardianRelationship })}
          />
          <PhoneField field={guardianPhone} label={t('welcome.guardian.phone')} />
        </View>
      )}
      {save.error && <Message tone="risk">{save.error}</Message>}
      <Button
        label={save.busy ? t('common.saving') : t('common.continue')}
        busy={save.busy}
        disabled={!ready}
        onPress={submit}
      />
    </>
  )
}

const STEP_TITLES = {
  name: 'welcome.name.title',
  place: 'welcome.place.title',
  role: 'welcome.role.title',
  phone: 'welcome.phone.title',
  terms: 'welcome.terms.title',
} as const satisfies Record<OnboardingStep, string>

function Progress({ step, total }: { step: number; total: number }) {
  const palette = usePalette()
  const { t } = useI18n()
  const label = t('welcome.progress', { step, total })
  return (
    <View style={styles.progress}>
      <Text variant="caption" color="muted">
        {label}
      </Text>
      <View
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={step}
        style={[styles.track, { backgroundColor: palette.border }]}
      >
        <View style={[styles.bar, { width: `${(step / total) * 100}%`, backgroundColor: palette.action }]} />
      </View>
    </View>
  )
}

function PlaceStep({
  country,
  setCountry,
  language,
  setLanguage,
  busy,
  error,
  onContinue,
}: {
  country: string
  setCountry: (country: string) => void
  language: Language
  setLanguage: (language: Language) => void
  busy: boolean
  error: string | null
  onContinue: () => void
}) {
  const { t, language: shown } = useI18n()
  const countries = useMemo(
    () => countryOptions(shown).map((c) => ({ value: c.code, label: c.name, leading: flag(c.code) })),
    [shown],
  )
  return (
    <>
      <ChoiceField
        label={t('welcome.place.country')}
        hint={t('welcome.place.countryHint')}
        choices={countries}
        value={country}
        onChange={setCountry}
        searchLabel={t('countries.search')}
      />
      <ChipGroup
        legend={t('welcome.place.language')}
        single
        options={(Object.keys(LANGUAGES) as Language[]).map((code) => ({
          value: code,
          label: LANGUAGES[code].nativeName,
        }))}
        value={[language]}
        onChange={([code]) => setLanguage(code as Language)}
      />
      <Text variant="small" color="muted">
        {t('welcome.place.languageHint')}
      </Text>
      {error && <Message tone="risk">{error}</Message>}
      <Button label={busy ? t('common.saving') : t('common.continue')} busy={busy} onPress={onContinue} />
    </>
  )
}

/** Choose a role, then give its details. Roles they already have aren't offered again. */
function RoleStep({
  country,
  held,
  picked,
  onPick,
  onChosen,
  onContinue,
}: {
  country: string
  held: SelfServeRole[]
  picked: SelfServeRole | null
  onPick: (role: SelfServeRole | null) => void
  onChosen: (role: SelfServeRole) => void
  onContinue: () => void
}) {
  const { t } = useI18n()
  const palette = usePalette()
  const [options, setOptions] = useState<SetupOptions | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  // The pick lists for this country, fetched once a role is picked.
  useEffect(() => {
    if (!picked) return
    let current = true
    api
      .getSetupOptions(country)
      .then((o) => current && setOptions(o))
      .catch((err) => current && setLoadError(messageFor(err, t)))
    return () => {
      current = false
    }
  }, [picked, country, attempt, t])

  // Already chose (came back a step): say so and carry on.
  if (held.length && !picked) {
    const names = held.map((r) => t(`welcome.role.${r}`).toLowerCase())
    const list =
      names.length > 1
        ? t('welcome.role.and', { first: names.slice(0, -1).join(', '), second: names.at(-1)! })
        : names[0]
    return (
      <>
        <Text>{t('welcome.role.held', { roles: list })}</Text>
        <Button label={t('common.continue')} onPress={onContinue} />
      </>
    )
  }

  if (picked) {
    if (loadError) {
      return (
        <>
          <Message tone="risk">{loadError}</Message>
          <Button
            variant="secondary"
            label={t('common.tryAgain')}
            onPress={() => {
              setLoadError(null)
              setAttempt((a) => a + 1)
            }}
          />
        </>
      )
    }
    if (!options) return <Text color="muted">{t('common.loading')}</Text>
    return (
      <>
        <Text color="muted">{t('welcome.role.details', { role: t(`welcome.role.${picked}`).toLowerCase() })}</Text>
        <RoleDetailsForm
          key={picked}
          role={picked}
          options={options}
          submitLabel={t('common.continue')}
          onSubmit={async (details) => {
            await api.createProfile(picked, details)
            onChosen(picked)
          }}
        />
      </>
    )
  }

  return (
    <>
      <Text color="muted">{t('welcome.role.body')}</Text>
      <View style={styles.roles}>
        {ROLE_ORDER.filter((r) => !held.includes(r)).map((role) => (
          <Pressable
            key={role}
            role="button"
            accessibilityLabel={`${t(`welcome.role.${role}`)}. ${t(`welcome.role.${role}.blurb`)}`}
            onPress={() => onPick(role)}
            style={({ pressed }) => [
              styles.roleCard,
              { borderColor: palette.border, backgroundColor: pressed ? palette.canvas : palette.surface },
            ]}
          >
            <Text variant="heading" style={styles.roleName}>
              {t(`welcome.role.${role}`)}
            </Text>
            <Text variant="small" color="muted">
              {t(`welcome.role.${role}.blurb`)}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  )
}

function PhoneStep({
  country,
  roles,
  sentTo,
  setSentTo,
  onDone,
}: {
  country: string
  roles: readonly string[]
  sentTo: string | null
  setSentTo: (number: string | null) => void
  onDone: () => void
}) {
  const { t } = useI18n()
  const auth = useAuth()
  // Starts on the country they chose a step before.
  const phone = usePhoneField(country)
  const [code, setCode] = useState('')
  const [debugCode, setDebugCode] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const save = useSave()

  function send() {
    const number = phone.value
    if (!number) return setFieldError(t('signIn.phone.empty'))
    setFieldError(null)
    void save.run(async () => {
      const { debugCode } = await auth.requestPhoneAdd(number)
      setDebugCode(debugCode ?? null)
      setCode('')
      setSentTo(number)
    })
  }

  function confirm() {
    const digits = code.replace(/\D/g, '')
    if (!CODE.test(digits) || !sentTo) return setFieldError(t('signIn.code.invalid'))
    setFieldError(null)
    void save.run(() => auth.confirmPhoneAdd(sentTo, digits), onDone)
  }

  if (sentTo) {
    return (
      <>
        <Text color="muted">{t('welcome.phone.sent', { phone: formatPhone(sentTo) })}</Text>
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
          onSubmitEditing={confirm}
          error={fieldError}
          style={styles.code}
        />
        {save.error && <Message tone="risk">{save.error}</Message>}
        <Button
          label={save.busy ? t('welcome.phone.checking') : t('welcome.phone.confirm')}
          busy={save.busy}
          onPress={confirm}
        />
        <Button variant="secondary" label={t('welcome.phone.otherNumber')} onPress={() => setSentTo(null)} />
      </>
    )
  }

  return (
    <>
      <Text color="muted">{t('welcome.phone.body', { who: t(whoCanReachYouKey(roles)) })}</Text>
      <PhoneField field={phone} label={t('signIn.phone.label')} error={fieldError} onSubmitEditing={send} />
      {save.error && <Message tone="risk">{save.error}</Message>}
      <Button
        label={save.busy ? t('welcome.phone.sending') : t('welcome.phone.send')}
        busy={save.busy}
        onPress={send}
      />
      <Button
        variant="secondary"
        label={t('welcome.phone.skip')}
        disabled={save.busy}
        onPress={() =>
          save.run(async () => {
            await api.skipPhone()
          }, onDone)
        }
      />
    </>
  )
}

function TermsStep({ termsVersion }: { termsVersion: string }) {
  const { t } = useI18n()
  const auth = useAuth()
  const [agreed, setAgreed] = useState(false)
  const save = useSave()
  return (
    <>
      <Text color="muted">{t('welcome.terms.body')}</Text>
      <View style={styles.links}>
        <ExternalLink label={t('welcome.terms.terms')} url={`${SITE_URL}/terms`} />
        <ExternalLink label={t('welcome.terms.privacy')} url={`${SITE_URL}/privacy`} />
      </View>
      <Checkbox checked={agreed} onChange={setAgreed} label={t('welcome.terms.agree')}>
        <Text>{t('welcome.terms.agree')}</Text>
      </Checkbox>
      {save.error && <Message tone="risk">{save.error}</Message>}
      <Button
        label={save.busy ? t('welcome.terms.finishing') : t('welcome.terms.finish')}
        busy={save.busy}
        disabled={!agreed}
        // The account comes back set up, and the app moves on to home.
        onPress={() => save.run(async () => auth.replaceUser(await api.completeOnboarding(termsVersion)))}
      />
    </>
  )
}

/** Opens a page of the website in the browser. */
function ExternalLink({ label, url }: { label: string; url: string }) {
  const { t } = useI18n()
  return (
    <Pressable
      role="link"
      accessibilityLabel={`${label}, ${t('common.opensBrowser')}`}
      onPress={() => void Linking.openURL(url)}
      hitSlop={8}
      style={styles.link}
    >
      <Text variant="label" color="link" style={styles.underline}>
        {label}
      </Text>
    </Pressable>
  )
}

function SignOutLink() {
  const { t } = useI18n()
  const { signOut } = useAuth()
  return (
    <Pressable role="button" onPress={() => void signOut()} hitSlop={8} style={styles.signOut}>
      <Text variant="small" color="muted" style={styles.underline}>
        {t('welcome.signOut')}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  progress: { gap: space.xs },
  birth: { gap: space.xs },
  guardian: { borderWidth: 1, borderRadius: radius.lg, padding: space.md, gap: space.md },
  birthRow: { flexDirection: 'row', gap: space.sm },
  birthPart: { flex: 2 },
  birthYear: { flex: 3 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3 },
  roles: { gap: space.sm },
  roleCard: { borderWidth: 1, borderRadius: radius.lg, padding: space.md, gap: space.xs },
  roleName: { fontSize: 18, lineHeight: 24 },
  code: { fontSize: 22, letterSpacing: 6, fontVariant: ['tabular-nums'] },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  link: { minHeight: 44, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
  signOut: { minHeight: 44, justifyContent: 'center', alignSelf: 'center', marginTop: space.md },
})

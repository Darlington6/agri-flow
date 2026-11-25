import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Button, Card, CardButton, inputClass, ProgressBar } from '@/components/ui'
// Imported directly, not from the ui index, so the phone library only downloads with the pages that use it.
import { PhoneInput } from '@/components/ui/PhoneInput'
import { usePhoneField } from '@/components/ui/usePhoneField'
import { countryOptions, formatPhone, guessCountry } from '@/lib/phone'
import {
  ApiError,
  type Language,
  type OnboardingStep,
  type RoleDetails,
  type SelfServeRole,
  type SetupOptions,
} from '@/lib/apiClient'
import { LANGUAGES, ROLE_ORDER, ROLES, SITE_URL, STEP_TITLES, guessLanguage, whoCanReachYou } from '@/lib/onboarding'
import { ErrorText, LabelledField } from './fields'
import { RoleDetailsForm } from './RoleDetailsForm'
import { ROLE_ICONS } from './roleIcons'

/**
 * Where the flow reads from and saves to. The real one talks to the API (see
 * WelcomePage); the demo's walkthrough saves nothing. Each save may throw an
 * ApiError, shown on the step.
 */
export interface OnboardingDriver {
  start: {
    name: string
    country: string
    language: Language | ''
    /** Roles the account already has (not offered again). */
    roles: SelfServeRole[]
    /** Staff accounts have their roles already and skip that step. */
    staff: boolean
    hasPhone: boolean
    /** Already set up: only here to agree to new terms. */
    returning: boolean
    /** Where to pick up: the first step not done yet. */
    next: OnboardingStep | null
    termsVersion: string
  }
  loadOptions: (country: string) => Promise<SetupOptions>
  saveName: (name: string) => Promise<void>
  savePlace: (country: string, language: Language) => Promise<void>
  chooseRole: <R extends SelfServeRole>(role: R, details: RoleDetails[R]) => Promise<void>
  /** debugCode: the API's, in local development only. demoCode: the demo's (no text is sent). */
  requestPhoneCode: (phone: string) => Promise<{ debugCode?: string; demoCode?: string }>
  confirmPhone: (phone: string, code: string) => Promise<void>
  skipPhone: () => Promise<void>
  finish: (termsVersion: string) => Promise<void>
}

function message(err: unknown) {
  return err instanceof ApiError ? err.message : 'Something went wrong. Try again.'
}

/** Runs a save, keeping track of busy and error, and moves on if it worked. */
function useSave() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function run(save: () => Promise<void>, then: () => void) {
    setBusy(true)
    setError(null)
    try {
      await save()
      then()
    } catch (err) {
      setError(message(err))
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, run }
}

/**
 * Setting up an account, one question per screen: name, place, role (and its
 * details), phone (skippable) and the terms. Each step saves as it goes, so
 * leaving and coming back picks up where they stopped. `onDone` runs after
 * the terms are agreed.
 */
export function OnboardingFlow({
  driver,
  onDone,
  intro,
}: {
  driver: OnboardingDriver
  onDone: () => void
  /** Shown above the card, e.g. the demo's "nothing is saved" note. */
  intro?: ReactNode
}) {
  const { start } = driver
  // Steps this person sees: no phone step if they signed up with one, no
  // role step for staff, and only the terms for someone already set up.
  const steps = useMemo(
    () =>
      start.returning
        ? (['terms'] as OnboardingStep[])
        : (['name', 'place', 'role', 'phone', 'terms'] as OnboardingStep[]).filter(
            (s) => !(s === 'phone' && start.hasPhone) && !(s === 'role' && start.staff),
          ),
    [start.hasPhone, start.staff, start.returning],
  )
  const [index, setIndex] = useState(() => Math.max(0, steps.indexOf(start.next ?? 'terms')))
  const step = steps[index]

  // What's been entered, kept here so going back shows it.
  const [name, setName] = useState(start.name)
  const [country, setCountry] = useState(start.country || guessCountry())
  const [language, setLanguage] = useState<Language>(start.language || guessLanguage())
  const [roles, setRoles] = useState<SelfServeRole[]>(start.roles)
  // The role being described on the role step, so the heading can match it.
  const [picked, setPicked] = useState<SelfServeRole | null>(null)

  // Move focus to the new step's heading, so screen readers announce it and
  // keyboard users start at the top of it. Not on first load: the page's own
  // heading comes first.
  const heading = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)
  useEffect(() => {
    if (moved.current) heading.current?.focus()
    moved.current = true
  }, [step])

  const next = () => setIndex((i) => Math.min(i + 1, steps.length - 1))
  const back = index > 0 ? () => setIndex((i) => i - 1) : undefined

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {intro}
      {steps.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-ink-600">
            Step {index + 1} of {steps.length}
          </p>
          <ProgressBar value={((index + 1) / steps.length) * 100} />
        </div>
      )}
      <Card className="w-full">
        <h2 ref={heading} tabIndex={-1} className="font-display text-xl font-semibold text-ink-900 outline-none">
          {start.returning
            ? 'Our terms have changed'
            : step === 'role' && picked
              ? ROLE_DETAILS_TITLES[picked]
              : STEP_TITLES[step]}
        </h2>
        <div className="mt-4">
          {step === 'name' && (
            <NameStep name={name} setName={setName} save={() => driver.saveName(name.trim())} onSaved={next} />
          )}
          {step === 'place' && (
            <PlaceStep
              country={country}
              setCountry={setCountry}
              language={language}
              setLanguage={setLanguage}
              save={() => driver.savePlace(country, language)}
              onSaved={next}
              back={back}
            />
          )}
          {step === 'role' && (
            <RoleStep
              driver={driver}
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
              back={back}
            />
          )}
          {step === 'phone' && <PhoneStep driver={driver} country={country} roles={roles} onDone={next} back={back} />}
          {step === 'terms' && <TermsStep driver={driver} onDone={onDone} back={back} />}
        </div>
      </Card>
    </div>
  )
}

const ROLE_DETAILS_TITLES: Record<SelfServeRole, string> = {
  farmer: 'About your farm',
  buyer: 'About your business',
  cooperative: 'About your cooperative',
  delivery_partner: 'About your deliveries',
}

function BackButton({ onClick }: { onClick?: () => void }) {
  if (!onClick) return null
  return (
    <Button type="button" variant="ghost" onClick={onClick}>
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Back
    </Button>
  )
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>
}

function NameStep({
  name,
  setName,
  save,
  onSaved,
}: {
  name: string
  setName: (name: string) => void
  save: () => Promise<void>
  onSaved: () => void
}) {
  const { busy, error, run } = useSave()
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        void run(save, onSaved)
      }}
    >
      <LabelledField label="Your name" hint="Buyers, farmers and our team will see this.">
        {(props) => (
          <input
            {...props}
            className={inputClass}
            required
            maxLength={150}
            autoComplete="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
      </LabelledField>
      <ErrorText messages={error ? [error] : undefined} />
      <Actions>
        <Button type="submit" disabled={busy || !name.trim()}>
          {busy ? 'Saving…' : 'Continue'}
        </Button>
      </Actions>
    </form>
  )
}

function PlaceStep({
  country,
  setCountry,
  language,
  setLanguage,
  save,
  onSaved,
  back,
}: {
  country: string
  setCountry: (country: string) => void
  language: Language
  setLanguage: (language: Language) => void
  save: () => Promise<void>
  onSaved: () => void
  back?: () => void
}) {
  const { busy, error, run } = useSave()
  const countries = useMemo(() => countryOptions(navigator.language), [])
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        void run(save, onSaved)
      }}
    >
      <LabelledField label="Country" hint="We use it for your currency and the places you can choose.">
        {(props) => (
          <select
            {...props}
            className={inputClass}
            required
            autoComplete="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </LabelledField>
      <fieldset>
        <legend className="mb-2 text-xs font-medium text-ink-600">Language</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LANGUAGES.map((l) => (
            <label
              key={l.code}
              lang={l.code === 'tw' ? 'ak' : l.code}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-ink-200 px-3 text-sm text-ink-800 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-500"
            >
              <input
                type="radio"
                name="language"
                className="accent-primary-600"
                value={l.code}
                checked={language === l.code}
                onChange={() => setLanguage(l.code)}
              />
              {l.name}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-500">
          AgriFlow is in English for now. We'll switch to your language as translations arrive.
        </p>
      </fieldset>
      <ErrorText messages={error ? [error] : undefined} />
      <Actions>
        <BackButton onClick={back} />
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Continue'}
        </Button>
      </Actions>
    </form>
  )
}

/** Choose a role, then give its details. Roles they already have aren't offered again. */
export function RoleStep({
  driver,
  country,
  held,
  onChosen,
  picked: controlledPick,
  onPick,
  onContinue,
  back,
}: {
  driver: Pick<OnboardingDriver, 'loadOptions' | 'chooseRole'>
  country: string
  held: SelfServeRole[]
  onChosen: (role: SelfServeRole) => void
  /** The role being described; kept by the caller when it wants to know (e.g. for a heading). */
  picked?: SelfServeRole | null
  onPick?: (role: SelfServeRole | null) => void
  /** When they already have a role and carry on without adding one. */
  onContinue?: () => void
  back?: () => void
}) {
  const [ownPick, setOwnPick] = useState<SelfServeRole | null>(null)
  const picked = onPick ? (controlledPick ?? null) : ownPick
  const setPicked = onPick ?? setOwnPick
  const [options, setOptions] = useState<SetupOptions | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    driver
      .loadOptions(country)
      .then((o) => current && setOptions(o))
      .catch((err) => current && setLoadError(message(err)))
    return () => {
      current = false
    }
    // Reload only when the country changes, or they ask to try again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, attempt])

  // Already chose (e.g. came back a step): say so and carry on.
  if (held.length && onContinue && !picked) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-700">
          You're set up as {held.map((r) => ROLES[r].label.toLowerCase()).join(' and ')}. You can add another role later
          from your account.
        </p>
        <Actions>
          <BackButton onClick={back} />
          <Button type="button" onClick={onContinue}>
            Continue
          </Button>
        </Actions>
      </div>
    )
  }

  if (picked) {
    if (loadError) {
      return (
        <div className="flex flex-col gap-3">
          <ErrorText messages={[loadError]} />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setLoadError(null)
              setAttempt((a) => a + 1)
            }}
          >
            Try again
          </Button>
        </div>
      )
    }
    if (!options) return <p className="text-sm text-ink-600">Loading…</p>
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-600">
          A few details about you as a {ROLES[picked].label.toLowerCase()}. You can change them later.
        </p>
        <RoleDetailsForm
          key={picked}
          role={picked}
          options={options}
          submitLabel="Continue"
          onSubmit={async (details) => {
            await driver.chooseRole(picked, details)
            onChosen(picked)
          }}
          secondary={<BackButton onClick={() => setPicked(null)} />}
        />
      </div>
    )
  }

  const offered = ROLE_ORDER.filter((r) => !held.includes(r))
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-600">Choose the one that fits best. You can add another later.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {offered.map((role) => {
          const Icon = ROLE_ICONS[role]
          return (
            <li key={role} className="flex">
              <CardButton className="!p-4" onClick={() => setPicked(role)}>
                <Icon className="h-6 w-6 text-accent" aria-hidden />
                <span className="mt-3 block font-display text-base font-semibold text-ink-900">
                  {ROLES[role].label}
                </span>
                <span className="mt-1 block text-sm text-ink-600">{ROLES[role].blurb}</span>
              </CardButton>
            </li>
          )
        })}
      </ul>
      {back && (
        <Actions>
          <BackButton onClick={back} />
        </Actions>
      )}
    </div>
  )
}

function PhoneStep({
  driver,
  country,
  roles,
  onDone,
  back,
}: {
  driver: OnboardingDriver
  country: string
  /** The roles chosen on the step before, so the reason fits them. */
  roles: readonly string[]
  onDone: () => void
  back?: () => void
}) {
  const phone = usePhoneField(country)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [debugCode, setDebugCode] = useState<string | null>(null)
  const [demoCode, setDemoCode] = useState<string | null>(null)
  const { busy, error, run } = useSave()

  if (sentTo) {
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          void run(() => driver.confirmPhone(sentTo, code), onDone)
        }}
      >
        <p className="text-sm text-ink-600">
          {demoCode ? 'For real, we would text' : "We've texted"} a 6-digit code to {formatPhone(sentTo)}.
        </p>
        {demoCode && (
          <p className="rounded-lg bg-status-info-bg px-3 py-2 text-xs text-status-info">
            This is the demo, so no text was sent. Enter {demoCode}.
          </p>
        )}
        {debugCode && (
          <p className="rounded-lg bg-status-info-bg px-3 py-2 text-xs text-status-info">
            Dev mode — code is {debugCode} (never shown outside DEBUG).
          </p>
        )}
        <LabelledField label="6-digit code">
          {(props) => (
            <input
              {...props}
              className={inputClass}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          )}
        </LabelledField>
        <ErrorText messages={error ? [error] : undefined} />
        <Actions>
          <Button type="button" variant="ghost" onClick={() => setSentTo(null)}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Use a different number
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Checking…' : 'Confirm'}
          </Button>
        </Actions>
      </form>
    )
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        const number = phone.value
        void run(
          async () => {
            const { debugCode, demoCode } = await driver.requestPhoneCode(number)
            setDebugCode(debugCode ?? null)
            setDemoCode(demoCode ?? null)
          },
          () => setSentTo(number),
        )
      }}
    >
      <p className="text-sm text-ink-600">
        So {whoCanReachYou(roles)} can reach you, and you can sign in with a text message. We'll text a code to check
        it's yours.
      </p>
      <PhoneInput field={phone} />
      <ErrorText messages={error ? [error] : undefined} />
      <Actions>
        <BackButton onClick={back} />
        <Button type="button" variant="outline" disabled={busy} onClick={() => void run(driver.skipPhone, onDone)}>
          Skip for now
        </Button>
        <Button type="submit" disabled={busy || !phone.value}>
          {busy ? 'Sending…' : 'Send code'}
        </Button>
      </Actions>
    </form>
  )
}

function TermsStep({ driver, onDone, back }: { driver: OnboardingDriver; onDone: () => void; back?: () => void }) {
  const [agreed, setAgreed] = useState(false)
  const { busy, error, run } = useSave()
  const link = 'inline-flex items-center gap-0.5 font-medium text-primary-700 underline-offset-4 hover:underline'
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        void run(() => driver.finish(driver.start.termsVersion), onDone)
      }}
    >
      <p className="text-sm text-ink-600">Please read how AgriFlow works and how we look after your information.</p>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-200 p-3 text-sm text-ink-800 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-500">
        <input
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary-600"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <span>
          I agree to the{' '}
          <a href={`${SITE_URL}/terms`} target="_blank" rel="noreferrer" className={link}>
            terms of use
            <ExternalLink className="h-3 w-3" aria-label="(opens in a new tab)" />
          </a>{' '}
          and have read the{' '}
          <a href={`${SITE_URL}/privacy`} target="_blank" rel="noreferrer" className={link}>
            privacy notice
            <ExternalLink className="h-3 w-3" aria-label="(opens in a new tab)" />
          </a>
          .
        </span>
      </label>
      <ErrorText messages={error ? [error] : undefined} />
      <Actions>
        <BackButton onClick={back} />
        <Button type="submit" disabled={busy || !agreed}>
          {busy ? 'Finishing…' : 'Finish'}
        </Button>
      </Actions>
    </form>
  )
}

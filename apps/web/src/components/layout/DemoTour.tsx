import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { useSession } from '@/context/SessionContext'
import { navForRole } from './navigation'
import { TOUR_INTRO, TOUR_STOPS, tourHint } from '@/lib/demoTour'

/**
 * The demo's first-visit tour: three short steps in a real dialog (focus
 * stays inside, Escape closes it, the page behind is inert), sized for
 * phones as well as desktops.
 */
export function DemoTour({ onClose }: { onClose: () => void }) {
  const { session } = useSession()
  const dialog = useRef<HTMLDialogElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    // Browsers without showModal (and test environments) still show it, just not modally.
    if (typeof el.showModal === 'function') el.showModal()
    else el.setAttribute('open', '')
    return () => {
      if (typeof el.close === 'function') el.close()
    }
  }, [])

  // Each new step starts at its heading, for screen readers and keyboards.
  useEffect(() => {
    heading.current?.focus()
  }, [step])

  if (!session) return null
  const role = session.role
  const nav = navForRole(role)
  const stops = TOUR_STOPS[role].map((key) => nav.find((item) => item.key === key)).filter((item) => item !== undefined)

  const steps = [
    {
      title: `Welcome to the demo, ${session.name}`,
      body: (
        <>
          <p>{TOUR_INTRO[role]}</p>
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-ink-50 p-3 text-xs text-ink-700">
            <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Everything here is sample data. Try anything: your changes are cleared when you reload.
          </p>
        </>
      ),
    },
    {
      title: 'Where to start',
      body: (
        <ul className="flex flex-col gap-3">
          {stops.map(({ key, label, icon: Icon }) => (
            <li key={key} className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-accent">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span>
                <span className="block font-medium text-ink-900">{label}</span>
                <span className="block text-ink-600">{tourHint(role, key)}</span>
              </span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      title: 'See it from another seat',
      body: (
        <>
          <p>
            The same story looks different from each role. Choose <strong>Switch role</strong> under your name in the
            top corner to try another.
          </p>
          <p className="mt-3">
            Want to see how a real account starts?{' '}
            <Link to="/try-sign-up" onClick={onClose} className="font-medium text-primary-700 hover:underline">
              Walk through signing up
            </Link>
            .
          </p>
        </>
      ),
    },
  ]
  const last = step === steps.length - 1

  return (
    <dialog
      ref={dialog}
      aria-labelledby="demo-tour-title"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-surface p-0 text-ink-800 shadow-[var(--shadow-card-hover)] backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium text-ink-600">
            {step + 1} of {steps.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="-mt-1 -mr-1 rounded-lg p-1.5 text-ink-500 hover:bg-ink-50 hover:text-ink-700 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
            aria-label="Close the tour"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <h2
          id="demo-tour-title"
          ref={heading}
          tabIndex={-1}
          className="font-display text-xl font-semibold text-ink-900 outline-none"
        >
          {steps[step].title}
        </h2>
        <div className="text-sm text-ink-700">{steps[step].body}</div>
        <div className="mt-2 flex items-center justify-between gap-2">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={onClose}>
              Skip
            </Button>
          )}
          <Button type="button" onClick={last ? onClose : () => setStep((s) => s + 1)}>
            {last ? 'Start exploring' : 'Next'}
            {!last && <ArrowRight className="h-4 w-4" aria-hidden />}
          </Button>
        </div>
      </div>
    </dialog>
  )
}

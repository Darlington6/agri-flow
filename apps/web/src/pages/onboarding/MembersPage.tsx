import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Phone, X } from 'lucide-react'
import { AccountShell } from '@/components/layout/AccountShell'
import { PageLoading } from '@/components/layout/PageLoading'
import { RequireAccount } from '@/components/layout/RequireAccount'
import { Button, buttonClasses, Card } from '@/components/ui'
import {
  ApiError,
  decideMembership,
  getCooperativeMembers,
  type CooperativeMembers,
  type Member,
} from '@/lib/apiClient'
import { formatPhone } from '@/lib/phone'

/**
 * A cooperative's members (/members), for the person who manages it:
 * farmers who chose the cooperative wait here until the manager confirms
 * them (or declines). Only confirmed members count.
 */
export function MembersPage() {
  return (
    <RequireAccount>
      <Members />
    </RequireAccount>
  )
}

function Members() {
  const [data, setData] = useState<CooperativeMembers | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    getCooperativeMembers()
      .then((d) => current && setData(d))
      .catch((err) => current && setError(err instanceof ApiError ? err.message : "Couldn't load your members."))
    return () => {
      current = false
    }
  }, [attempt])

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

  return (
    <AccountShell title={data ? `${data.cooperative.name} members` : 'Members'}>
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <Link to="/home" className={`${buttonClasses('ghost', 'md')} self-start`}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Home
        </Link>
        {error ? (
          <Card className="text-center">
            <p role="alert" className="text-sm text-status-risk">
              {error}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setError(null)
                setAttempt((a) => a + 1)
              }}
            >
              Try again
            </Button>
          </Card>
        ) : !data ? (
          <PageLoading />
        ) : (
          <>
            <Card>
              <h2 className="font-display text-lg font-semibold text-ink-900">Waiting for you ({waiting.length})</h2>
              {waiting.length ? (
                <>
                  <p className="mt-1 text-sm text-ink-600">
                    These farmers chose your cooperative. Confirm the ones who are members; they only count once you do.
                  </p>
                  <ul className="mt-4 flex flex-col divide-y divide-ink-100">
                    {waiting.map((m) => (
                      <MemberRow key={m.id} member={m} onDecided={decided} />
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-1 text-sm text-ink-600">Nobody is waiting. New requests will show here.</p>
              )}
            </Card>
            <Card>
              <h2 className="font-display text-lg font-semibold text-ink-900">Members ({confirmed.length})</h2>
              {confirmed.length ? (
                <ul className="mt-4 flex flex-col divide-y divide-ink-100">
                  {confirmed.map((m) => (
                    <MemberRow key={m.id} member={m} onDecided={decided} />
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-ink-600">
                  No members on AgriFlow yet. Ask your farmers to choose your cooperative when they sign up.
                </p>
              )}
            </Card>
          </>
        )}
      </div>
    </AccountShell>
  )
}

function MemberRow({ member, onDecided }: { member: Member; onDecided: (m: Member) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { farmer } = member
  const place = [farmer.district, farmer.region].filter(Boolean).join(', ')

  async function decide(status: 'confirmed' | 'declined') {
    setBusy(true)
    setError(null)
    try {
      onDecided(await decideMembership(member.id, status))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-ink-900">{farmer.name || 'A farmer'}</p>
        <p className="text-sm text-ink-600">{[place, farmer.crops.join(', ')].filter(Boolean).join(' · ')}</p>
        {farmer.phone_number && (
          <a
            href={`tel:${farmer.phone_number}`}
            className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary-700 underline-offset-4 hover:underline"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            {formatPhone(farmer.phone_number)}
          </a>
        )}
        {error && (
          <p role="alert" className="mt-1 text-xs text-status-risk">
            {error}
          </p>
        )}
      </div>
      {member.status === 'pending' ? (
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void decide('declined')}
            aria-label={`Decline ${farmer.name || 'this farmer'}`}
          >
            <X className="h-4 w-4" aria-hidden />
            Decline
          </Button>
          <Button
            disabled={busy}
            onClick={() => void decide('confirmed')}
            aria-label={`Confirm ${farmer.name || 'this farmer'}`}
          >
            <Check className="h-4 w-4" aria-hidden />
            Confirm
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => void decide('declined')}
          aria-label={`Remove ${farmer.name || 'this farmer'}`}
        >
          Remove
        </Button>
      )}
    </li>
  )
}

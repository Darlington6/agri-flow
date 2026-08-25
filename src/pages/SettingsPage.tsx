import { useState } from 'react'
import { Building2, Bell, Info, LogOut, ShieldCheck, MessageCircle } from 'lucide-react'
import { useSession } from '@/context/SessionContext'
import { usePlatformData, resolveKycStatus } from '@/context/PlatformDataContext'
import { brand } from '@/config/brand'
import { PageHeader, Card, Field, inputClass, Button, KycBadge, Badge } from '@/components/ui'
import { farmerById, buyerById, farmers, buyers } from '@/data'
import { isAdminRole } from '@/lib/permissions'

const TOGGLES = [
  { key: 'riskAlerts', label: 'Risk alerts', desc: 'Contract shortfall and climate risk notifications' },
  { key: 'harvestReminders', label: 'Harvest reminders', desc: 'Upcoming harvest and post-harvest capacity alerts' },
  { key: 'paymentUpdates', label: 'Payment updates', desc: 'Farmer and buyer payment status changes' },
]

const CONTACT_PREFS = ['Chat', 'Call', 'Either'] as const

export function SettingsPage() {
  const { session, logout } = useSession()
  const { kycOverrides, setKycStatus } = usePlatformData()
  const [orgName, setOrgName] = useState(`${brand.name} — ${session?.role ?? 'Pilot'} Workspace`)
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    riskAlerts: true,
    harvestReminders: true,
    paymentUpdates: false,
  })
  const [contactPref, setContactPref] = useState<(typeof CONTACT_PREFS)[number]>('Either')

  const myEntity =
    session?.role === 'Farmer' && session.farmerId
      ? { id: session.farmerId, kind: 'Farmer' as const, base: farmerById(session.farmerId) }
      : session?.role === 'Buyer' && session.buyerId
        ? { id: session.buyerId, kind: 'Buyer' as const, base: buyerById(session.buyerId) }
        : null
  const myKycStatus = myEntity?.base ? resolveKycStatus(myEntity.base.kycStatus, myEntity.id, kycOverrides) : null

  const pendingFarmers = farmers.filter((f) => resolveKycStatus(f.kycStatus, f.id, kycOverrides) === 'Pending')
  const pendingBuyers = buyers.filter((b) => resolveKycStatus(b.kycStatus, b.id, kycOverrides) === 'Pending')

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader title="Settings" subtitle="Organization details and preferences for this workspace." />

      <Card>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-ink-500" />
          <h2 className="font-display text-sm font-semibold text-ink-700">Organization</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Workspace name">
            <input className={inputClass} value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </Field>
          <Field label="Country">
            <input className={inputClass} value={brand.country} disabled />
          </Field>
          <Field label="Signed in as">
            <input className={inputClass} value={session?.name ?? ''} disabled />
          </Field>
          <Field label="Role">
            <input className={inputClass} value={session?.role ?? ''} disabled />
          </Field>
        </div>
      </Card>

      {myEntity?.base && myKycStatus && (
        <Card>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-ink-500" />
            <h2 className="font-display text-sm font-semibold text-ink-700">Verification (KYC)</h2>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-ink-700">Your account verification status</p>
              <p className="text-xs text-ink-400">Verified accounts unlock contract matching and financing features.</p>
            </div>
            <KycBadge status={myKycStatus} />
          </div>
          {myKycStatus === 'Unverified' && (
            <Button size="sm" className="mt-4" onClick={() => setKycStatus(myEntity.id, 'Pending')}>
              Submit documents for verification
            </Button>
          )}
          {myKycStatus === 'Pending' && (
            <p className="mt-4 rounded-lg bg-status-warn-bg px-3 py-2 text-xs text-status-warn">
              Your documents are under review. This usually takes 1–2 business days in a real deployment.
            </p>
          )}
        </Card>
      )}

      {isAdminRole(session?.role) && (pendingFarmers.length > 0 || pendingBuyers.length > 0) && (
        <Card>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-ink-500" />
            <h2 className="font-display text-sm font-semibold text-ink-700">Verification Queue</h2>
          </div>
          <div className="mt-4 flex flex-col divide-y divide-ink-50">
            {[...pendingFarmers.map((f) => ({ id: f.id, name: f.name, kind: 'Farmer' })), ...pendingBuyers.map((b) => ({ id: b.id, name: b.name, kind: 'Buyer' }))].map(
              (entity) => (
                <div key={entity.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-ink-800">{entity.name}</p>
                    <Badge tone="neutral">{entity.kind}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setKycStatus(entity.id, 'Verified')}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setKycStatus(entity.id, 'Unverified')}>
                      Reject
                    </Button>
                  </div>
                </div>
              ),
            )}
          </div>
        </Card>
      )}

      {(session?.role === 'Buyer' || session?.role === 'Farmer') && (
        <Card>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-ink-500" />
            <h2 className="font-display text-sm font-semibold text-ink-700">Contact preference</h2>
          </div>
          <p className="mt-1 text-xs text-ink-500">How contracted counterparties should reach you.</p>
          <div className="mt-3 flex gap-2">
            {CONTACT_PREFS.map((pref) => (
              <button
                key={pref}
                onClick={() => setContactPref(pref)}
                className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
                  contactPref === pref ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-ink-500" />
          <h2 className="font-display text-sm font-semibold text-ink-700">Notification preferences</h2>
        </div>
        <div className="mt-4 flex flex-col divide-y divide-ink-50">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-ink-800">{t.label}</p>
                <p className="text-xs text-ink-500">{t.desc}</p>
              </div>
              <button
                onClick={() => setToggles((prev) => ({ ...prev, [t.key]: !prev[t.key] }))}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${toggles[t.key] ? 'bg-brand-700' : 'bg-ink-200'}`}
                aria-pressed={toggles[t.key]}
                aria-label={t.label}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    toggles[t.key] ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-ink-500" />
          <h2 className="font-display text-sm font-semibold text-ink-700">About this environment</h2>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink-500">
          {brand.name} is running in {brand.environmentLabel} mode. All farmers, buyers, contracts and financial
          figures shown are simulated demonstration data for prototype review — no production data or live
          integrations are connected.
        </p>
      </Card>

      <div>
        <Button variant="outline" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Switch demo role
        </Button>
      </div>
    </div>
  )
}

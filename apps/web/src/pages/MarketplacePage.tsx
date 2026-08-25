import { useState } from 'react'
import { Plus, MapPin, Sprout, Wrench, Recycle, CheckCircle2 } from 'lucide-react'
import { PageHeader, Card, Badge, Button } from '@/components/ui'
import { useSession } from '@/context/SessionContext'
import { usePlatformData } from '@/context/PlatformDataContext'
import { cropById } from '@/data'
import { isAdminRole } from '@/lib/permissions'
import { formatDate } from '@/lib/date'
import type { ListingCategory, ListingStatus } from '@/types'
import { NewListingModal } from './marketplace/NewListingModal'

const CATEGORIES: { key: ListingCategory; label: string; icon: typeof Sprout; blurb: string }[] = [
  { key: 'Produce Surplus', label: 'Produce Surplus', icon: Sprout, blurb: 'Above-contract harvest, sold in small batches instead of going to waste.' },
  { key: 'Farm Inputs', label: 'Farm Inputs', icon: Wrench, blurb: 'Seeds, seedlings, fertilizer and equipment available to network farmers.' },
  { key: 'Farm Residue', label: 'Farm Residue', icon: Recycle, blurb: 'Crop residue available to composters and feed processors.' },
]

const STATUS_TONE: Record<ListingStatus, 'good' | 'warn' | 'neutral'> = {
  Available: 'good',
  Reserved: 'warn',
  Sold: 'neutral',
}

export function MarketplacePage() {
  const { session } = useSession()
  const { listings, createListing } = usePlatformData()
  const [category, setCategory] = useState<ListingCategory>('Produce Surplus')
  const [modalOpen, setModalOpen] = useState(false)
  const [interested, setInterested] = useState<Set<string>>(new Set())

  const canPost = isAdminRole(session?.role) || session?.role === 'Farmer'
  const sellerId = session?.role === 'Farmer' ? (session.farmerId ?? 'platform') : 'platform'
  const sellerName = session?.role === 'Farmer' ? (session.name ?? 'Farmer') : 'AgriFlow Input Partners'

  const filtered = listings.filter((l) => l.category === category)
  const activeCategory = CATEGORIES.find((c) => c.key === category)!

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Marketplace"
        subtitle="Surplus produce, farm inputs and farm residue — outside the contracted-demand pipeline."
        actions={
          canPost ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              New Listing
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              category === c.key ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-ink-200 text-ink-600 hover:bg-ink-50'
            }`}
          >
            <c.icon className="h-4 w-4" />
            {c.label}
            <span className="text-xs text-ink-400">({listings.filter((l) => l.category === c.key).length})</span>
          </button>
        ))}
      </div>
      <p className="-mt-3 text-xs text-ink-500">{activeCategory.blurb}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((l) => (
          <Card key={l.id}>
            <div className="flex items-start justify-between gap-2">
              <Badge tone="neutral">{l.cropId ? cropById(l.cropId)?.name : l.category}</Badge>
              <Badge tone={STATUS_TONE[l.status]}>{l.status}</Badge>
            </div>
            <p className="mt-3 font-display text-sm font-semibold text-ink-900">{l.title}</p>
            <p className="mt-1 text-xs text-ink-500">{l.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-y-1.5 text-xs">
              <dt className="text-ink-400">Quantity</dt>
              <dd className="text-right text-ink-700">{l.quantity} {l.unit}</dd>
              <dt className="text-ink-400">Price</dt>
              <dd className="text-right text-ink-700">GHS {l.pricePerUnitGHS.toLocaleString()}/{l.unit}</dd>
              <dt className="text-ink-400">Seller</dt>
              <dd className="text-right text-ink-700">{l.sellerName}</dd>
              <dt className="text-ink-400">Posted</dt>
              <dd className="text-right text-ink-700">{formatDate(l.postedAt)}</dd>
            </dl>
            <p className="mt-3 flex items-center gap-1 text-xs text-ink-400">
              <MapPin className="h-3 w-3" />
              {l.location}
            </p>
            {l.status === 'Available' && (
              <Button
                size="sm"
                variant="outline"
                className="mt-4 w-full"
                disabled={interested.has(l.id)}
                onClick={() => setInterested((prev) => new Set(prev).add(l.id))}
              >
                {interested.has(l.id) ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Interest sent
                  </>
                ) : (
                  'Express Interest'
                )}
              </Button>
            )}
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-sm text-ink-400">No listings in this category yet.</p>}
      </div>

      {modalOpen && (
        <NewListingModal
          sellerId={sellerId}
          sellerName={sellerName}
          defaultCategory={category}
          onClose={() => setModalOpen(false)}
          onCreate={(listing) => {
            createListing(listing)
            setModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

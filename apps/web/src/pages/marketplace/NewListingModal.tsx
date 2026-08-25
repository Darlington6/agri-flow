import { useState, type FormEvent } from 'react'
import { Modal, Field, inputClass, Button } from '@/components/ui'
import { crops } from '@/data'
import type { ListingCategory, ListingUnit, MarketplaceListing } from '@/types'

const CATEGORIES: ListingCategory[] = ['Produce Surplus', 'Farm Inputs', 'Farm Residue']
const UNITS: ListingUnit[] = ['tonnes', 'kg', 'bags', 'litres', 'units']

export function NewListingModal({
  sellerId,
  sellerName,
  defaultCategory,
  onClose,
  onCreate,
}: {
  sellerId: string
  sellerName: string
  defaultCategory?: ListingCategory
  onClose: () => void
  onCreate: (listing: MarketplaceListing) => void
}) {
  const [category, setCategory] = useState<ListingCategory>(defaultCategory ?? 'Produce Surplus')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cropId, setCropId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState<ListingUnit>('tonnes')
  const [price, setPrice] = useState('1000')
  const [location, setLocation] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onCreate({
      id: `ML-${Math.floor(100 + Math.random() * 900)}`,
      category,
      title: title.trim(),
      description: description.trim() || 'No additional description provided.',
      sellerId,
      sellerName,
      cropId: cropId ? (cropId as MarketplaceListing['cropId']) : undefined,
      quantity: Number(quantity) || 0,
      unit,
      pricePerUnitGHS: Number(price) || 0,
      location: location || 'Not specified',
      status: 'Available',
      postedAt: new Date().toISOString().slice(0, 10),
    })
  }

  return (
    <Modal title="New Marketplace Listing" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Category">
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as ListingCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Title">
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Surplus Grade A tomatoes — 1 tonne"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Related crop (optional)">
            <select className={inputClass} value={cropId} onChange={(e) => setCropId(e.target.value)}>
              <option value="">None</option>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Techiman, Bono" />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Quantity">
            <input type="number" min="0" step="0.1" className={inputClass} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </Field>
          <Field label="Unit">
            <select className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value as ListingUnit)}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price / unit (GHS)">
            <input type="number" min="0" step="0.1" className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            className={inputClass}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Condition, availability, pickup details…"
          />
        </Field>

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Post Listing</Button>
        </div>
      </form>
    </Modal>
  )
}

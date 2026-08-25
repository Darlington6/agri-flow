import { useState, type FormEvent } from 'react'
import { Modal, Field, inputClass, Button } from '@/components/ui'
import { buyers, crops } from '@/data'
import type { DemandFrequency, DemandRequest, QualityGrade } from '@/types'

const GRADES: QualityGrade[] = ['Grade A', 'Grade B', 'Export Grade']
const FREQUENCIES: DemandFrequency[] = ['One-time', 'Weekly', 'Bi-weekly', 'Monthly']

export function NewDemandRequestModal({
  onClose,
  onCreate,
  lockedBuyerId,
}: {
  onClose: () => void
  onCreate: (demand: DemandRequest) => void
  lockedBuyerId?: string
}) {
  const [buyerId, setBuyerId] = useState(lockedBuyerId ?? buyers[0].id)
  const [cropId, setCropId] = useState(crops[0].id)
  const [quantity, setQuantity] = useState('10')
  const [grade, setGrade] = useState<QualityGrade>('Grade A')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [location, setLocation] = useState('')
  const [price, setPrice] = useState('4000')
  const [frequency, setFrequency] = useState<DemandFrequency>('One-time')
  const [requirements, setRequirements] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const demand: DemandRequest = {
      id: `DR-${Math.floor(2000 + Math.random() * 900)}`,
      buyerId,
      cropId,
      quantityTonnes: Number(quantity) || 0,
      contractedTonnes: 0,
      qualityGrade: grade,
      requiredDeliveryDate: deliveryDate || '2026-12-01',
      deliveryLocation: location || 'Accra',
      targetPriceGHSPerTonne: Number(price) || 0,
      frequency,
      specialRequirements: requirements || undefined,
      status: 'Open',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    onCreate(demand)
  }

  return (
    <Modal title="New Demand Request" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Buyer">
          <select
            className={inputClass}
            value={buyerId}
            disabled={!!lockedBuyerId}
            onChange={(e) => setBuyerId(e.target.value)}
          >
            {buyers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Crop">
            <select className={inputClass} value={cropId} onChange={(e) => setCropId(e.target.value as typeof cropId)}>
              {crops.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quantity (tonnes)">
            <input
              type="number"
              min="0"
              step="0.1"
              className={inputClass}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Quality grade">
            <select className={inputClass} value={grade} onChange={(e) => setGrade(e.target.value as QualityGrade)}>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Frequency">
            <select className={inputClass} value={frequency} onChange={(e) => setFrequency(e.target.value as DemandFrequency)}>
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Required delivery date">
            <input type="date" className={inputClass} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </Field>
          <Field label="Delivery location">
            <input type="text" placeholder="Accra" className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
        </div>

        <Field label="Target price (GHS / tonne)">
          <input type="number" min="0" className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>

        <Field label="Special requirements (optional)">
          <textarea
            className={inputClass}
            rows={2}
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="e.g. Grade A, moisture tolerance, packaging"
          />
        </Field>

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create Demand Request</Button>
        </div>
      </form>
    </Modal>
  )
}

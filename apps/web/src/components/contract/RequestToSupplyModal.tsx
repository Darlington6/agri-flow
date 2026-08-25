import { useState, type FormEvent } from 'react'
import { Modal, Field, inputClass, Button } from '@/components/ui'
import { buyerById, cropById } from '@/data'
import { formatTonnes } from '@/lib/format'
import type { Contract } from '@/types'

export function RequestToSupplyModal({
  contract,
  onClose,
  onSubmit,
}: {
  contract: Contract
  onClose: () => void
  onSubmit: (quantityTonnes: number, message: string) => void
}) {
  const remaining = Math.max(0, contract.contractedQuantityTonnes - contract.suppliedQuantityTonnes)
  const [quantity, setQuantity] = useState(String(Math.min(1, remaining) || 1))
  const [message, setMessage] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const qty = Number(quantity)
    if (!qty || qty <= 0) return
    onSubmit(qty, message)
  }

  return (
    <Modal title="Request to Supply" onClose={onClose}>
      <div className="mb-4 rounded-xl bg-ink-50 px-3 py-2.5 text-sm text-ink-700">
        {contract.id} · {cropById(contract.cropId)?.name} for {buyerById(contract.buyerId)?.name}
        <p className="mt-1 text-xs text-ink-500">{formatTonnes(remaining)} of {formatTonnes(contract.contractedQuantityTonnes)} still needed</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Quantity you can supply (tonnes)">
          <input
            type="number"
            min="0.1"
            step="0.1"
            className={inputClass}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </Field>
        <Field label="Message to buyer (optional)">
          <textarea
            className={inputClass}
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. quality grade, expected readiness date"
          />
        </Field>
        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Send Request</Button>
        </div>
      </form>
    </Modal>
  )
}

import { useState } from 'react'
import { Sprout } from 'lucide-react'
import { Card, Button } from '@/components/ui'
import { usePlatformData } from '@/context/PlatformDataContext'
import { buyerById, cropById } from '@/data'
import { formatDate } from '@/lib/date'
import { formatTonnes } from '@/lib/format'
import { RequestToSupplyModal } from './RequestToSupplyModal'
import type { Contract } from '@/types'

export function OpenOpportunities({ farmerId }: { farmerId: string }) {
  const { contracts, matchRequests, requestToSupply } = usePlatformData()
  const [target, setTarget] = useState<Contract | null>(null)
  const [justSent, setJustSent] = useState<string | null>(null)

  const myPendingContractIds = new Set(
    matchRequests.filter((m) => m.farmerId === farmerId && m.status === 'Pending').map((m) => m.contractId),
  )

  const opportunities = contracts
    .filter((c) => !c.farmerIds.includes(farmerId))
    .filter((c) => c.contractedQuantityTonnes - c.suppliedQuantityTonnes > 0)
    .filter((c) => ['Demand Created', 'Seeking Farmers', 'Partially Contracted'].includes(c.stage))
    .slice(0, 4)

  if (opportunities.length === 0) return null

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Sprout className="h-4 w-4 text-ink-500" />
        <h2 className="font-display text-sm font-semibold text-ink-700">Open Opportunities</h2>
      </div>
      <p className="mt-1 text-xs text-ink-500">Buyer demand still looking for farmers to fulfill it.</p>

      <div className="mt-4 flex flex-col divide-y divide-ink-50">
        {opportunities.map((c) => {
          const remaining = c.contractedQuantityTonnes - c.suppliedQuantityTonnes
          const pending = myPendingContractIds.has(c.id)
          return (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-ink-800">
                  {cropById(c.cropId)?.name} · {buyerById(c.buyerId)?.name}
                </p>
                <p className="text-xs text-ink-400">
                  {formatTonnes(remaining)} still needed · delivery {formatDate(c.expectedDeliveryDate)}
                </p>
              </div>
              {justSent === c.id || pending ? (
                <span className="text-xs font-medium text-status-good">Request sent</span>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setTarget(c)}>
                  Request to Supply
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {target && (
        <RequestToSupplyModal
          contract={target}
          onClose={() => setTarget(null)}
          onSubmit={(quantityTonnes, message) => {
            requestToSupply({
              farmerId,
              contractId: target.id,
              demandRequestId: target.demandRequestId,
              proposedQuantityTonnes: quantityTonnes,
              message: message || undefined,
            })
            setJustSent(target.id)
            setTarget(null)
          }}
        />
      )}
    </Card>
  )
}

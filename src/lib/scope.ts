import type { Session } from '@/context/SessionContext'
import type { Contract, DemandRequest, DeliveryJob, Farmer, GhanaRegion, HarvestForecast, Notification, Payment, ProductionCycle, Buyer } from '@/types'
import {
  contracts,
  farmers,
  demandRequests,
  harvestForecasts,
  payments,
  notifications,
  productionCycles,
  buyers,
  buyerById,
  farmerById,
  deliveryPartnerById,
} from '@/data'
import { isAdminRole } from './permissions'

// Scopes the mock dataset down to what a given demo session "owns" or is
// assigned to. Platform Admin is unscoped (sees the whole network). Buyer is
// scoped to their own buyer record. Field Agent is scoped to the regions
// they're assigned to. Farmer is scoped to their own single record. This is
// the single place that logic lives, so pages stay simple: call the scope
// function instead of importing raw data.
//
// Contracts, demand requests, production cycles and harvest forecasts can
// change at runtime (a match request gets confirmed, a new demand is
// posted) — PlatformDataContext holds the live copies. Every scope function
// below accepts that live list as an optional trailing argument and falls
// back to the static seed so callers that don't need live data (or aren't
// inside the provider) keep working unchanged.

function scopedFarmerIds(session: Session | null, liveContracts: Contract[] = contracts): Set<string> | null {
  if (!session || isAdminRole(session.role)) return null // null = unscoped
  if (session.role === 'Buyer' && session.buyerId) {
    const ids = new Set<string>()
    for (const c of liveContracts.filter((c) => c.buyerId === session.buyerId)) {
      for (const fid of c.farmerIds) ids.add(fid)
    }
    return ids
  }
  if (session.role === 'Field Agent' && session.agentRegions) {
    const regions = new Set(session.agentRegions)
    return new Set(farmers.filter((f) => regions.has(f.region)).map((f) => f.id))
  }
  if (session.role === 'Farmer' && session.farmerId) {
    return new Set([session.farmerId])
  }
  return new Set()
}

export function scopedContracts(session: Session | null, liveContracts: Contract[] = contracts): Contract[] {
  if (!session || isAdminRole(session.role)) return liveContracts
  if (session.role === 'Buyer' && session.buyerId) return liveContracts.filter((c) => c.buyerId === session.buyerId)
  if (session.role === 'Field Agent' || session.role === 'Farmer') {
    const ids = scopedFarmerIds(session, liveContracts)!
    return liveContracts.filter((c) => c.farmerIds.some((fid) => ids.has(fid)))
  }
  return []
}

export function scopedFarmers(session: Session | null, liveContracts: Contract[] = contracts): Farmer[] {
  if (!session || isAdminRole(session.role)) return farmers
  const ids = scopedFarmerIds(session, liveContracts)
  if (!ids) return farmers
  return farmers.filter((f) => ids.has(f.id))
}

export function isDemandVisible(session: Session | null, demand: DemandRequest): boolean {
  if (!session || isAdminRole(session.role)) return true
  if (session.role === 'Buyer') return demand.buyerId === session.buyerId
  return false
}

export function scopedDemandRequests(session: Session | null, liveDemandRequests: DemandRequest[] = demandRequests): DemandRequest[] {
  return liveDemandRequests.filter((d) => isDemandVisible(session, d))
}

export function scopedHarvestForecasts(
  session: Session | null,
  liveHarvestForecasts: HarvestForecast[] = harvestForecasts,
  liveContracts: Contract[] = contracts,
): HarvestForecast[] {
  if (!session || isAdminRole(session.role)) return liveHarvestForecasts
  const ids = scopedFarmerIds(session, liveContracts)
  if (!ids) return liveHarvestForecasts
  return liveHarvestForecasts.filter((h) => ids.has(h.farmerId))
}

export function scopedProductionCycles(
  session: Session | null,
  liveProductionCycles: ProductionCycle[] = productionCycles,
  liveContracts: Contract[] = contracts,
): ProductionCycle[] {
  if (!session || isAdminRole(session.role)) return liveProductionCycles
  const ids = scopedFarmerIds(session, liveContracts)
  if (!ids) return liveProductionCycles
  return liveProductionCycles.filter((p) => ids.has(p.farmerId))
}

export function scopedPayments(session: Session | null, liveContracts: Contract[] = contracts): Payment[] {
  if (!session || isAdminRole(session.role)) return payments
  if (session.role === 'Buyer' && session.buyerId) {
    const contractIds = new Set(scopedContracts(session, liveContracts).map((c) => c.id))
    return payments.filter((p) => contractIds.has(p.contractId))
  }
  if (session.role === 'Farmer' && session.farmerId) {
    return payments.filter((p) => p.counterpartyId === session.farmerId)
  }
  return []
}

export function scopedBuyers(session: Session | null): Buyer[] {
  if (!session || isAdminRole(session.role)) return buyers
  if (session.role === 'Buyer' && session.buyerId) {
    const b = buyerById(session.buyerId)
    return b ? [b] : []
  }
  return []
}

export function scopedRegions(session: Session | null, liveContracts: Contract[] = contracts): GhanaRegion[] {
  if (!session || isAdminRole(session.role)) return []
  if (session.role === 'Field Agent' && session.agentRegions) return session.agentRegions
  if (session.role === 'Buyer' || session.role === 'Farmer') {
    return Array.from(new Set(scopedFarmers(session, liveContracts).map((f) => f.region)))
  }
  return []
}

export function scopedNotifications(session: Session | null, liveContracts: Contract[] = contracts): Notification[] {
  if (!session || isAdminRole(session.role)) return notifications
  if (session.role === 'Buyer' || session.role === 'Farmer') {
    const contractIds = new Set(scopedContracts(session, liveContracts).map((c) => c.id))
    const regions = new Set(scopedRegions(session, liveContracts))
    return notifications.filter(
      (n) => (n.relatedContractId && contractIds.has(n.relatedContractId)) || n.relatedRegions?.some((r) => regions.has(r)),
    )
  }
  if (session.role === 'Field Agent' && session.agentRegions) {
    const regions = new Set(session.agentRegions)
    return notifications.filter((n) => n.relatedRegions?.some((r) => regions.has(r)))
  }
  return []
}

export function canViewFarmer(session: Session | null, farmer: Farmer, liveContracts: Contract[] = contracts): boolean {
  if (!session || isAdminRole(session.role)) return true
  if (session.role === 'Field Agent' && session.agentRegions) return session.agentRegions.includes(farmer.region)
  if (session.role === 'Buyer' || session.role === 'Farmer') return scopedFarmerIds(session, liveContracts)!.has(farmer.id)
  return false
}

export function canViewContract(session: Session | null, contract: Contract, liveContracts: Contract[] = contracts): boolean {
  if (!session || isAdminRole(session.role)) return true
  if (session.role === 'Buyer' && session.buyerId) return contract.buyerId === session.buyerId
  if (session.role === 'Field Agent' || session.role === 'Farmer') {
    const ids = scopedFarmerIds(session, liveContracts)!
    return contract.farmerIds.some((fid) => ids.has(fid))
  }
  return false
}

export function canViewBuyer(session: Session | null, buyerId: string): boolean {
  if (!session || isAdminRole(session.role)) return true
  if (session.role === 'Buyer') return session.buyerId === buyerId
  return false
}

export function currentFarmer(session: Session | null): Farmer | undefined {
  if (session?.role === 'Farmer' && session.farmerId) return farmerById(session.farmerId)
  return undefined
}

export function currentDeliveryPartner(session: Session | null) {
  if (session?.role === 'Delivery Partner' && session.deliveryPartnerId) return deliveryPartnerById(session.deliveryPartnerId)
  return undefined
}

// A Delivery Partner's own jobs (booked by them, at any status). Everyone
// else with delivery visibility (Admin/Super Admin) sees the whole board —
// the point of self-booking is that partners see the open market, not a
// pre-filtered slice of it.
export function myDeliveryJobs(session: Session | null, liveDeliveryJobs: DeliveryJob[]): DeliveryJob[] {
  if (session?.role !== 'Delivery Partner' || !session.deliveryPartnerId) return []
  return liveDeliveryJobs.filter((j) => j.partnerId === session.deliveryPartnerId)
}

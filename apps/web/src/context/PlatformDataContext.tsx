import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type {
  Contract,
  DemandRequest,
  DemandStatus,
  MatchRequest,
  ProductionCycle,
  HarvestForecast,
  MarketplaceListing,
  ListingStatus,
  DeliveryJob,
  DeliveryJobStatus,
  ChatMessage,
  KycStatus,
} from '@/types'
import {
  contracts as seedContracts,
  demandRequests as seedDemandRequests,
  productionCycles as seedProductionCycles,
  harvestForecasts as seedHarvestForecasts,
  marketplaceListings as seedListings,
  deliveryJobs as seedDeliveryJobs,
  farmerById,
  CROP_CYCLE_DAYS,
} from '@/data'
import { addDays } from '@/lib/date'

// Everything a real backend would own once it exists: contracts, demand
// requests, match requests (a farmer offering to fulfill part of a
// contract), production/harvest records generated when a match is
// confirmed, marketplace listings, delivery jobs and per-contract chat.
// Kept in memory only (resets on reload) — matches how the rest of this
// prototype behaves (see NewDemandRequestModal's pre-existing pattern).

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: 'MSG-001',
    contractId: 'AG-204',
    senderRole: 'Buyer',
    senderName: 'Nana Adjei (Ghana Fresh Foods)',
    text: "Hi Abena — checking in ahead of the Oct 18 delivery. How's the crop looking after last week's rain?",
    sentAt: '2026-08-18T09:12:00',
  },
  {
    id: 'MSG-002',
    contractId: 'AG-204',
    senderRole: 'Farmer',
    senderName: 'Abena Owusu',
    text: 'Good morning! Some standing water on the lower plot but the main field is fine. Should still hit my 4t.',
    sentAt: '2026-08-18T10:47:00',
  },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

interface RequestToSupplyInput {
  farmerId: string
  contractId: string
  demandRequestId: string
  proposedQuantityTonnes: number
  message?: string
}

interface PlatformDataValue {
  contracts: Contract[]
  demandRequests: DemandRequest[]
  matchRequests: MatchRequest[]
  productionCycles: ProductionCycle[]
  harvestForecasts: HarvestForecast[]
  listings: MarketplaceListing[]
  deliveryJobs: DeliveryJob[]
  messages: ChatMessage[]
  kycOverrides: Record<string, KycStatus>

  createDemandRequest: (demand: DemandRequest) => void
  requestToSupply: (input: RequestToSupplyInput) => void
  confirmMatchRequest: (matchRequestId: string) => void
  declineMatchRequest: (matchRequestId: string) => void
  setKycStatus: (entityId: string, status: KycStatus) => void
  createListing: (listing: MarketplaceListing) => void
  setListingStatus: (listingId: string, status: ListingStatus) => void
  assignDeliveryPartner: (jobId: string, partnerId: string) => void
  setDeliveryStatus: (jobId: string, status: DeliveryJobStatus) => void
  sendMessage: (contractId: string, senderRole: ChatMessage['senderRole'], senderName: string, text: string) => void
}

const PlatformDataContext = createContext<PlatformDataValue | null>(null)

export function PlatformDataProvider({ children }: { children: ReactNode }) {
  const [contracts, setContracts] = useState<Contract[]>(seedContracts)
  const [demandRequests, setDemandRequests] = useState<DemandRequest[]>(seedDemandRequests)
  const [matchRequests, setMatchRequests] = useState<MatchRequest[]>([
    {
      id: 'MR-001',
      contractId: 'AG-201',
      demandRequestId: 'DR-1009',
      farmerId: 'F018',
      proposedQuantityTonnes: 2.5,
      message: 'I can supply Grade A peppers from my Konongo plot starting next month.',
      status: 'Pending',
      createdAt: '2026-08-19',
    },
  ])
  const [productionCycles, setProductionCycles] = useState<ProductionCycle[]>(seedProductionCycles)
  const [harvestForecasts, setHarvestForecasts] = useState<HarvestForecast[]>(seedHarvestForecasts)
  const [listings, setListings] = useState<MarketplaceListing[]>(seedListings)
  const [deliveryJobs, setDeliveryJobs] = useState<DeliveryJob[]>(seedDeliveryJobs)
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES)
  const [kycOverrides, setKycOverrides] = useState<Record<string, KycStatus>>({})

  const createDemandRequest = useCallback((demand: DemandRequest) => {
    setDemandRequests((prev) => [demand, ...prev])
  }, [])

  const requestToSupply = useCallback((input: RequestToSupplyInput) => {
    setMatchRequests((prev) => [
      {
        id: `MR-${Math.floor(100 + Math.random() * 900)}`,
        contractId: input.contractId,
        demandRequestId: input.demandRequestId,
        farmerId: input.farmerId,
        proposedQuantityTonnes: input.proposedQuantityTonnes,
        message: input.message,
        status: 'Pending',
        createdAt: today(),
      },
      ...prev,
    ])
  }, [])

  const confirmMatchRequest = useCallback(
    (matchRequestId: string) => {
      const req = matchRequests.find((m) => m.id === matchRequestId)
      if (!req || req.status !== 'Pending') return
      const contract = contracts.find((c) => c.id === req.contractId)
      const farmer = farmerById(req.farmerId)
      if (!contract || !farmer) return

      setMatchRequests((prev) =>
        prev.map((m) => (m.id === matchRequestId ? { ...m, status: 'Confirmed', decidedAt: today() } : m)),
      )

      setContracts((prev) =>
        prev.map((c) => {
          if (c.id !== req.contractId) return c
          const farmerIds = c.farmerIds.includes(req.farmerId) ? c.farmerIds : [...c.farmerIds, req.farmerId]
          return { ...c, farmerIds, suppliedQuantityTonnes: c.suppliedQuantityTonnes + req.proposedQuantityTonnes }
        }),
      )

      setDemandRequests((prev) =>
        prev.map((d) => {
          if (d.id !== req.demandRequestId) return d
          const contractedTonnes = d.contractedTonnes + req.proposedQuantityTonnes
          const status: DemandStatus =
            contractedTonnes >= d.quantityTonnes ? 'Fully Contracted' : 'Partially Contracted'
          return { ...d, contractedTonnes, status }
        }),
      )

      const expectedHarvestDate = addDays(contract.expectedDeliveryDate, -10)
      const plantingDate = addDays(expectedHarvestDate, -CROP_CYCLE_DAYS[contract.cropId])
      const cycleId = `PC-${farmer.id}-${contract.id}`
      const forecastId = `HF-${farmer.id}-${contract.id}`

      setProductionCycles((prev) => {
        if (prev.some((p) => p.id === cycleId)) return prev
        return [
          ...prev,
          {
            id: cycleId,
            farmerId: farmer.id,
            contractId: contract.id,
            cropId: contract.cropId,
            region: farmer.region,
            plantingDate,
            expectedHarvestDate,
            expectedYieldTonnes: req.proposedQuantityTonnes,
            latestYieldEstimateTonnes: req.proposedQuantityTonnes,
            stage: 'Planned',
            riskLevel: farmer.riskStatus,
          },
        ]
      })

      setHarvestForecasts((prev) => {
        if (prev.some((h) => h.id === forecastId)) return prev
        return [
          ...prev,
          {
            id: forecastId,
            farmerId: farmer.id,
            contractId: contract.id,
            buyerId: contract.buyerId,
            cropId: contract.cropId,
            region: farmer.region,
            expectedQuantityTonnes: req.proposedQuantityTonnes,
            expectedHarvestDate,
            riskLevel: farmer.riskStatus,
          },
        ]
      })
    },
    [matchRequests, contracts],
  )

  const declineMatchRequest = useCallback((matchRequestId: string) => {
    setMatchRequests((prev) =>
      prev.map((m) => (m.id === matchRequestId ? { ...m, status: 'Declined', decidedAt: today() } : m)),
    )
  }, [])

  const setKycStatus = useCallback((entityId: string, status: KycStatus) => {
    setKycOverrides((prev) => ({ ...prev, [entityId]: status }))
  }, [])

  const createListing = useCallback((listing: MarketplaceListing) => {
    setListings((prev) => [listing, ...prev])
  }, [])

  const setListingStatus = useCallback((listingId: string, status: ListingStatus) => {
    setListings((prev) => prev.map((l) => (l.id === listingId ? { ...l, status } : l)))
  }, [])

  const assignDeliveryPartner = useCallback((jobId: string, partnerId: string) => {
    setDeliveryJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, partnerId, status: 'Assigned' } : j)))
  }, [])

  const setDeliveryStatus = useCallback((jobId: string, status: DeliveryJobStatus) => {
    setDeliveryJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status } : j)))
  }, [])

  const sendMessage = useCallback(
    (contractId: string, senderRole: ChatMessage['senderRole'], senderName: string, text: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `MSG-${Math.floor(1000 + Math.random() * 9000)}`,
          contractId,
          senderRole,
          senderName,
          text,
          sentAt: new Date().toISOString(),
        },
      ])
    },
    [],
  )

  const value = useMemo<PlatformDataValue>(
    () => ({
      contracts,
      demandRequests,
      matchRequests,
      productionCycles,
      harvestForecasts,
      listings,
      deliveryJobs,
      messages,
      kycOverrides,
      createDemandRequest,
      requestToSupply,
      confirmMatchRequest,
      declineMatchRequest,
      setKycStatus,
      createListing,
      setListingStatus,
      assignDeliveryPartner,
      setDeliveryStatus,
      sendMessage,
    }),
    [
      contracts,
      demandRequests,
      matchRequests,
      productionCycles,
      harvestForecasts,
      listings,
      deliveryJobs,
      messages,
      kycOverrides,
      createDemandRequest,
      requestToSupply,
      confirmMatchRequest,
      declineMatchRequest,
      setKycStatus,
      createListing,
      setListingStatus,
      assignDeliveryPartner,
      setDeliveryStatus,
      sendMessage,
    ],
  )

  return <PlatformDataContext.Provider value={value}>{children}</PlatformDataContext.Provider>
}

export function usePlatformData() {
  const ctx = useContext(PlatformDataContext)
  if (!ctx) throw new Error('usePlatformData must be used within PlatformDataProvider')
  return ctx
}

export function resolveKycStatus(baseStatus: KycStatus, entityId: string, overrides: Record<string, KycStatus>): KycStatus {
  return overrides[entityId] ?? baseStatus
}

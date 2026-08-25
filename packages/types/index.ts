// Core domain types for AgriFlow.
// This models the demand -> contract -> production -> climate -> harvest ->
// post-harvest -> delivery -> payment -> performance loop described in the
// product spec. Seeded here from the prototype's hand-written types as the
// monorepo's starting point (Platform Blueprint, Section 5) — once
// apps/api exposes its OpenAPI schema, this package becomes generated
// output (openapi-typescript) rather than hand-maintained, so frontend
// and backend can't silently drift apart.

export type GhanaRegion =
  | 'Ashanti'
  | 'Bono'
  | 'Bono East'
  | 'Northern'
  | 'Upper West'
  | 'Upper East'
  | 'Greater Accra'
  | 'Eastern'
  | 'Volta'

export type RiskLevel = 'low' | 'medium' | 'high'

export type CropId = 'tomatoes' | 'onions' | 'peppers' | 'cassava'

export interface Crop {
  id: CropId
  name: string
  unit: 'tonnes'
  varietyNotes?: string
}

export type BuyerType =
  | 'Food Processor'
  | 'Hotel'
  | 'Restaurant'
  | 'Supermarket'
  | 'Aggregator'
  | 'Exporter'

export type KycStatus = 'Unverified' | 'Pending' | 'Verified'

export interface Buyer {
  id: string
  name: string
  type: BuyerType
  location: string
  contactPerson: string
  contactEmail: string
  contactPhone: string
  since: string // ISO date
  activeContractIds: string[]
  demandRequestIds: string[]
  notes?: string
  kycStatus: KycStatus
}

export type DemandFrequency = 'One-time' | 'Weekly' | 'Bi-weekly' | 'Monthly'
export type DemandStatus = 'Open' | 'Partially Contracted' | 'Fully Contracted' | 'Closed'
export type QualityGrade = 'Grade A' | 'Grade B' | 'Export Grade'

export interface DemandRequest {
  id: string
  buyerId: string
  cropId: CropId
  quantityTonnes: number
  contractedTonnes: number
  qualityGrade: QualityGrade
  requiredDeliveryDate: string
  deliveryLocation: string
  targetPriceGHSPerTonne: number
  frequency: DemandFrequency
  specialRequirements?: string
  status: DemandStatus
  createdAt: string
}

export type ClimateSmartPractice =
  | 'Mulching'
  | 'Efficient irrigation'
  | 'Integrated pest management'
  | 'Soil-health management'
  | 'Appropriate fertilizer use'
  | 'Water conservation'

export type CropStage =
  | 'Planned'
  | 'Planted'
  | 'Growing'
  | 'Flowering'
  | 'Maturing'
  | 'Harvest Ready'
  | 'Harvested'

export interface FarmerRisk {
  rainfallExposure: RiskLevel
  droughtExposure: RiskLevel
  pestRisk: RiskLevel
  yieldRisk: RiskLevel
}

export interface Farmer {
  id: string
  name: string
  region: GhanaRegion
  community: string
  phone: string
  primaryCropId: CropId
  secondaryCropIds: CropId[]
  farmSizeHectares: number
  contractedQuantityTonnes: number
  expectedYieldTonnes: number
  latestYieldEstimateTonnes: number
  currentCropStage: CropStage
  climateSmartPractices: ClimateSmartPractice[]
  climateSmartScore: number // 0-100, DEMO metric
  reliabilityScore: number // 0-100, DEMO metric
  riskStatus: RiskLevel
  risk: FarmerRisk
  contractIds: string[]
  groupId?: string
  joinedAt: string
  lastUpdateAt: string
  hasSubmittedLatestUpdate: boolean
  kycStatus: KycStatus
}

export interface FarmerGroup {
  id: string
  name: string
  region: GhanaRegion
  leadFarmerId: string
  farmerIds: string[]
}

export type ContractStage =
  | 'Demand Created'
  | 'Seeking Farmers'
  | 'Partially Contracted'
  | 'Fully Contracted'
  | 'In Production'
  | 'Harvest Ready'
  | 'Delivered'
  | 'Paid'

export interface ContractTimelineEvent {
  date: string
  label: string
  done: boolean
}

export interface Contract {
  id: string // e.g. AG-204
  buyerId: string
  demandRequestId: string
  cropId: CropId
  contractedQuantityTonnes: number
  suppliedQuantityTonnes: number
  expectedDeliveryDate: string
  farmerIds: string[]
  valueGHS: number
  stage: ContractStage
  riskLevel: RiskLevel
  timeline: ContractTimelineEvent[]
  aiAssessment?: string
  deliveryLocation: string
  createdAt: string
}

export interface ProductionCycle {
  id: string
  farmerId: string
  contractId?: string
  cropId: CropId
  region: GhanaRegion
  plantingDate: string
  expectedHarvestDate: string
  expectedYieldTonnes: number
  latestYieldEstimateTonnes: number
  stage: CropStage
  riskLevel: RiskLevel
}

export interface HarvestForecast {
  id: string
  farmerId: string
  contractId?: string
  buyerId?: string
  cropId: CropId
  region: GhanaRegion
  expectedQuantityTonnes: number
  expectedHarvestDate: string
  riskLevel: RiskLevel
}

export interface RegionClimateRisk {
  region: GhanaRegion
  rainfallRisk: RiskLevel
  heatStress: RiskLevel
  waterStress: RiskLevel
  overallRisk: RiskLevel
  farmsAtRisk: number
  notes: string
}

export interface ClimateTrendPoint {
  week: string
  rainfallMm: number
  avgTempC: number
  cropStressIndex: number // 0-100
}

export interface PostHarvestRiskBreakdown {
  highRiskTonnes: number
  mediumRiskTonnes: number
  lowRiskTonnes: number
}

export interface PostHarvestCapacity {
  weekLabel: string
  upcomingHarvestTonnes: number
  storageRequiredTonnes: number
  storageAvailableTonnes: number
  riskBreakdown: PostHarvestRiskBreakdown
  recommendedActions: string[]
}

export type PaymentDirection = 'Farmer Payment' | 'Buyer Payment'
export type PaymentStatus = 'Pending' | 'Processing' | 'Paid'
export type PaymentMethod =
  | 'MTN Mobile Money'
  | 'Telecel Cash'
  | 'AirtelTigo Money'
  | 'Bank Transfer'

export interface Payment {
  id: string
  direction: PaymentDirection
  contractId: string
  counterpartyId: string // farmerId or buyerId
  counterpartyName: string
  amountGHS: number
  status: PaymentStatus
  method: PaymentMethod
  date: string
}

export type InsightKind = 'prediction' | 'detection' | 'recommendation' | 'explanation'

export interface AIInsight {
  id: string
  kind: InsightKind
  title: string
  body: string
  relatedContractId?: string
  createdAt: string
}

export type NotificationSeverity = 'info' | 'warning' | 'risk'

export interface Notification {
  id: string
  title: string
  message: string
  severity: NotificationSeverity
  createdAt: string
  read: boolean
  // Which contract/region this alert relates to, used to scope it to the
  // relevant buyer or field agent. Alerts with neither are platform-ops-level
  // and only shown to Platform Admin.
  relatedContractId?: string
  relatedRegions?: GhanaRegion[]
}

export type DemoRole = 'Platform Admin' | 'Buyer' | 'Field Agent' | 'Farmer' | 'Delivery Partner' | 'Super Admin'

// --- Demand-to-contract matching ---
// A farmer's request to supply (part of) an existing contract's remaining
// volume. This is the interactive step the rest of the platform assumes has
// already happened for the seeded demo contracts — creating one and having
// it confirmed is what actually links a DemandRequest to a Farmer.
export type MatchRequestStatus = 'Pending' | 'Confirmed' | 'Declined'

export interface MatchRequest {
  id: string
  contractId: string
  demandRequestId: string
  farmerId: string
  proposedQuantityTonnes: number
  message?: string
  status: MatchRequestStatus
  createdAt: string
  decidedAt?: string
}

// --- Marketplace (surplus produce, farm inputs, farm residue) ---
export type ListingCategory = 'Produce Surplus' | 'Farm Inputs' | 'Farm Residue'
export type ListingStatus = 'Available' | 'Reserved' | 'Sold'
export type ListingUnit = 'tonnes' | 'kg' | 'bags' | 'litres' | 'units'

export interface MarketplaceListing {
  id: string
  category: ListingCategory
  title: string
  description: string
  sellerId: string // a Farmer id, or 'platform' for admin/vendor-posted input listings
  sellerName: string
  cropId?: CropId
  quantity: number
  unit: ListingUnit
  pricePerUnitGHS: number
  location: string
  status: ListingStatus
  postedAt: string
}

// --- Delivery coordination ---
export type DeliveryPartnerType = 'Company' | 'Individual'
export type DeliveryJobStatus = 'Unassigned' | 'Assigned' | 'In Transit' | 'Delivered'

export interface DeliveryPartner {
  id: string
  name: string
  type: DeliveryPartnerType
  vehicleType: string
  regions: GhanaRegion[]
  rating: number // 0-5, DEMO metric
  contactPhone: string
}

export interface DeliveryJob {
  id: string
  contractId?: string
  listingId?: string
  cropId: CropId
  quantityTonnes: number
  fromLocation: string
  toLocation: string
  scheduledDate: string
  status: DeliveryJobStatus
  partnerId?: string
  feeGHS: number
  commissionGHS: number
}

// --- In-app messaging (per contract) ---
export interface ChatMessage {
  id: string
  contractId: string
  senderRole: DemoRole
  senderName: string
  text: string
  sentAt: string
}
// Setting up an account: what the API sends and takes (apps/api onboarding
// and network). The same shapes as the web app's (apps/web/src/lib/apiClient.ts).

export type SelfServeRole = 'farmer' | 'buyer' | 'delivery_partner' | 'cooperative'
export type Verification = 'unverified' | 'pending' | 'verified' | 'rejected'
export type OnboardingStep = 'name' | 'place' | 'role' | 'phone' | 'terms'

export type Gender = 'woman' | 'man' | 'prefer_not_to_say'
export type GuardianRelationship = 'parent' | 'legal_guardian' | 'relative'

/** Who someone is, as on their ID: private (only they and our team see it), for verification later. */
export interface PersonalDetails {
  legal_name: string
  /** YYYY-MM-DD; null until given. */
  date_of_birth: string | null
  gender: Gender | ''
  /** Under 18: their parent or guardian (empty for adults). */
  guardian_name: string
  guardian_relationship: GuardianRelationship | ''
  /** E.164. */
  guardian_phone: string
  /** Worked out by the API from the date of birth. */
  is_minor?: boolean
}

export interface OnboardingState {
  steps: Record<OnboardingStep, boolean>
  next_step: OnboardingStep | null
  complete: boolean
  terms_version: string
}

export interface FarmerDetails {
  region: string
  district: string
  crops: string[]
  farm_size_hectares: string | null
  /** A cooperative on AgriFlow, from the options' list: asks to join it (null: none, or a typed name). */
  cooperative_id: number | null
  /** A cooperative not on AgriFlow yet, typed. */
  cooperative_name: string
}

/** The farmer's cooperative on AgriFlow, and whether it has confirmed them yet. */
export interface FarmerCooperative {
  id: number
  name: string
  verified: boolean
  membership: 'pending' | 'confirmed' | 'declined'
}

/** A cooperative farmers can choose (new ones are listed straight away, unverified). */
export interface CooperativeOption {
  id: number
  name: string
  region: string
  district: string
  verified: boolean
}

export interface BuyerDetails {
  business_name: string
  business_type: string
  region: string
  district: string
  crops: string[]
}

export interface DeliveryPartnerDetails {
  business_name: string
  vehicle_types: string[]
  service_regions: string[]
}

export interface CooperativeDetails {
  name: string
  registration_number: string
  region: string
  district: string
  member_count: number | null
  crops: string[]
}

export interface RoleDetails {
  farmer: FarmerDetails
  buyer: BuyerDetails
  delivery_partner: DeliveryPartnerDetails
  cooperative: CooperativeDetails
}

/** A role the account chose, with its details. */
export type Profile = {
  [R in SelfServeRole]: {
    role: R
    verification: Verification
    created_at: string
    updated_at: string
  } & RoleDetails[R] &
    (R extends 'farmer' ? { cooperative: FarmerCooperative | null } : unknown)
}[SelfServeRole]

export interface Option {
  value: string
  label: string
}

/** The pick lists for setting up an account, for one country. */
export interface SetupOptions {
  country: string
  /** Null where the country has no list: people type their region. */
  regions: { name: string; districts: string[] }[] | null
  crops: Option[]
  buyer_types: Option[]
  vehicle_types: Option[]
  /** The cooperatives on AgriFlow in this country. */
  cooperatives: CooperativeOption[]
}

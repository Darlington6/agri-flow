import type { InsightKind, RiskLevel } from '@/types'

export interface ContractRiskAssessment {
  contractId: string
  cropName: string
  buyerName: string
  riskLevel: RiskLevel
  projectedFulfillmentPct: number
  reason: string
  recommendation: string
}

export interface SupplyRiskSummary {
  headline: string
  atRiskContracts: ContractRiskAssessment[]
  generatedAt: string
}

export interface RecommendedAction {
  id: string
  title: string
  description: string
  contractId?: string
  kind: InsightKind
}

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  isAIGenerated?: boolean
}

export const SUGGESTED_PROMPTS: string[] = [
  'Which contracts are at risk?',
  'Will we meet buyer demand this month?',
  'Which farms need attention?',
  'Where is post-harvest loss most likely?',
  'Which farmers could need additional support?',
  'What should I prioritize this week?',
]
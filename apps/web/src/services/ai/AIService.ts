import type { AIChatMessage, ContractRiskAssessment, RecommendedAction, SupplyRiskSummary } from './types'

// Abstract contract for AgriFlow's AI layer. UI components depend only on
// this interface, never on a concrete implementation, so a real LLM-backed
// service (e.g. LLMAIService.ts) can be swapped in later without touching
// any page or component.
//
// The AI is scoped to four jobs against structured platform data:
//   - Prediction:      what is likely to happen (fulfillment, yield, delivery)
//   - Detection:        what is going wrong right now (risk, gaps, missed updates)
//   - Recommendation:  what action would address it
//   - Explanation:      why a prediction or detection is happening
export interface AIService {
  getSupplyRiskSummary(): Promise<SupplyRiskSummary>
  getContractRisk(contractId: string): Promise<ContractRiskAssessment | null>
  getRecommendedActions(): Promise<RecommendedAction[]>
  answerQuestion(question: string, history: AIChatMessage[]): Promise<AIChatMessage>
}
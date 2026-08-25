import type { AIService } from './AIService'
import type { AIChatMessage, ContractRiskAssessment, RecommendedAction, SupplyRiskSummary } from './types'
import { buyerById, contractById, cropById, farmers } from '@/data'

// Mock implementation of AIService. Responses are generated from the mock
// platform dataset using simple lookups/templates rather than a model call.
// Swapping this for an LLM-backed implementation later means writing a
// LLMAIService that implements the same AIService interface — no UI changes.

const AT_RISK_NARRATIVES: Record<string, { projectedFulfillmentPct: number; recommendation: string }> = {
  'AG-204': {
    projectedFulfillmentPct: 92,
    recommendation: 'Reallocate 2.5 tonnes of expected harvest from lower-risk farms, or confirm 2 additional growers within 2 weeks.',
  },
  'AG-188': {
    projectedFulfillmentPct: 87,
    recommendation: 'Monitor the delayed-planting farm closely and confirm buyer flexibility on delivery date if maturity slips further.',
  },
  'AG-217': {
    projectedFulfillmentPct: 76,
    recommendation: 'Prioritize AG-217 and identify replacement supply within 7 days.',
  },
  'AG-202': {
    projectedFulfillmentPct: 65,
    recommendation: 'Expand farmer recruitment beyond Northern Region to close the matching gap before the planting window closes.',
  },
  'AG-203': {
    projectedFulfillmentPct: 82,
    recommendation: 'Match 2-3 additional Volta-region growers to reach the export order\'s full contracted volume.',
  },
}

function buildAssessment(contractId: string): ContractRiskAssessment | null {
  const contract = contractById(contractId)
  if (!contract) return null
  const buyer = buyerById(contract.buyerId)
  const crop = cropById(contract.cropId)
  const narrative = AT_RISK_NARRATIVES[contractId]
  const projectedFulfillmentPct =
    narrative?.projectedFulfillmentPct ??
    Math.round((contract.suppliedQuantityTonnes / contract.contractedQuantityTonnes) * 100)

  return {
    contractId: contract.id,
    cropName: crop?.name ?? contract.cropId,
    buyerName: buyer?.name ?? 'Unknown buyer',
    riskLevel: contract.riskLevel,
    projectedFulfillmentPct,
    reason: contract.aiAssessment ?? 'No elevated risk factors detected for this contract.',
    recommendation: narrative?.recommendation ?? 'Continue routine monitoring; no action required.',
  }
}

const PRIORITY_CONTRACT_IDS = ['AG-204', 'AG-188', 'AG-217']

function farmersNeedingAttention() {
  return farmers.filter((f) => !f.hasSubmittedLatestUpdate || f.riskStatus === 'high')
}

function nowIso() {
  return new Date().toISOString()
}

let messageCounter = 0
function nextId() {
  messageCounter += 1
  return `msg-${messageCounter}-${Date.now()}`
}

function assistantMessage(content: string): AIChatMessage {
  return {
    id: nextId(),
    role: 'assistant',
    content,
    createdAt: nowIso(),
    isAIGenerated: true,
  }
}

export class MockAIService implements AIService {
  async getSupplyRiskSummary(): Promise<SupplyRiskSummary> {
    const atRiskContracts = PRIORITY_CONTRACT_IDS.map(buildAssessment).filter(
      (a): a is ContractRiskAssessment => a !== null,
    )
    return {
      headline:
        'Tomato supply for Ghana Fresh Foods Ltd. is currently projected at 92% of contracted volume. Six farms show elevated rainfall exposure. Consider reallocating 2.5 tonnes of expected harvest from lower-risk farms.',
      atRiskContracts,
      generatedAt: nowIso(),
    }
  }

  async getContractRisk(contractId: string): Promise<ContractRiskAssessment | null> {
    return buildAssessment(contractId)
  }

  async getRecommendedActions(): Promise<RecommendedAction[]> {
    return [
      {
        id: 'RA-001',
        kind: 'recommendation',
        title: 'Source 1.6 tonnes of additional tomato supply',
        description: 'Contract AG-204 is projected at 92% fulfillment. Identify 1-2 nearby farms to close the gap before the Oct 18 delivery date.',
        contractId: 'AG-204',
      },
      {
        id: 'RA-002',
        kind: 'recommendation',
        title: 'Find replacement onion supply within 7 days',
        description: 'Contract AG-217 is projected at 76% fulfillment due to drought exposure on both matched farms.',
        contractId: 'AG-217',
      },
      {
        id: 'RA-003',
        kind: 'detection',
        title: 'Follow up with 3 farmers on missing crop updates',
        description: 'Kojo Mensah, Rahinatu Yakubu and Ibrahim Mohammed have not submitted a crop update in over 2 weeks.',
      },
      {
        id: 'RA-004',
        kind: 'recommendation',
        title: 'Allocate cold storage for next week\'s harvest',
        description: 'Upcoming harvest volume (46.8t) exceeds available storage (31t) by 7 tonnes. Prioritize high-risk perishable lots.',
      },
    ]
  }

  async answerQuestion(question: string, _history: AIChatMessage[]): Promise<AIChatMessage> {
    const q = question.toLowerCase()

    if (q.includes('which contracts') && q.includes('risk')) {
      const lines = PRIORITY_CONTRACT_IDS.map((id, i) => {
        const a = buildAssessment(id)!
        return `${i + 1}. Contract ${a.contractId} — ${a.cropName} — ${a.projectedFulfillmentPct}% projected fulfillment\n   Risk: ${a.reason}`
      })
      return assistantMessage(
        `3 contracts currently require attention.\n\n${lines.join('\n\n')}\n\nRecommended action:\nPrioritize AG-217 and identify replacement supply within 7 days.`,
      )
    }

    if (q.includes('meet') && q.includes('demand')) {
      return assistantMessage(
        'Projected supply across active contracts is currently running at roughly 87% of contracted demand for the month. Tomato and cassava contracts are tracking close to plan. Onion supply is the primary gap — Contract AG-217 is projected at 76% fulfillment due to drought exposure on two farms. Confirming 2 additional onion growers this week would close most of the shortfall before the delivery window.',
      )
    }

    if (q.includes('farms') && q.includes('attention')) {
      const list = farmersNeedingAttention()
        .map((f) => `- ${f.name} (${f.community}, ${f.region}) — ${f.primaryCropId}, ${f.riskStatus} risk${!f.hasSubmittedLatestUpdate ? ', no update in 2+ weeks' : ''}`)
        .join('\n')
      return assistantMessage(`${farmersNeedingAttention().length} farms need attention this week:\n\n${list}`)
    }

    if (q.includes('post-harvest') || (q.includes('loss') && q.includes('likely'))) {
      return assistantMessage(
        "Post-harvest loss risk is highest where storage capacity is tightest. Next 7 days' expected harvest is 46.8 tonnes against 31 tonnes of available storage — a 7-tonne shortfall. Of that volume, 12 tonnes are classed high risk. Allocating cold storage to the high-risk lots first, and confirming buyer pickup windows for harvest-ready contracts (AG-206), would reduce exposure the most.",
      )
    }

    if (q.includes('support')) {
      const list = farmers
        .filter((f) => f.reliabilityScore < 75 || f.climateSmartScore < 60)
        .map((f) => `- ${f.name} (${f.community}, ${f.region}) — reliability ${f.reliabilityScore}%, climate-smart score ${f.climateSmartScore}%`)
        .join('\n')
      return assistantMessage(
        `A small group of farmers show lower reliability and climate-smart practice adoption, and may benefit from field agent visits or input support:\n\n${list}`,
      )
    }

    if (q.includes('prioritize') || q.includes('this week')) {
      return assistantMessage(
        "This week's priorities:\n\n1. Source replacement onion supply for Contract AG-217 (76% projected fulfillment) — 7-day window.\n2. Allocate cold storage for next week's harvest before the 7-tonne shortfall hits.\n3. Follow up with 3 farmers who have not submitted crop updates.\n4. Check in on Contract AG-188 — planting delay is compressing the maturity window.",
      )
    }

    const summary = await this.getSupplyRiskSummary()
    return assistantMessage(summary.headline)
  }
}

export const mockAIService = new MockAIService()

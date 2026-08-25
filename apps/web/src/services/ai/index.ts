export type { AIService } from './AIService'
export * from './types'

// Single place the rest of the app imports the active AI implementation from.
// Swap this line for an LLMAIService instance once a real model is wired up.
export { mockAIService as aiService } from './MockAIService'

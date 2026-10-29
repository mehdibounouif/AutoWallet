import type { WalletType } from '../dashboardApi'

export type AssistantSource = 'Local engine' | 'External model'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  source?: AssistantSource
  chart?: Partial<Record<WalletType, number>>
  preview?: number
  stopped?: boolean
}

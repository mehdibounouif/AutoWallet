import { Home, Landmark, PiggyBank, ShoppingBag, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type EnvelopeId = 'main' | 'rent' | 'tax' | 'savings' | 'free'

export interface Envelope {
  id: EnvelopeId
  name: string
  color: string // charts
  ink: string // icon on the tint
  tint: string
  icon: LucideIcon
}

// The envelope colors of the design system (index.css) and the onboarding icons.
// Same order as the onboarding; Main, the leftover, comes last.
export const ENVELOPES: Envelope[] = [
  { id: 'rent', name: 'Rent', color: '#2A78D6', ink: '#1C5CAB', tint: '#EAF2FC', icon: Home },
  { id: 'tax', name: 'Tax', color: '#EB6834', ink: '#A63F16', tint: '#FDEEE8', icon: Landmark },
  { id: 'savings', name: 'Savings', color: '#1BAF7A', ink: '#0B6E4B', tint: '#E3F5EE', icon: PiggyBank },
  { id: 'free', name: 'Free', color: '#EDA100', ink: '#7A5200', tint: '#FDF3DC', icon: ShoppingBag },
  { id: 'main', name: 'Main', color: '#C3C2B7', ink: '#5E6B7E', tint: '#EDF0F4', icon: Wallet },
]

export function envelopeName(id: string): string {
  return ENVELOPES.find((envelope) => envelope.id === id)?.name ?? id
}

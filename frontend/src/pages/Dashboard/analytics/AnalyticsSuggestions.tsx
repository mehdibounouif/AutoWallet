import { useState } from 'react'
import { ArrowRight, House, Landmark, PiggyBank, TrendingUp, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'
import { SectionHeader } from '../../../components/ui/PageHeader'
import type { Suggestion, SuggestionId } from './analyticsModel'

const icons: Record<SuggestionId, LucideIcon> = {
  tax: Landmark,
  cap: PiggyBank,
  rent: House,
  largest: TrendingUp,
}

/** Dismissible, local-engine suggestions derived from the user's own numbers. */
export function AnalyticsSuggestions({ suggestions, onAsk, onRules }: {
  suggestions: Suggestion[]
  onAsk: (question: string) => void
  onRules: () => void
}) {
  const [dismissed, setDismissed] = useState<string[]>([])

  return (
    <>
      <SectionHeader
        title="Suggestions"
        description="From your own numbers. Review your rules before making a change."
        className="mt-9"
        actions={dismissed.length > 0 ? <button type="button" onClick={() => setDismissed([])} className="text-xs font-bold text-accent hover:underline">Show dismissed</button> : undefined}
      />

      <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
        {suggestions.filter((item) => !dismissed.includes(item.id)).map(({ id, title, text, question }) => {
          const Icon = icons[id]
          return (
            <Card as="article" key={id} className="flex flex-col p-5">
              <div className="flex items-center gap-2.5 text-muted">
                <Icon className="size-5" aria-hidden="true" />
                <Badge tone="neutral">Local engine</Badge>
                <button type="button" onClick={() => setDismissed((items) => [...items, id])} aria-label={`Dismiss ${title}`} className="ms-auto text-subtle hover:text-ink">
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <h3 className="mt-4 text-base font-extrabold text-ink">{title}</h3>
              <p className="mt-3 mb-5 text-xs leading-relaxed text-muted">{text}</p>
              <div className="mt-auto flex flex-wrap gap-5">
                <button type="button" onClick={() => onAsk(question)} className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline">
                  Ask why <ArrowRight className="size-3.5" aria-hidden="true" />
                </button>
                <button type="button" onClick={onRules} className="text-xs font-bold text-accent hover:underline">Review rules</button>
              </div>
            </Card>
          )
        })}
      </div>
    </>
  )
}

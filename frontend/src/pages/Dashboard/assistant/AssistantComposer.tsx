import type { RefObject } from 'react'
import { ArrowUp, BarChart3, Check, ChevronDown, Square, X } from 'lucide-react'
import { useDismissibleLayer } from '../../../hooks/useDismissibleLayer'
import { useTranslation } from '../../../i18n'

interface AssistantComposerProps {
  draft: string
  onDraftChange: (value: string) => void
  onSubmit: () => void
  onStop: () => void
  onStarter: (question: string) => void
  onLocalPreview: () => void
  busy: boolean
  online: boolean
  showStarters: boolean
  chartOpen: boolean
  onToggleChart: () => void
  onCloseChart: () => void
  onAddChart: (kind: 'balances' | 'payment') => void
  canAddPaymentChart: boolean
  inputRef: RefObject<HTMLTextAreaElement | null>
}

/** Message box, chart menu and starter prompts for the Assistant. */
export function AssistantComposer({
  draft,
  onDraftChange,
  onSubmit,
  onStop,
  onStarter,
  onLocalPreview,
  busy,
  online,
  showStarters,
  chartOpen,
  onToggleChart,
  onCloseChart,
  onAddChart,
  canAddPaymentChart,
  inputRef,
}: AssistantComposerProps) {
  const { t } = useTranslation()
  const chartRef = useDismissibleLayer(chartOpen, onCloseChart)

  return (
    <div className="pb-4.5 max-md:pb-2.5">
      {showStarters && (
        <div className="mb-3.5 flex gap-2 overflow-x-auto pb-0.5 max-md:mb-2.5">
          <button type="button" disabled={busy || !online} onClick={() => onStarter('Explain my current Tax envelope balance and rule.')} className="shrink-0 rounded-full border border-line bg-layer px-2.5 py-1.5 text-2xs text-muted disabled:opacity-50">
            Why is Tax at this balance?
          </button>
          <button type="button" disabled={busy || !online} onClick={() => onStarter('When could Savings reach its cap? Explain the assumptions using my available payments and rules.')} className="shrink-0 rounded-full border border-line bg-layer px-2.5 py-1.5 text-2xs text-muted disabled:opacity-50">
            When will Savings reach its cap?
          </button>
          <button type="button" disabled={busy} onClick={onLocalPreview} className="shrink-0 rounded-full border border-line bg-layer px-2.5 py-1.5 text-2xs text-muted disabled:opacity-50">
            What would 12,000.00 do?
          </button>
        </div>
      )}

      <form
        className="rounded-xl border border-line-strong bg-surface px-3.5 py-3 focus-within:border-action-primary focus-within:ring-2 focus-within:ring-action-primary/15 max-md:px-2.5"
        onSubmit={(event) => { event.preventDefault(); onSubmit() }}
      >
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-selected px-2 py-0.5 text-2xs text-accent">
            <Check className="size-3" aria-hidden="true" />Use my envelopes &amp; payments
          </span>
          <div className="relative" ref={chartRef}>
            <button
              type="button"
              className="inline-flex min-h-6 items-center gap-1 rounded-full bg-layer px-2 py-0.5 text-3xs text-muted hover:text-ink disabled:opacity-50"
              onClick={onToggleChart}
              disabled={busy}
              aria-expanded={chartOpen}
            >
              <BarChart3 className="size-3.5" aria-hidden="true" />Add a chart<ChevronDown className="size-3" aria-hidden="true" />
            </button>
            {chartOpen && (
              <div className="absolute bottom-[calc(100%+8px)] start-0 z-10 grid min-w-[180px] gap-1 rounded-xl border border-line bg-surface p-2 shadow-popover">
                <button type="button" onClick={() => onAddChart('balances')} className="rounded-md px-2.5 py-2 text-start text-xs hover:bg-canvas">Envelope balances</button>
                <button
                  type="button"
                  disabled={!canAddPaymentChart}
                  onClick={() => onAddChart('payment')}
                  className="rounded-md px-2.5 py-2 text-start text-xs hover:bg-canvas disabled:text-faint"
                >
                  Last recorded split
                </button>
                <button type="button" onClick={onCloseChart} className="flex items-center gap-2 rounded-md px-2.5 py-2 text-start text-xs hover:bg-canvas">
                  <X className="size-3" aria-hidden="true" />Close
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end gap-2.5">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            maxLength={2000}
            disabled={!online}
            placeholder={online ? t.askPlaceholder : 'You’re offline. Your conversation is still here.'}
            aria-label={t.askPlaceholder}
            rows={2}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault()
                onSubmit()
              }
            }}
            className="max-h-[120px] min-w-0 flex-1 resize-y border-0 bg-transparent py-1.5 text-[13px] leading-relaxed text-body outline-none placeholder:text-subtle max-md:text-base"
          />
          {busy ? (
            <button type="button" onClick={onStop} aria-label="Stop response" className="grid size-[34px] shrink-0 place-items-center rounded-[9px] bg-action-primary text-white max-md:size-10">
              <Square className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!draft.trim() || !online}
              aria-label="Send message"
              className="grid size-[34px] shrink-0 place-items-center rounded-[9px] bg-action-primary text-white disabled:bg-layer disabled:text-faint max-md:size-10"
            >
              <ArrowUp className="size-[18px]" aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      <p className="mt-2 text-3xs leading-relaxed text-subtle max-md:text-[9px]">
        Check answers before making money decisions. Chat cannot change your rules or move money.
      </p>
    </div>
  )
}

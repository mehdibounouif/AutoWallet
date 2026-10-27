import { Check, Copy, RefreshCw, Sparkles } from 'lucide-react'
import type { DashboardData } from '../dashboardApi'
import { envelopeMeta, money, walletOrder } from '../envelopeDisplay'
import { previewSplit } from '../dashboardSplit'
import { FormattedAnswer } from '../FormattedAnswer'
import { DashboardSplitRibbon } from '../DashboardSplitRibbon'
import { useTranslation } from '../../../i18n'
import { IconButton } from '../../../components/ui/Button'
import { cn } from '../../../utils/cn'
import type { ChatMessage } from './types'

interface AssistantMessageProps {
  message: ChatMessage
  data: DashboardData
  busy: boolean
  isLastAnswer: boolean
  copied: boolean
  canRegenerate: boolean
  onCopy: () => void
  onRegenerate: () => void
}

/** One conversation turn: text, local previews/charts and copy/regenerate controls. */
export function AssistantMessage({
  message,
  data,
  busy,
  isLastAnswer,
  copied,
  canRegenerate,
  onCopy,
  onRegenerate,
}: AssistantMessageProps) {
  const { t } = useTranslation()

  return (
    <article
      className={cn(
        'min-w-0 text-sm leading-relaxed max-md:text-[13px]',
        message.role === 'user'
          ? 'max-w-[85%] self-end rounded-[14px_14px_4px_14px] bg-layer px-4.5 py-3 text-body'
          : 'max-w-full',
      )}
      aria-label={message.role === 'user' ? 'Your question' : 'Assistant response'}
    >
      {message.source && (
        <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-layer px-2 py-0.5 text-3xs text-muted">
          <Sparkles className="size-3" aria-hidden="true" />
          {message.source === 'Local engine' ? t.localEngineSource : t.externalModelSource}
        </span>
      )}

      {message.text ? (
        <div className="break-words whitespace-pre-wrap [overflow-wrap:anywhere]">
          {message.role === 'assistant' ? <FormattedAnswer text={message.text} /> : message.text}
        </div>
      ) : busy && isLastAnswer ? (
        <span className="text-xs text-subtle" role="status">{t.thinkingStatus}</span>
      ) : message.stopped ? null : (
        <p className="text-xs text-muted">{t.noAnswerReceived}</p>
      )}

      {message.preview && (
        <div className="mt-5">
          <DashboardSplitRibbon
            amount={message.preview}
            allocations={previewSplit(message.preview, data.rules, data.wallets)}
            preview
            size="compact"
          />
        </div>
      )}

      {message.chart && (
        <div className="my-5 grid gap-3.5 rounded-xl border border-line bg-surface p-4 max-md:px-3 max-md:py-4">
          {walletOrder.map((type) => {
            const value = message.chart?.[type] ?? 0
            const maximum = Math.max(1, ...Object.values(message.chart!).filter((item): item is number => typeof item === 'number'))
            return (
              <div key={type} className="grid grid-cols-[90px_minmax(0,1fr)_auto] items-center gap-3 text-2xs max-md:grid-cols-[65px_minmax(0,1fr)_auto] max-md:gap-2 max-md:text-3xs">
                <span>{envelopeMeta[type].name}</span>
                <span className="block h-2.5 rounded bg-layer">
                  <i
                    className="block h-full rounded-[inherit]"
                    style={{ width: `${(Math.max(0, value) / maximum) * 100}%`, backgroundColor: envelopeMeta[type].color }}
                  />
                </span>
                <strong>{money.format(value)}</strong>
              </div>
            )
          })}
        </div>
      )}

      {message.stopped && <p className="mt-2 text-xs text-muted">Response stopped.</p>}

      {message.role === 'assistant' && message.text && !busy && (
        <div className="mt-2 flex gap-3 text-subtle">
          <IconButton label={copied ? 'Copied' : 'Copy response'} onClick={onCopy} size="sm">
            {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
          </IconButton>
          {isLastAnswer && (
            <IconButton label="Regenerate response" onClick={onRegenerate} disabled={!canRegenerate} size="sm">
              <RefreshCw className="size-3.5" aria-hidden="true" />
            </IconButton>
          )}
        </div>
      )}
    </article>
  )
}

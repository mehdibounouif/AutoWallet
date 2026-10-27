import { Check } from 'lucide-react'
import type { DashboardRule, WalletType } from '../dashboardApi'
import { envelopeDescription, envelopeMeta, envelopeTarget, money } from '../envelopeDisplay'
import { useTranslation } from '../../../i18n'
import { ProgressBar } from '../../../components/ui/ProgressBar'
import { cn } from '../../../utils/cn'

/** Clickable envelope summary card. */
export function EnvelopeCard({ type, balance, total, rules, onSelect }: {
  type: WalletType
  balance: number
  total: number
  rules: DashboardRule[]
  onSelect: (type: WalletType) => void
}) {
  const { t } = useTranslation()
  const meta = envelopeMeta[type]
  const Icon = meta.icon
  const target = envelopeTarget(type, rules)
  const percent = target ? Math.min(100, Math.round((balance / target) * 100)) : null
  const remaining = target ? Math.max(0, target - balance) : null
  const share = total > 0 ? ((balance / total) * 100).toFixed(1) : '0.0'

  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      aria-label={t.openEnvelopeAria.replace('{name}', meta.name).replace('{amount}', money.format(balance))}
      className="flex min-h-[198px] min-w-0 flex-col rounded-card border border-line bg-surface p-[18px] text-start text-body transition-[border-color,box-shadow] hover:border-brand-primary/60 hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary max-md:min-h-[177px] max-md:p-[17px]"
    >
      <span className="flex min-h-[65px] items-start gap-2.5 max-md:min-h-[52px]">
        <span
          className="grid size-[35px] shrink-0 place-items-center rounded-[9px]"
          style={{ backgroundColor: meta.tint, color: meta.color }}
          aria-hidden="true"
        >
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 pt-px">
          <strong className="block text-sm leading-tight font-extrabold text-ink">{meta.name}</strong>
          <small className="mt-1 block text-2xs leading-snug font-normal text-muted">{envelopeDescription(type, rules)}</small>
        </span>
      </span>

      <strong className="mt-4 block text-[clamp(22px,2vw,27px)] leading-tight font-extrabold tracking-[-0.035em] whitespace-nowrap text-ink tabular-nums max-md:mt-3 max-md:text-[23px]">
        {money.format(balance)} <small className="text-2xs font-bold tracking-normal text-muted">MAD</small>
      </strong>

      {target !== null && percent !== null && (
        <span className="mt-[17px] block max-md:mt-[15px]">
          <ProgressBar
            value={percent}
            color={meta.color}
            label={`${meta.name} target progress`}
            trackClassName="bg-layer-strong"
          />
          <span
            className={cn(
              'mt-2 flex items-center gap-1 text-2xs leading-tight text-muted',
              percent >= 100 && type === 'rent' && 'text-success-ink',
            )}
          >
            {percent >= 100 ? (
              <>
                <Check className="size-3.5" aria-hidden="true" />
                {t.targetMetBadge} · {money.format(target)}
              </>
            ) : (
              <>
                {type === 'savings' ? t.capWord : t.targetWord} {money.format(target)} · {money.format(remaining ?? 0)}{' '}
                {t.toGoWord} ({percent}%)
              </>
            )}
          </span>
        </span>
      )}

      {type === 'tax' && target === null && (
        <span className="mt-auto block pt-[18px] text-2xs leading-snug text-subtle max-md:pt-3.5">
          {t.noCapGrows}
        </span>
      )}
      {type === 'free' && (
        <span className="mt-auto block pt-[18px] text-2xs leading-snug text-subtle max-md:pt-3.5">
          {share}% {t.ofTotalBalance}
        </span>
      )}
      {type === 'main' && (
        <span className="mt-auto block pt-[18px] text-2xs leading-snug text-subtle max-md:pt-3.5">
          0% {t.freeTakesAll}
        </span>
      )}
    </button>
  )
}

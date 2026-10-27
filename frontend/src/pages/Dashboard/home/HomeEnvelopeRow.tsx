import { Check } from 'lucide-react'
import type { DashboardData, WalletType } from '../dashboardApi'
import { envelopeDescription, envelopeMeta, envelopeTarget, money } from '../envelopeDisplay'
import { useTranslation } from '../../../i18n'
import { ProgressBar } from '../../../components/ui/ProgressBar'

/** One envelope summary row used in the Home "Set aside" column. */
export function HomeEnvelopeRow({ type, data }: { type: WalletType; data: DashboardData }) {
  const { t } = useTranslation()
  const item = envelopeMeta[type]
  const Icon = item.icon
  const balance = data.wallets.find((wallet) => wallet.wallet_type === type)?.balance
  const target = envelopeTarget(type, data.rules)
  const progress = target && balance !== undefined ? Math.max(0, Math.min(100, (balance / target) * 100)) : 0

  return (
    <article className="flex min-h-20 items-start gap-3.5 border-b border-line py-3.5 last:min-h-[108px] last:border-0 last:pt-6 max-md:gap-2.5 max-md:py-4">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-[9px] max-md:size-[34px]"
        style={{ backgroundColor: item.tint, color: item.color }}
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-bold text-body">{item.name}</h3>
          <strong className={`shrink-0 text-sm tabular-nums ${type === 'main' ? 'text-muted' : 'text-body'}`}>
            {balance === undefined ? '—' : money.format(balance)}
          </strong>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted">{envelopeDescription(type, data.rules)}</p>
        {target !== null && balance !== undefined && (
          <div className="mt-3 max-w-[320px]">
            <ProgressBar value={progress} color={item.color} label={`${item.name} target progress`} />
            <p className="mt-2 text-2xs text-muted">
              {type === 'rent' && progress >= 100 ? (
                <span className="inline-flex items-center gap-1">
                  <Check className="size-3.5 text-success-ink" aria-hidden="true" />
                  {t.targetMetBadge}
                </span>
              ) : (
                t.targetProgressFormat
                  .replace('{percent}', String(Math.round(progress)))
                  .replace('{target}', money.format(target))
                  .replace('{kind}', type === 'savings' ? t.capWord : t.targetWord)
              )}
            </p>
          </div>
        )}
      </div>
    </article>
  )
}

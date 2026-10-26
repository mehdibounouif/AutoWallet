import { Check } from 'lucide-react'
import type { Translations } from '../../../i18n'
import { money } from '../../../utils/format'
import { cn } from '../../../utils/cn'
import type { Allocation } from './step5Model'

/** Compact allocation cards and the receipt-style rule table. */
export function AllocationBreakdown({ amount, allocations, total, t }: {
  amount: number
  allocations: Allocation[]
  total: number
  t: Translations
}) {
  return (
    <>
      <div className="min-[1200px]:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 text-sm">
          <span className="font-semibold">{t.firstPaymentLabel}: {money.format(amount)} MAD</span>
          <span className="text-muted">{t.leftoverToMainLabel}: 0.00</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {allocations.map((item) => (
            <div
              key={item.name}
              className="flex flex-col gap-1.5 rounded-xl border border-line border-t-[3px] bg-canvas p-3.5"
              style={{ borderTopColor: item.color }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="grid size-6 shrink-0 place-items-center rounded-md"
                  style={{ backgroundColor: `${item.color}1a`, color: item.color }}
                >
                  <item.Icon className="size-3.5" />
                </span>
                <span className="truncate text-sm font-semibold text-ink">{item.name}</span>
              </div>
              <div className="text-base font-bold text-ink">{money.format(item.amount)} MAD</div>
              <div className="text-2xs text-muted">{money.format(item.remaining)} {t.leftText}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-[720px] min-[1200px]:mt-12">
        <div className="flex items-center justify-between border-b border-line px-1 py-3">
          <span className="text-sm font-semibold text-ink">{t.firstPaymentLabel}</span>
          <span className="text-base font-bold text-ink">
            {money.format(amount)} <span className="text-xs text-muted">MAD</span>
          </span>
        </div>
        <div className="divide-y divide-line text-xs sm:text-sm">
          {allocations.map((item, index) => (
            <div
              key={item.name}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 py-3 min-[850px]:grid min-[850px]:grid-cols-[24px_224px_96px_minmax(0,1fr)_100px_86px]"
            >
              <span className="w-4 text-xs font-medium text-muted">{index + 1}</span>
              <span className="font-semibold text-ink">{index === 0 ? t.rule1Title.replace(/^\d+\.\s*/, '') : item.name}</span>
              <span className="w-fit rounded-full bg-layer px-2 py-0.5 text-2xs whitespace-nowrap text-brand-navy">{item.rule}</span>
              <span className={cn('inline-flex items-center gap-1 text-xs', item.amount > 0 ? 'text-success' : 'text-muted')}>
                {item.amount > 0 && <Check className="size-3.5 stroke-[2.5]" aria-hidden="true" />}
                {item.amount > 0 ? t.ranStatusBadge : t.skippedStatusBadge}
              </span>
              <span className="ms-auto font-semibold text-ink">{money.format(item.amount)}</span>
              <span className="ms-auto whitespace-nowrap text-muted">{money.format(item.remaining)} {t.leftText}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-1 py-3.5 text-xs text-muted sm:text-sm">
            <span>{t.leftoverToMainLabel}</span>
            <span>0.00</span>
          </div>
          <div className="pt-2">
            <div className="border-t-2 border-line" />
            <div className="flex items-center justify-between px-1 py-2.5 text-sm font-bold text-ink">
              <span>{t.totalLabel}</span>
              <span className="inline-flex items-center gap-4">
                {money.format(total)} <Check className="size-3.5 text-success" aria-hidden="true" /> {t.checksOutBadge}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

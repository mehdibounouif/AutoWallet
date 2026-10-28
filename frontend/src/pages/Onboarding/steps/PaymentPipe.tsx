import { Check } from 'lucide-react'
import type { Translations } from '../../../i18n'
import { formatCompactMoney, money } from '../../../utils/format'
import type { Allocation } from './step5Model'

const PIPE_HEIGHT = 120
const PIPE_TOP = 20
const PIPE_END = 188
const PIPE_BEND = 24
const SPLIT_X = [156, 300, 444, 588]

/** Wide-screen illustration of the payment splitting into four envelopes. */
export function PaymentPipe({ amount, allocations, t }: { amount: number; allocations: Allocation[]; t: Translations }) {
  const remainingHeights = allocations.map((item) => (item.remaining / amount) * PIPE_HEIGHT)
  const pipeOutline = [
    `M 60 ${PIPE_TOP}`, `H ${SPLIT_X[3]}`, `V ${PIPE_TOP + remainingHeights[2]}`,
    `H ${SPLIT_X[2]}`, `V ${PIPE_TOP + remainingHeights[1]}`,
    `H ${SPLIT_X[1]}`, `V ${PIPE_TOP + remainingHeights[0]}`,
    `H ${SPLIT_X[0]}`, `V ${PIPE_TOP + PIPE_HEIGHT}`, `H 60`,
    `A 60 60 0 0 1 60 ${PIPE_TOP}`, 'Z',
  ].join(' ')

  return (
    <div className="mx-auto hidden h-[250px] w-[1040px] grid-cols-[minmax(128px,auto)_664px_40px_minmax(132px,auto)] min-[1200px]:grid gap-2">
      <div className="pt-14 pe-4 text-end min-w-0">
        <div
          className="font-bold text-ink tabular-nums break-words"
          title={`${money.format(amount)} MAD`}
        >
          <span className={amount >= 1_000_000 ? 'text-sm' : 'text-lg'}>{money.format(amount)}</span>{' '}
          <span className="text-xs text-muted">MAD</span>
        </div>
        <div className="text-sm text-muted">{t.firstPaymentLabel}</div>
      </div>

      <div className="relative h-[250px] w-[664px]">
        {allocations.slice(0, 3).map((item, index) => (
          <span
            key={item.name}
            className="absolute -top-1 -translate-x-1/2 whitespace-nowrap text-xs text-muted tabular-nums"
            style={{ left: SPLIT_X[index] + 20 }}
            title={`${money.format(item.remaining)} ${t.leftText}`}
          >
            {formatCompactMoney(item.remaining)} {t.leftText}
          </span>
        ))}

        <svg
          className="absolute inset-0 overflow-visible"
          width="664"
          height="190"
          viewBox="0 0 664 190"
          role="img"
          aria-label={`Payment of ${money.format(amount)} MAD split into ${allocations.map((item) => `${item.name}: ${money.format(item.amount)} MAD`).join(', ')}`}
        >
          {allocations.map((item, index) => {
            if (item.amount <= 0) return null
            const width = (item.amount / amount) * PIPE_HEIGHT
            const x = SPLIT_X[index]
            const y = PIPE_TOP + remainingHeights[index]
            const outerRadius = PIPE_BEND + width
            const branch = [
              `M ${x} ${y}`, `A ${outerRadius} ${outerRadius} 0 0 1 ${x + outerRadius} ${y + outerRadius}`,
              `V ${PIPE_END}`, `H ${x + PIPE_BEND}`, `V ${y + width + PIPE_BEND}`,
              `A ${PIPE_BEND} ${PIPE_BEND} 0 0 0 ${x} ${y + width}`, 'Z',
            ].join(' ')
            return <path key={item.name} d={branch} fill={item.color} />
          })}
          <path d={pipeOutline} fill="#8a95d2" />
        </svg>

        {allocations.map((item, index) => (
          <div
            key={item.name}
            className="absolute top-[197px] text-ink max-w-[130px] -translate-x-4"
            style={{ left: SPLIT_X[index] + PIPE_BEND }}
          >
            <div className="flex items-center gap-1 text-sm font-semibold truncate">
              <span style={{ color: item.color }}><item.Icon className="size-4 shrink-0" /></span>
              <span className="truncate">{item.name}</span>
            </div>
            <div
              className="mt-0.5 font-bold tabular-nums truncate leading-5"
              title={`${money.format(item.amount)} MAD`}
            >
              <span className={item.amount >= 1_000_000 ? 'text-xs' : 'text-base'}>{money.format(item.amount)}</span>
            </div>
          </div>
        ))}
      </div>

      <div aria-hidden="true" />
      <div className="pt-[46px] text-ink min-w-0">
        <div className="text-sm text-muted">{t.leftoverToMainLabel}</div>
        <div className="text-base font-bold">0.00</div>
        <div className="mt-2 flex flex-wrap items-center gap-1 text-sm font-semibold break-words" title={`= ${money.format(amount)} MAD`}>
          <span>= {money.format(amount)}</span>
          <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

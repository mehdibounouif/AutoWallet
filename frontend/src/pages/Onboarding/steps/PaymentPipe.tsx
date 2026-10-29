import { Check } from 'lucide-react'
import type { Translations } from '../../../i18n'
import { money } from '../../../utils/format'
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
    <div className="mx-auto hidden h-[250px] w-[1040px] grid-cols-[128px_664px_116px_132px] min-[1200px]:grid">
      <div className="pt-14 pe-4 text-end">
        <div className="text-lg font-bold whitespace-nowrap text-ink">
          {money.format(amount)} <span className="text-xs text-muted">MAD</span>
        </div>
        <div className="text-sm text-muted">{t.firstPaymentLabel}</div>
      </div>

      <div className="relative h-[250px] w-[664px]">
        {allocations.slice(0, 3).map((item, index) => (
          <span key={item.name} className="absolute -top-1 text-xs whitespace-nowrap text-muted" style={{ left: SPLIT_X[index] + 8 }}>
            {money.format(item.remaining)} {t.leftText}
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
          <div key={item.name} className="absolute top-[197px] whitespace-nowrap text-ink" style={{ left: SPLIT_X[index] + PIPE_BEND }}>
            <div className="flex items-center gap-1 text-sm font-semibold">
              <span style={{ color: item.color }}><item.Icon className="size-4" /></span>
              <span>{item.name}</span>
            </div>
            <div className="mt-0.5 text-base leading-5 font-bold">{money.format(item.amount)}</div>
          </div>
        ))}
      </div>

      <div aria-hidden="true" />
      <div className="pt-[46px] text-ink">
        <div className="text-sm text-muted">{t.leftoverToMainLabel}</div>
        <div className="text-base font-bold">0.00</div>
        <div className="mt-2 flex items-center gap-1 text-sm font-semibold">
          = {money.format(amount)} <Check className="size-4 text-success" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

import { RefreshCw } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { envelopeChartColor as chartColor, envelopeMeta } from '../envelopeDisplay'
import { money } from '../../../utils/format'
import type { AnalyticsModel } from './analyticsModel'

const ARC_LENGTH = 282.74

/** Health score, headline totals and the recorded-allocation breakdown. */
export function AnalyticsOverview({ model, onRefresh }: { model: AnalyticsModel; onRefresh: () => void }) {
  return (
    <div className="grid grid-cols-[minmax(220px,0.85fr)_minmax(0,2fr)] gap-5.5 max-[1100px]:grid-cols-[minmax(200px,0.8fr)_minmax(0,1.6fr)] max-[1100px]:gap-4 max-md:grid-cols-1">
      <Card as="section" className="flex flex-col items-center justify-center p-5 text-center max-md:min-h-[280px]">
        <svg viewBox="0 0 220 130" className="w-[200px] max-w-full" role="img" aria-label={`Financial health score ${model.healthScore} out of 100`}>
          <path d="M20 110 A90 90 0 0 1 200 110" fill="none" stroke="#e7ecf2" strokeWidth="14" strokeLinecap="round" />
          <path
            d="M20 110 A90 90 0 0 1 200 110"
            fill="none"
            stroke={model.healthColor}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={ARC_LENGTH}
            strokeDashoffset={ARC_LENGTH * (1 - model.healthScore / 100)}
          />
          <text x="110" y="96" textAnchor="middle" fill="#1a2330" fontSize="38" fontWeight="800">{model.healthScore}</text>
          <text x="110" y="116" textAnchor="middle" fill="#8693a6" fontSize="11" fontWeight="600">OUT OF 100</text>
        </svg>
        <h2 className="mt-3.5 text-base font-extrabold text-ink">{model.healthStatus}</h2>
        <p className="mt-3 max-w-[260px] text-xs leading-relaxed text-subtle">
          Based on Rent lock coverage, Tax reserve readiness, Savings cap progress, and active rules.
        </p>
        <button type="button" onClick={onRefresh} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline">
          <RefreshCw className="size-3.5" aria-hidden="true" />Refresh data
        </button>
      </Card>

      <div className="grid gap-5">
        <div className="grid grid-cols-3 gap-3.5 max-[1100px]:gap-2">
          {[
            { label: 'Income in period', value: model.total, note: `${model.paymentCount} processed payments` },
            { label: 'Average payment', value: model.average, note: 'Across the selected period' },
            { label: 'Largest payment', value: model.largestPayment, note: 'Across the selected period' },
          ].map((stat) => (
            <Card key={stat.label} className="p-3.5">
              <h2 className="text-2xs font-medium text-muted max-md:min-h-[30px] max-md:text-3xs">{stat.label}</h2>
              <strong className="mt-3.5 block text-[clamp(17px,1.6vw,24px)] font-extrabold text-ink tabular-nums max-md:text-[clamp(14px,4vw,20px)] [overflow-wrap:anywhere]">
                {money.format(stat.value)} <small className="text-3xs font-medium text-muted">MAD</small>
              </strong>
              <p className="mt-2 text-3xs leading-snug text-subtle max-md:mt-1">{stat.note}</p>
            </Card>
          ))}
        </div>

        <Card as="section" className="p-5">
          <h2 className="text-base font-extrabold text-ink">Recorded allocations</h2>
          {model.allocationTotal > 0 ? (
            <>
              <div className="mt-5 flex h-[13px] overflow-hidden rounded-full" role="img" aria-label="Recorded allocations by envelope">
                {model.types.map((type) => (model.allocations[type] ?? 0) > 0 && (
                  <span
                    key={type}
                    style={{ width: `${((model.allocations[type] ?? 0) / model.allocationTotal) * 100}%`, backgroundColor: chartColor(type) }}
                    title={`${envelopeMeta[type].name}: ${money.format(model.allocations[type] ?? 0)} MAD`}
                  />
                ))}
              </div>
              <div className="mt-5 grid gap-2.5 text-xs">
                {model.types.map((type) => (
                  <div key={type} className="flex items-center gap-3">
                    <span className="flex flex-1 items-center gap-2 text-muted">
                      <i className="size-[7px] shrink-0 rounded-[2px]" style={{ backgroundColor: chartColor(type) }} aria-hidden="true" />
                      {envelopeMeta[type].name}
                    </span>
                    <strong className="font-semibold text-body tabular-nums">{money.format(model.allocations[type] ?? 0)}</strong>
                    <small className="min-w-10 text-end text-3xs text-subtle tabular-nums">
                      {(((model.allocations[type] ?? 0) / model.allocationTotal) * 100).toFixed(1)}%
                    </small>
                  </div>
                ))}
                <p className="mt-1 text-xs text-muted">Shares of recorded allocations.</p>
              </div>
            </>
          ) : (
            <p className="py-9 text-[13px] leading-relaxed text-subtle">No saved allocations in this period.</p>
          )}
        </Card>
      </div>
    </div>
  )
}

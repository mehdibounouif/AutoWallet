import type { WalletType } from '../../../api/walletTypes'
import { envelopeChartColor as chartColor, envelopeMeta } from '../envelopeDisplay'
import { money } from '../../../utils/format'
import { SectionHeader } from '../../../components/ui/PageHeader'
import { ChartCard } from './ChartCard'
import { ReceivedChart, SplitChart, SplitPie } from '../AnalyticsCharts'
import type { AnalyticsModel } from './analyticsModel'
import { cn } from '../../../utils/cn'

/** All detail charts and their data-table fallbacks. */
export function AnalyticsDetails({ model }: { model: AnalyticsModel }) {
  const { types, points, cumulative, allocations, histogram, payments } = model

  return (
    <>
      <SectionHeader
        title="The details"
        description="Explore chart values with a pointer or keyboard, or open a data table for all values."
        className="mt-9"
      />

      <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
        <ChartCard
          title="Income by envelope"
          description="Saved allocations in each period."
          headers={['Period', ...types.map((type) => `${envelopeMeta[type].name} (MAD)`)]}
          rows={points.map((point) => [point.label, ...types.map((type) => money.format(point.envelopes[type] ?? 0))])}
        >
          <SplitChart points={points} envelopes={types} />
        </ChartCard>

        <ChartCard
          title="Income over time"
          description="Total processed income before splitting, including periods with no payments."
          headers={['Period', 'Income (MAD)']}
          rows={points.map((point) => [point.label, money.format(point.received)])}
        >
          <ReceivedChart points={points} />
        </ChartCard>

        <ChartCard
          title="Allocation shares"
          description="Shares of saved allocations in the selected period. Income without a recorded split is excluded."
          headers={['Envelope', 'Allocated (MAD)']}
          rows={types.map((type) => [envelopeMeta[type].name, money.format(allocations[type] ?? 0)])}
          unavailable={model.allocationTotal <= 0 ? 'No saved allocations in this period.' : undefined}
        >
          <SplitPie allocations={allocations} envelopes={types} />
        </ChartCard>

        <ChartCard
          title="How allocations built up"
          description="Cumulative recorded allocations within this period, not historical balances."
          headers={['Period', ...types.map((type) => `${envelopeMeta[type].name} (MAD)`)]}
          rows={cumulative.map((point) => [point.label, ...types.map((type) => money.format(point.values[type] ?? 0))])}
        >
          <svg className="block max-h-[210px] w-full" viewBox="0 0 440 180" role="img" aria-label="Cumulative allocations by period">
            {[35, 80, 125, 170].map((y) => <line key={y} x1="12" y1={y} x2="430" y2={y} stroke="#e6ebf1" />)}
            {types.map((type) => {
              const coords = cumulative.map((point, index) => [
                12 + (index / Math.max(1, cumulative.length - 1)) * 418,
                170 - ((point.values[type] ?? 0) / model.maxAllocation) * 150,
              ])
              return (
                <g key={type}>
                  <polyline points={coords.map((point) => point.join(',')).join(' ')} fill="none" stroke={chartColor(type)} strokeWidth="2.5" />
                  {coords.map(([x, y], index) => (
                    <circle key={index} cx={x} cy={y} r="3" fill={chartColor(type)} tabIndex={0} aria-label={`${envelopeMeta[type].name}, ${cumulative[index].label}: ${money.format(cumulative[index].values[type] ?? 0)} MAD`}>
                      <title>{envelopeMeta[type].name}: {money.format(cumulative[index].values[type] ?? 0)} MAD</title>
                    </circle>
                  ))}
                </g>
              )
            })}
          </svg>
          <ChartLegend types={types} />
        </ChartCard>

        <ChartCard
          title="Your usual payment size"
          description="The number of payments in each amount range."
          headers={['Amount range (MAD)', 'Payments']}
          rows={histogram.map((bin) => [`${money.format(bin.lower)}–${money.format(bin.upper)}`, bin.count])}
          unavailable={!model.detailed ? model.detailMissing : undefined}
        >
          <div className="flex h-[190px] items-end gap-[18px] overflow-x-auto border-b border-line bg-[repeating-linear-gradient(to_top,transparent_0_44px,#e9edf3_44px_45px)] px-3 pb-6">
            {histogram.map((bin, index) => (
              <div key={index} className="relative flex h-full min-w-[30px] flex-1 flex-col items-center justify-end">
                <div
                  tabIndex={0}
                  className="w-[min(100%,55px)] min-h-px rounded-t bg-[#7280bd]"
                  style={{ height: `${(bin.count / model.maxCount) * 100}%` }}
                  title={`${money.format(bin.lower)}–${money.format(bin.upper)} MAD: ${bin.count} payments`}
                  aria-label={`${money.format(bin.lower)} to ${money.format(bin.upper)} MAD: ${bin.count} payments`}
                />
                <small className="absolute top-[calc(100%+7px)] text-3xs whitespace-nowrap text-subtle">
                  {Math.round(bin.lower).toLocaleString('en-US')}
                </small>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="How much payments swing"
          description={model.detailed ? `Average ${money.format(model.average)} MAD · standard deviation ${money.format(model.deviation)} MAD.` : 'Compare individual payments with their average.'}
          headers={['Reference', 'Amount (MAD)', 'Difference from average (MAD)']}
          rows={payments.map((item) => [item.reference, money.format(item.amount), money.format(item.amount - model.average)])}
          unavailable={!model.detailed ? model.detailMissing : undefined}
        >
          <svg viewBox="0 0 440 150" className="block max-h-[210px] w-full" role="img" aria-label="Payment amounts around the average">
            <rect
              x={12 + (Math.max(0, model.average - model.deviation) / model.incomeMax) * 410}
              y="20"
              width={((Math.min(model.incomeMax, model.average + model.deviation) - Math.max(0, model.average - model.deviation)) / model.incomeMax) * 410}
              height="90"
              rx="6"
              fill="#eff1fa"
            />
            <line x1="12" x2="422" y1="110" y2="110" stroke="#dce3eb" />
            <line x1={12 + (model.average / model.incomeMax) * 410} x2={12 + (model.average / model.incomeMax) * 410} y1="15" y2="115" stroke="#5963b6" strokeDasharray="4 4" />
            {payments.map((item, index) => (
              <circle key={item.id} cx={12 + (item.amount / model.incomeMax) * 410} cy={40 + (index % 3) * 25} r="4" fill="#5963b6" tabIndex={0} aria-label={`${item.reference}: ${money.format(item.amount)} MAD`}>
                <title>{item.reference}: {money.format(item.amount)} MAD</title>
              </circle>
            ))}
          </svg>
        </ChartCard>

        <ChartCard
          title="Tax reserve vs income reference"
          description={model.expectedTax !== null ? `Reference: ${model.taxRate}% of selected gross income. Your rule applies to the remainder, so these can differ.` : 'An active percentage rule for Tax is needed.'}
          headers={['Measure', 'Amount (MAD)']}
          rows={model.expectedTax !== null ? [['Current Tax balance', money.format(model.tax)], [`${model.taxRate}% of selected income`, money.format(model.expectedTax)]] : []}
          unavailable={model.expectedTax === null ? 'No active percentage rule for Tax.' : undefined}
        >
          <div className="grid gap-7 py-4 pb-8">
            {([['Tax reserve', model.tax, '#eb6834'], ['Income reference', model.expectedTax ?? 0, '#aab5c6']] as const).map(([label, value, color]) => (
              <div key={label}>
                <div className="flex flex-wrap justify-between gap-2.5 text-2xs text-muted">
                  <span>{label}</span>
                  <strong>{money.format(Number(value))} MAD</strong>
                </div>
                <span className="mt-2.5 block h-[13px] overflow-hidden rounded-[5px] bg-layer">
                  <i
                    className="block h-full rounded-[inherit]"
                    style={{ width: `${(Number(value) / Math.max(1, model.tax, model.expectedTax ?? 0)) * 100}%`, backgroundColor: String(color) }}
                  />
                </span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title="How much rent Savings covers"
          description={model.coverage !== null ? `${money.format(model.savings)} MAD in Savings ÷ ${money.format(model.rent)} MAD per Rent payment.` : 'A fixed Rent rule is needed.'}
          headers={['Savings (MAD)', 'Rent per payment (MAD)', 'Rent payments covered']}
          rows={model.coverage !== null ? [[money.format(model.savings), money.format(model.rent), model.coverage.toFixed(2)]] : []}
          unavailable={model.coverage === null ? 'Set a fixed Rent rule to see this comparison.' : undefined}
        >
          <div className="py-2">
            <strong className="text-[32px] font-extrabold text-ink">{model.coverage?.toFixed(1)} <small className="text-xs font-normal text-muted">rent payments</small></strong>
            <div className="mt-6 flex gap-1.5">
              {Array.from({ length: 3 }, (_, index) => (
                <span key={index} className="h-[17px] flex-1 overflow-hidden rounded bg-layer">
                  <i className="block h-full bg-[#1baf7a]" style={{ width: `${Math.max(0, Math.min(1, (model.coverage ?? 0) - index)) * 100}%` }} />
                </span>
              ))}
            </div>
            <p className="mt-3.5 text-2xs leading-relaxed text-subtle">Each segment represents one Rent payment. Other living costs are not included.</p>
          </div>
        </ChartCard>
      </div>
    </>
  )
}

function ChartLegend({ types }: { types: WalletType[] }) {
  return (
    <div className={cn('mt-5 flex flex-wrap justify-center gap-x-3.5 gap-y-1.5')}>
      {types.map((type) => (
        <span key={type} className="inline-flex items-center gap-1 text-3xs text-muted">
          <i className="size-[7px] rounded-[2px]" style={{ backgroundColor: chartColor(type) }} aria-hidden="true" />
          {envelopeMeta[type].name}
        </span>
      ))}
    </div>
  )
}

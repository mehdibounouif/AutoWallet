import { useState } from 'react'
import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { LegendPayload } from 'recharts'
import type { Interval, Summary, TimeseriesPoint } from './api'
import { ENVELOPES, envelopeName } from './envelopes'
import type { EnvelopeId } from './envelopes'
import { formatCompact, formatMAD, formatPeriod } from './format'

const GRID_COLOR = '#E7ECF2'
const AXIS_TICK = { fontSize: 12, fill: '#5E6B7E' }
const TOOLTIP_STYLE = { borderRadius: 10, border: '1px solid #DDE3EA', fontSize: 13 }

function moneyTooltip(value: unknown) {
  return formatMAD(Number(value ?? 0))
}

/** Legend names in dark text (yellow text on white is hard to read); grey when the user hid that series. */
function legendText(value: string, entry: LegendPayload) {
  return <span style={{ color: entry.inactive ? '#A0AAB8' : '#3B495D' }}>{value}</span>
}

function ChartCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <figure className="h-full bg-white rounded-2xl border border-[#DDE3EA] p-4 sm:p-5 shadow-sm min-w-0">
      <figcaption>
        <h2 className="text-base font-semibold text-[#1A2330]">{title}</h2>
        <p className="mt-0.5 text-xs text-[#5E6B7E]">{description}</p>
      </figcaption>
      <div className="mt-4">{children}</div>
    </figure>
  )
}

/** Line chart: the money received in each period. */
export function ReceivedChart({ points, interval }: { points: TimeseriesPoint[]; interval: Interval }) {
  const data = points.map((point) => ({ label: formatPeriod(point.period, interval), received: point.received }))

  return (
    <ChartCard title="Money received" description={`The total of your payments, per ${interval}.`}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#DDE3EA' }} minTickGap={16} />
          <YAxis tickFormatter={formatCompact} tick={AXIS_TICK} tickLine={false} axisLine={false} width={48} />
          <Tooltip formatter={moneyTooltip} contentStyle={TOOLTIP_STYLE} />
          <Line
            type="monotone"
            dataKey="received"
            name="Received"
            stroke="#5A64B4"
            strokeWidth={2.5}
            dot={data.length <= 40 ? { r: 3 } : false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** Stacked bar chart: how each period was split. A click on a legend name hides or shows that envelope. */
export function SplitChart({ points, interval, envelopes }: { points: TimeseriesPoint[]; interval: Interval; envelopes: EnvelopeId[] }) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set())
  const data = points.map((point) => ({ label: formatPeriod(point.period, interval), ...point.envelopes }))

  function toggle(entry: LegendPayload) {
    const id = String(entry.dataKey)
    setHidden((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <ChartCard title="Where your money went" description="How each period was split between your envelopes. Click a name to hide or show it.">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: '#DDE3EA' }} minTickGap={16} />
          <YAxis tickFormatter={formatCompact} tick={AXIS_TICK} tickLine={false} axisLine={false} width={48} />
          <Tooltip formatter={moneyTooltip} contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#F3F6FA' }} />
          <Legend onClick={toggle} itemSorter={null} formatter={legendText} wrapperStyle={{ fontSize: 13, cursor: 'pointer' }} />
          {ENVELOPES.filter((envelope) => envelopes.includes(envelope.id)).map((envelope) => (
            <Bar
              key={envelope.id}
              dataKey={envelope.id}
              name={envelope.name}
              stackId="split"
              fill={envelope.color}
              hide={hidden.has(envelope.id)}
              maxBarSize={48}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** Donut chart: the share of each envelope in the period (or, with an envelope filter, that envelope against the rest). */
export function SplitPie({ summary }: { summary: Summary }) {
  const selected = summary.envelope
  const slices = selected
    ? [
        {
          name: envelopeName(selected),
          value: summary.by_envelope[selected] ?? 0,
          fill: ENVELOPES.find((envelope) => envelope.id === selected)?.color,
        },
        {
          name: 'Other envelopes',
          value: Math.max(summary.received - (summary.by_envelope[selected] ?? 0), 0),
          fill: '#DDE3EA',
        },
      ]
    : ENVELOPES.map((envelope) => ({ name: envelope.name, value: summary.by_envelope[envelope.id] ?? 0, fill: envelope.color }))
  const data = slices.filter((slice) => slice.value > 0)
  const total = data.reduce((sum, slice) => sum + slice.value, 0)

  return (
    <ChartCard
      title="Split of the period"
      description={selected ? `The share of these payments that went to ${envelopeName(selected)}.` : 'The share of each envelope in the money received.'}
    >
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke="#FFFFFF" />
          <Tooltip
            formatter={(value) => `${formatMAD(Number(value ?? 0))} (${Math.round((Number(value ?? 0) / total) * 100)}%)`}
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend itemSorter={null} formatter={legendText} wrapperStyle={{ fontSize: 13 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { AnalyticsPoint } from '../../api/analyticsApi'
import type { WalletType } from '../../api/walletTypes'
import { envelopeChartColor, envelopeMeta, money, walletOrder } from './envelopeDisplay'
import { cn } from '../../utils/cn'

type ChartPoint = AnalyticsPoint & { label: string }
const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const AXIS_TICK = { fontSize: 11, fill: '#5e6b7e' }
const GRID_COLOR = '#e7ecf2'
const TOOLTIP_STYLE = { borderRadius: 10, border: '1px solid #dde3ea', backgroundColor: '#fff', color: '#1a2330', fontSize: 13 }
const moneyTooltip = (value: unknown) => `${money.format(Number(value ?? 0))} MAD`

function Legend({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5">{children}</div>
}

export function ReceivedChart({ points }: { points: ChartPoint[] }) {
  return (
    <div className="w-full min-w-0" role="group" aria-label="Income over time chart">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} minTickGap={16} />
          <YAxis tickFormatter={(value) => compactNumber.format(value)} tick={AXIS_TICK} tickLine={false} axisLine={false} width={48} />
          <Tooltip formatter={moneyTooltip} contentStyle={TOOLTIP_STYLE} />
          <Line
            type="monotone"
            dataKey="received"
            name="Received"
            stroke="#5a64b4"
            strokeWidth={2.5}
            dot={points.length <= 40 ? { r: 3 } : false}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SplitChart({ points, envelopes }: { points: ChartPoint[]; envelopes: WalletType[] }) {
  const [hidden, setHidden] = useState<ReadonlySet<WalletType>>(new Set())
  const types = walletOrder.filter((type) => envelopes.includes(type))
  const data = points.map((point) => ({ label: point.label, ...point.envelopes }))
  const toggle = (type: WalletType) => setHidden((current) => {
    const next = new Set(current)
    if (next.has(type)) next.delete(type)
    else next.add(type)
    return next
  })

  return (
    <div className="w-full min-w-0" role="group" aria-label="Income by envelope chart">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_COLOR }} minTickGap={16} />
          <YAxis tickFormatter={(value) => compactNumber.format(value)} tick={AXIS_TICK} tickLine={false} axisLine={false} width={48} />
          <Tooltip formatter={moneyTooltip} contentStyle={TOOLTIP_STYLE} cursor={{ fill: '#f3f6fa' }} />
          {types.map((type) => (
            <Bar key={type} dataKey={type} name={envelopeMeta[type].name} stackId="split" fill={envelopeChartColor(type)} hide={hidden.has(type)} maxBarSize={48} isAnimationActive={false} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <Legend>
        {types.map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={!hidden.has(type)}
            onClick={() => toggle(type)}
            className={cn(
              'inline-flex min-h-8 items-center gap-1.5 rounded px-1.5 text-2xs text-body',
              'aria-[pressed=false]:text-muted aria-[pressed=false]:line-through',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
            )}
          >
            <i className="size-[7px] rounded-[2px]" style={{ backgroundColor: envelopeChartColor(type) }} aria-hidden="true" />
            {envelopeMeta[type].name}
          </button>
        ))}
      </Legend>
    </div>
  )
}

export function SplitPie({ allocations, envelopes }: {
  allocations: Partial<Record<WalletType, number>>
  envelopes: WalletType[]
}) {
  const types = walletOrder.filter((type) => envelopes.includes(type))
  const data = types
    .map((type) => ({ name: envelopeMeta[type].name, value: allocations[type] ?? 0, fill: envelopeChartColor(type) }))
    .filter((slice) => slice.value > 0)
  const total = data.reduce((sum, slice) => sum + slice.value, 0)

  return (
    <div className="w-full min-w-0" role="group" aria-label="Shares of recorded allocations chart">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke="#fff" isAnimationActive={false} />
          <Tooltip
            formatter={(value) => `${moneyTooltip(value)} (${total > 0 ? ((Number(value ?? 0) / total) * 100).toFixed(1) : '0.0'}%)`}
            contentStyle={TOOLTIP_STYLE}
          />
        </PieChart>
      </ResponsiveContainer>
      <Legend>
        {data.map((slice) => (
          <span key={slice.name} className="inline-flex items-center gap-1 text-3xs text-muted">
            <i className="size-[7px] rounded-[2px]" style={{ backgroundColor: slice.fill }} aria-hidden="true" />
            {slice.name}
          </span>
        ))}
      </Legend>
    </div>
  )
}

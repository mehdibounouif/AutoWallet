import { useEffect, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { AccountLayout } from '../../components/account/AccountLayout'
import { ApiError, apiJson, downloadFile } from '../../api/client'
import { useSessionEnded } from '../../hooks/useSessionEnded'
import { filtersQuery } from './api'
import type { Filters, Interval, PaymentEvent, Summary, Timeseries } from './api'
import { ReceivedChart, SplitChart, SplitPie } from './AnalyticsCharts'
import { ENVELOPES, envelopeName } from './envelopes'
import type { EnvelopeId } from './envelopes'
import { addDays, daysInRange, formatDay, formatMAD, toISODay } from './format'
import { useLiveUpdates } from './useLiveUpdates'
import type { LiveStatus } from './useLiveUpdates'

const PRESETS = [
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
  { id: '12m', label: '12 months', days: 365 },
] as const

type Preset = (typeof PRESETS)[number]['id'] | 'custom'

const INTERVALS: { id: Interval; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
]

const CONTROL = 'h-10 rounded-[10px] border border-[#DDE3EA] bg-white px-3 text-sm text-[#1A2330] focus:outline-none focus:ring-2 focus:ring-[#8A95D2]'
const LABEL = 'flex flex-col gap-1 text-xs font-medium text-[#5E6B7E]'

/** The grouping that keeps a chart readable: days up to a month, weeks up to half a year, then months. */
function autoInterval(days: number): Interval {
  if (days <= 31) return 'day'
  if (days <= 183) return 'week'
  return 'month'
}

function lastDays(days: number) {
  const end = toISODay(new Date())
  return { start: addDays(end, -(days - 1)), end }
}

function rangeProblem({ start, end }: Filters): string | null {
  if (!start || !end) return 'Choose a start date and an end date.'
  if (start > end) return 'The start date must be before the end date.'
  return null
}

interface Loaded {
  key: string // the filters these answers are for
  summary?: Summary
  series?: Timeseries
  error?: string
}

export function AnalyticsPage() {
  const sessionEnded = useSessionEnded()
  const [preset, setPreset] = useState<Preset>('30d')
  const [filters, setFilters] = useState<Filters>(() => ({ ...lastDays(30), envelope: '' }))
  const [groupBy, setGroupBy] = useState<Interval>('day')
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [refreshes, setRefreshes] = useState(0)
  const [lastPayment, setLastPayment] = useState<PaymentEvent | null>(null)
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  const problem = rangeProblem(filters)
  const query = filtersQuery(filters)
  const key = `${query}&interval=${groupBy}`

  useEffect(() => {
    if (problem) return
    const controller = new AbortController()
    Promise.all([
      apiJson<Summary>(`/api/analytics/summary?${query}`, { signal: controller.signal }),
      apiJson<Timeseries>(`/api/analytics/timeseries?${key}`, { signal: controller.signal }),
    ])
      .then(([summary, series]) => setLoaded({ key, summary, series }))
      .catch((error: unknown) => {
        if (controller.signal.aborted || sessionEnded(error)) return
        setLoaded({ key, error: error instanceof ApiError ? error.message : 'AutoWallet cannot be reached right now. Please try again.' })
      })
    return () => controller.abort()
  }, [key, query, problem, refreshes, sessionEnded])

  // A payment was processed somewhere (bank poller, another tab…): show it and reload the numbers.
  const live = useLiveUpdates((payment) => {
    setLastPayment(payment)
    setRefreshes((count) => count + 1)
  })

  useEffect(() => {
    if (!lastPayment) return
    const timer = window.setTimeout(() => setLastPayment(null), 8000)
    return () => window.clearTimeout(timer)
  }, [lastPayment])

  function choosePreset(id: Preset, days: number) {
    setPreset(id)
    setFilters((current) => ({ ...current, ...lastDays(days) }))
    setGroupBy(autoInterval(days))
  }

  function chooseDate(field: 'start' | 'end', value: string) {
    const next = { ...filters, [field]: value }
    setPreset('custom')
    setFilters(next)
    if (!rangeProblem(next)) setGroupBy(autoInterval(daysInRange(next.start, next.end)))
  }

  async function exportReport(format: 'csv' | 'pdf') {
    setExporting(format)
    setExportError(null)
    try {
      await downloadFile(`/api/analytics/export?${query}&format=${format}`, `autowallet-report.${format}`)
    } catch (error) {
      if (!sessionEnded(error)) setExportError(error instanceof ApiError ? error.message : 'The export failed. Please try again.')
    } finally {
      setExporting(null)
    }
  }

  const current = loaded?.key === key ? loaded : null
  const loading = !problem && !current
  // While new numbers load, the previous ones stay on screen (dimmed) instead of a blank page.
  const shown = current ?? (loaded?.summary ? loaded : null)

  return (
    <AccountLayout
      title="Analytics"
      subtitle="Your payments and how they were split, for the period you choose."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <LiveBadge status={live} />
          {(['csv', 'pdf'] as const).map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => exportReport(format)}
              disabled={exporting !== null || problem !== null}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-[10px] border border-[#DDE3EA] bg-white text-sm font-medium text-[#1A2330] hover:bg-[#F3F6FA] transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              {exporting === format ? 'Preparing…' : `Export ${format.toUpperCase()}`}
            </button>
          ))}
        </div>
      }
    >
      <section aria-label="Filters" className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl border border-[#DDE3EA] bg-white p-4 shadow-sm">
        <div role="group" aria-label="Period" className="flex flex-wrap gap-1.5">
          {PRESETS.map(({ id, label, days }) => (
            <button
              key={id}
              type="button"
              aria-pressed={preset === id}
              onClick={() => choosePreset(id, days)}
              className={`h-10 px-3 rounded-[10px] text-sm font-medium transition cursor-pointer ${
                preset === id ? 'bg-[#5A64B4] text-white' : 'bg-[#F3F6FA] text-[#3B495D] hover:bg-[#ECEEFA]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className={LABEL}>
          From
          <input type="date" value={filters.start} max={filters.end || undefined} onChange={(e) => chooseDate('start', e.target.value)} className={CONTROL} />
        </label>
        <label className={LABEL}>
          To
          <input type="date" value={filters.end} min={filters.start || undefined} onChange={(e) => chooseDate('end', e.target.value)} className={CONTROL} />
        </label>
        <label className={LABEL}>
          Envelope
          <select
            value={filters.envelope}
            onChange={(e) => setFilters((current) => ({ ...current, envelope: e.target.value as EnvelopeId | '' }))}
            className={CONTROL}
          >
            <option value="">All envelopes</option>
            {ENVELOPES.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className={LABEL}>
          Group by
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as Interval)} className={CONTROL}>
            {INTERVALS.map(({ id, label }) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {(problem || exportError) && (
        <p role="alert" className="mb-6 rounded-xl border border-[#F3C7C8] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B02527]">
          {problem ?? exportError}
        </p>
      )}

      {!problem && !shown && !current?.error && (
        <p role="status" className="py-16 text-center text-sm text-[#5E6B7E]">
          Loading your analytics…
        </p>
      )}

      {!problem && current?.error && (
        <div role="alert" className="rounded-2xl border border-[#DDE3EA] bg-white p-8 text-center">
          <p className="text-sm text-[#B02527]">{current.error}</p>
          <button
            type="button"
            onClick={() => setRefreshes((count) => count + 1)}
            className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] text-white text-sm font-medium cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      )}

      {!problem && !current?.error && shown?.summary && shown.series && (
        <div aria-busy={loading} className={`transition-opacity ${loading ? 'opacity-60' : ''}`}>
          <Overview summary={shown.summary} />

          {shown.summary.payments === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#C9D2DD] bg-white p-10 text-center">
              <p className="font-semibold text-[#1A2330]">
                No payments{shown.summary.envelope ? ` into ${envelopeName(shown.summary.envelope)}` : ''} between{' '}
                {formatDay(shown.summary.start)} and {formatDay(shown.summary.end)}
              </p>
              <p className="mt-1 text-sm text-[#5E6B7E]">
                Choose a longer period, or wait for your next payment: it shows up here as soon as it is processed.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 min-w-0">
                <ReceivedChart points={shown.series.points} interval={shown.series.interval} />
              </div>
              <div className="min-w-0">
                <SplitPie summary={shown.summary} />
              </div>
              <div className="lg:col-span-3 min-w-0">
                <SplitChart
                  points={shown.series.points}
                  interval={shown.series.interval}
                  envelopes={shown.summary.envelope ? [shown.summary.envelope] : ENVELOPES.map(({ id }) => id)}
                />
              </div>
            </div>
          )}

          <Balances summary={shown.summary} />
        </div>
      )}

      <PaymentToast payment={lastPayment} />
    </AccountLayout>
  )
}

function Overview({ summary }: { summary: Summary }) {
  const cards = [
    { label: 'Money received', value: formatMAD(summary.received) },
    { label: 'Payments', value: String(summary.payments) },
    { label: 'Average payment', value: formatMAD(summary.average_payment) },
    summary.envelope
      ? { label: `Into ${envelopeName(summary.envelope)}`, value: formatMAD(summary.by_envelope[summary.envelope] ?? 0) }
      : { label: 'Largest payment', value: formatMAD(summary.largest_payment) },
  ]

  return (
    <section aria-label={`Totals from ${formatDay(summary.start)} to ${formatDay(summary.end)}`}>
      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map(({ label, value }) => (
          <li key={label} className="rounded-2xl border border-[#DDE3EA] bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-xs font-medium text-[#5E6B7E]">{label}</p>
            <p className="mt-1 text-lg sm:text-xl font-bold text-[#1A2330] break-words">{value}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Balances({ summary }: { summary: Summary }) {
  const envelopes = ENVELOPES.filter(({ id }) => summary.balances[id] !== undefined)

  return (
    <section aria-labelledby="balances-title" className="mt-6">
      <h2 id="balances-title" className="text-base font-semibold text-[#1A2330]">
        Envelope balances now
      </h2>
      <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {envelopes.map(({ id, name, ink, tint, icon: Icon }) => (
          <li key={id} className="flex items-center gap-3 rounded-xl border border-[#DDE3EA] bg-white p-3 sm:p-4">
            <span className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center" style={{ backgroundColor: tint, color: ink }}>
              <Icon className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-[#5E6B7E]">{name}</span>
              <span className="block text-sm font-semibold text-[#1A2330] break-words">{formatMAD(summary.balances[id] ?? 0)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

const LIVE_LOOK: Record<LiveStatus, { dot: string; text: string }> = {
  live: { dot: 'bg-[#1F7A3A]', text: 'Live' },
  connecting: { dot: 'bg-[#EDA100]', text: 'Connecting…' },
  offline: { dot: 'bg-[#C62F31]', text: 'Reconnecting…' },
}

function LiveBadge({ status }: { status: LiveStatus }) {
  const { dot, text } = LIVE_LOOK[status]
  return (
    <span
      role="status"
      title="New payments appear here without reloading the page"
      className="inline-flex items-center gap-2 h-9 px-3 rounded-full border border-[#DDE3EA] bg-white text-sm font-medium text-[#3B495D]"
    >
      <span className={`w-2 h-2 rounded-full ${dot} ${status === 'live' ? 'animate-pulse' : ''}`} aria-hidden="true" />
      {text}
    </span>
  )
}

function PaymentToast({ payment }: { payment: PaymentEvent | null }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 left-4 right-4 sm:left-auto sm:w-[380px] z-30">
      {payment && (
        <div className="pointer-events-auto rounded-xl border border-[#DDE3EA] bg-white p-4 shadow-lg">
          <p className="text-sm font-semibold text-[#1A2330]">New payment: {formatMAD(payment.amount)}</p>
          <p className="mt-1 text-xs leading-5 text-[#5E6B7E]">
            {payment.reference} was split:{' '}
            {Object.entries(payment.allocations)
              .map(([id, amount]) => `${envelopeName(id)} ${formatMAD(amount ?? 0)}`)
              .join(' · ')}
            . The charts are up to date.
          </p>
        </div>
      )}
    </div>
  )
}

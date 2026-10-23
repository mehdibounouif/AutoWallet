import { Notice } from '../../components/ui/Notice'
import { Button } from '../../components/ui/Button'
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import type { DashboardData, WalletType } from './dashboardApi'
import { envelopeMeta, walletOrder } from './envelopeDisplay'
import { AnalyticsApiError, analyticsQuery, analyticsRangeError, fetchAnalytics, fetchAnalyticsExport } from '../../api/analyticsApi'
import type { AnalyticsData, AnalyticsFilters, AnalyticsInterval } from '../../api/analyticsApi'

import { AnalyticsResults } from './AnalyticsResults'

const dateLabel = (value: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
function periodStart(period: string, today: string) {
  const date = new Date(`${today}T00:00:00Z`)
  if (period === '30') date.setUTCDate(date.getUTCDate() - 29)
  else { date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() - Number(period) + 1) }
  return date.toISOString().slice(0, 10)
}
interface Props {
  data: DashboardData; onRecord: () => void; recordDisabled: boolean; onAsk: (question: string) => void
  onRules: () => void; onRefresh: () => Promise<void>; onSessionEnded: () => void
}

export function AnalyticsView({ data, onRecord, recordDisabled, onAsk, onRules, onRefresh, onSessionEnded }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [period, setPeriod] = useState('30')
  const [customStart, setCustomStart] = useState(() => periodStart('30', today))
  const [customEnd, setCustomEnd] = useState(today)
  const [interval, setInterval] = useState<AnalyticsInterval>('day')
  const [envelope, setEnvelope] = useState<WalletType | ''>('')
  const [revision, setRevision] = useState(0)
  const filters = useMemo<AnalyticsFilters>(() => ({ start: period === 'custom' ? customStart : periodStart(period, today), end: period === 'custom' ? customEnd : today, envelope, interval }), [period, today, customStart, customEnd, envelope, interval])
  const key = analyticsQuery(filters, true)
  const invalid = analyticsRangeError(filters)
  const [request, setRequest] = useState<{ key: string; data: AnalyticsData | null; loading: boolean; error: string | null }>({ key: '', data: null, loading: true, error: null })
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null)
  const [exportNotice, setExportNotice] = useState<{ key: string; message: string; error: boolean } | null>(null)
  const exportController = useRef<AbortController | null>(null)
  const exportUrl = useRef<string | null>(null)
  const sessionEnded = useEffectEvent(onSessionEnded)

  useEffect(() => {
    if (invalid) return
    const controller = new AbortController()
    queueMicrotask(async () => {
      if (controller.signal.aborted) return
      setRequest(previous => ({ key, data: previous.key === key ? previous.data : null, loading: true, error: null }))
      try {
        const result = await fetchAnalytics(filters, controller.signal)
        if (!controller.signal.aborted) setRequest({ key, data: result, loading: false, error: null })
      } catch (reason) {
        if (controller.signal.aborted) return
        if (reason instanceof AnalyticsApiError && reason.status === 401) { sessionEnded(); return }
        setRequest(previous => ({ key, data: previous.key === key ? previous.data : null, loading: false, error: reason instanceof Error ? reason.message : 'Could not load analytics.' }))
      }
    })
    return () => controller.abort()
  }, [filters, key, invalid, revision, data])

  useEffect(() => () => { exportController.current?.abort(); if (exportUrl.current) URL.revokeObjectURL(exportUrl.current) }, [])
  const report = !invalid && request.key === key ? request.data : null
  const error = request.key === key ? request.error : null
  const loading = !invalid && (request.key !== key || request.loading)
  const refresh = async () => { await onRefresh(); setRevision(value => value + 1) }
  const exportReport = async (format: 'csv' | 'pdf') => {
    if (invalid || exportController.current) return
    const controller = new AbortController()
    exportController.current = controller
    setExporting(format); setExportNotice(null)
    try {
      const blob = await fetchAnalyticsExport(filters, format, controller.signal)
      if (controller.signal.aborted) return
      if (exportUrl.current) URL.revokeObjectURL(exportUrl.current)
      exportUrl.current = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = exportUrl.current
      link.download = `autowallet-report-${filters.start}-to-${filters.end}${filters.envelope ? `-${filters.envelope}` : ''}.${format}`
      document.body.append(link); link.click(); link.remove()
      setExportNotice({ key, message: `Your ${format.toUpperCase()} report download has started.`, error: false })
    } catch (reason) {
      if (controller.signal.aborted) return
      if (reason instanceof AnalyticsApiError && reason.status === 401) { onSessionEnded(); return }
      setExportNotice({ key, message: reason instanceof Error ? reason.message : 'Could not download the report.', error: true })
    } finally { exportController.current = null; if (!controller.signal.aborted) setExporting(null) }
  }

  return <div className="workspace-page analytics-page">
    <header className="workspace-heading analytics-heading"><div><h1>Analytics</h1><p>{invalid ? 'Choose a date range to explore your income.' : `${dateLabel(filters.start)} – ${dateLabel(filters.end)}`}{report ? ` · ${report.summary.payments} processed ${report.summary.payments === 1 ? 'payment' : 'payments'}` : ''}</p></div><div className="analytics-actions"><Button variant="secondary" className="dashboard-secondary-button" disabled={loading} onClick={() => void refresh()} aria-label="Refresh analytics"><RefreshCw size={14} />Refresh</Button><Button variant="secondary" className="dashboard-secondary-button" disabled={Boolean(invalid || exporting)} onClick={() => void exportReport('csv')}><Download size={14} />{exporting === 'csv' ? 'Preparing…' : 'Export CSV'}</Button><Button variant="secondary" className="dashboard-secondary-button" disabled={Boolean(invalid || exporting)} onClick={() => void exportReport('pdf')}><Download size={14} />{exporting === 'pdf' ? 'Preparing…' : 'Export PDF'}</Button></div></header>
    <fieldset className="analytics-filters" disabled={Boolean(exporting)}><legend className="sr-only">Analytics filters</legend>
      <label>Period<select aria-label="Analytics period" value={period} onChange={event => { if (event.target.value === 'custom') { setCustomStart(filters.start); setCustomEnd(filters.end) }; setPeriod(event.target.value) }}><option value="30">Last 30 days</option><option value="3">Last 3 calendar months</option><option value="6">Last 6 calendar months</option><option value="12">Last 12 calendar months</option><option value="custom">Custom dates</option></select></label>
      <label>From<input type="date" value={filters.start} max={filters.end || undefined} onChange={event => { setCustomStart(event.target.value); setCustomEnd(filters.end); setPeriod('custom') }} /></label>
      <label>To<input type="date" value={filters.end} min={filters.start || undefined} onChange={event => { setCustomEnd(event.target.value); setCustomStart(filters.start); setPeriod('custom') }} /></label>
      <label>Group by<select aria-label="Analytics interval" value={interval} onChange={event => setInterval(event.target.value as AnalyticsInterval)}><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select></label>
      <label>Envelope<select aria-label="Analytics envelope" value={envelope} onChange={event => setEnvelope(event.target.value as WalletType | '')}><option value="">All envelopes</option>{walletOrder.map(type => <option key={type} value={type}>{envelopeMeta[type].name}</option>)}</select></label>
    </fieldset>
    <p className="workspace-note">Report dates use UTC. Activity dates use your device’s local time.</p>
    {invalid && <p className="workspace-field-error" role="alert">{invalid}</p>}
    {exportNotice?.key === key && <p className={exportNotice.error ? 'workspace-field-error' : 'workspace-note'} role={exportNotice.error ? 'alert' : 'status'}>{exportNotice.message}</p>}
    {!invalid && error && <Notice as="div" tone="error" className="workspace-banner workspace-banner--error" role="alert"><span>{error}{report && ' The last loaded values are shown below.'}</span><button onClick={() => setRevision(value => value + 1)}>Retry analytics</button></Notice>}
    {loading && <p className="workspace-note" role="status">{report ? 'Updating analytics…' : 'Loading analytics…'}</p>}
    {report && <AnalyticsResults report={report} data={data} filters={filters} onRecord={onRecord} recordDisabled={recordDisabled} onAsk={onAsk} onRules={onRules} onRefresh={() => void refresh()} />}
  </div>
}

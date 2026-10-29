import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import type { DashboardData, WalletType } from './dashboardApi'
import { envelopeMeta, walletOrder } from './envelopeDisplay'
import { AnalyticsApiError, analyticsQuery, analyticsRangeError, fetchAnalytics, fetchAnalyticsExport } from '../../api/analyticsApi'
import type { AnalyticsData, AnalyticsFilters, AnalyticsInterval } from '../../api/analyticsApi'
import { useTranslation } from '../../i18n'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Select } from '../../components/ui/Field'
import { Page } from '../../components/ui/Page'
import { PageHeader } from '../../components/ui/PageHeader'
import { AnalyticsResults } from './analytics/AnalyticsResults'
import { dateLabel, periodStart } from './analytics/analyticsDates'

interface AnalyticsViewProps {
  data: DashboardData
  onAsk: (question: string) => void
  onRules: () => void
  onRefresh: () => Promise<void>
  onSessionEnded: () => void
}

export function AnalyticsView({ data, onAsk, onRules, onRefresh, onSessionEnded }: AnalyticsViewProps) {
  const { t } = useTranslation()
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [period, setPeriod] = useState('30')
  const [customStart, setCustomStart] = useState(() => periodStart('30', today))
  const [customEnd, setCustomEnd] = useState(today)
  const [interval, setInterval] = useState<AnalyticsInterval>('day')
  const [envelope, setEnvelope] = useState<WalletType | ''>('')
  const [revision, setRevision] = useState(0)
  const filters = useMemo<AnalyticsFilters>(() => ({
    start: period === 'custom' ? customStart : periodStart(period, today),
    end: period === 'custom' ? customEnd : today,
    envelope,
    interval,
  }), [period, today, customStart, customEnd, envelope, interval])
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
      setRequest((previous) => ({ key, data: previous.key === key ? previous.data : null, loading: true, error: null }))
      try {
        const result = await fetchAnalytics(filters, controller.signal)
        if (!controller.signal.aborted) setRequest({ key, data: result, loading: false, error: null })
      } catch (reason) {
        if (controller.signal.aborted) return
        if (reason instanceof AnalyticsApiError && reason.status === 401) { sessionEnded(); return }
        setRequest((previous) => ({
          key,
          data: previous.key === key ? previous.data : null,
          loading: false,
          error: reason instanceof Error ? reason.message : 'Could not load analytics.',
        }))
      }
    })
    return () => controller.abort()
  }, [filters, key, invalid, revision, data])

  useEffect(() => () => {
    exportController.current?.abort()
    if (exportUrl.current) URL.revokeObjectURL(exportUrl.current)
  }, [])

  const report = !invalid && request.key === key ? request.data : null
  const error = request.key === key ? request.error : null
  const loading = !invalid && (request.key !== key || request.loading)
  const refresh = async () => { await onRefresh(); setRevision((value) => value + 1) }

  const exportReport = async (format: 'csv' | 'pdf') => {
    if (invalid || exportController.current) return
    const controller = new AbortController()
    exportController.current = controller
    setExporting(format)
    setExportNotice(null)
    try {
      const blob = await fetchAnalyticsExport(filters, format, controller.signal)
      if (controller.signal.aborted) return
      if (exportUrl.current) URL.revokeObjectURL(exportUrl.current)
      exportUrl.current = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = exportUrl.current
      link.download = `autowallet-report-${filters.start}-to-${filters.end}${filters.envelope ? `-${filters.envelope}` : ''}.${format}`
      document.body.append(link)
      link.click()
      link.remove()
      setExportNotice({ key, message: `Your ${format.toUpperCase()} report download has started.`, error: false })
    } catch (reason) {
      if (controller.signal.aborted) return
      if (reason instanceof AnalyticsApiError && reason.status === 401) { onSessionEnded(); return }
      setExportNotice({ key, message: reason instanceof Error ? reason.message : 'Could not download the report.', error: true })
    } finally {
      exportController.current = null
      if (!controller.signal.aborted) setExporting(null)
    }
  }

  return (
    <Page>
      <PageHeader
        title={t.analyticsHeading}
        description={
          invalid
            ? 'Choose a date range to explore your income.'
            : `${dateLabel(filters.start)} – ${dateLabel(filters.end)}${report ? ` · ${report.summary.payments} processed ${report.summary.payments === 1 ? 'payment' : 'payments'}` : ''}`
        }
        actions={
          <>
            <Button variant="secondary" disabled={loading} onClick={() => void refresh()} aria-label="Refresh analytics" icon={<RefreshCw className="size-3.5" aria-hidden="true" />}>
              {t.refreshAnalyticsBtn}
            </Button>
            <Button variant="secondary" disabled={Boolean(invalid || exporting)} onClick={() => void exportReport('csv')} icon={<Download className="size-3.5" aria-hidden="true" />}>
              {exporting === 'csv' ? t.preparingExportBtn : t.exportCsvBtn}
            </Button>
            <Button variant="secondary" disabled={Boolean(invalid || exporting)} onClick={() => void exportReport('pdf')} icon={<Download className="size-3.5" aria-hidden="true" />}>
              {exporting === 'pdf' ? t.preparingExportBtn : t.exportPdfBtn}
            </Button>
          </>
        }
      />

      <fieldset className="mb-5 grid grid-cols-[minmax(160px,1.3fr)_repeat(4,minmax(0,1fr))] gap-3 max-[1100px]:grid-cols-3 max-md:grid-cols-2 max-[359px]:grid-cols-1" disabled={Boolean(exporting)}>
        <legend className="sr-only">Analytics filters</legend>
        <Field label={t.periodDropdownLabel}>
          <Select
            aria-label="Analytics period"
            value={period}
            onChange={(event) => {
              if (event.target.value === 'custom') { setCustomStart(filters.start); setCustomEnd(filters.end) }
              setPeriod(event.target.value)
            }}
          >
            <option value="30">{t.last30DaysOption}</option>
            <option value="3">{t.last3MonthsOption}</option>
            <option value="6">{t.last6MonthsOption}</option>
            <option value="12">{t.last12MonthsOption}</option>
            <option value="custom">{t.customDatesOption}</option>
          </Select>
        </Field>
        <Field label="From">
          <input
            type="date"
            value={filters.start}
            max={filters.end || undefined}
            onChange={(event) => { setCustomStart(event.target.value); setCustomEnd(filters.end); setPeriod('custom') }}
            className="block h-10 w-full min-w-0 rounded-lg border border-line bg-surface px-2.5 text-xs text-body focus:border-action-primary focus:ring-2 focus:ring-action-primary/20 focus:outline-none"
          />
        </Field>
        <Field label="To">
          <input
            type="date"
            value={filters.end}
            min={filters.start || undefined}
            onChange={(event) => { setCustomEnd(event.target.value); setCustomStart(filters.start); setPeriod('custom') }}
            className="block h-10 w-full min-w-0 rounded-lg border border-line bg-surface px-2.5 text-xs text-body focus:border-action-primary focus:ring-2 focus:ring-action-primary/20 focus:outline-none"
          />
        </Field>
        <Field label="Group by">
          <Select aria-label="Analytics interval" value={interval} onChange={(event) => setInterval(event.target.value as AnalyticsInterval)}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </Select>
        </Field>
        <Field label="Envelope">
          <Select aria-label="Analytics envelope" value={envelope} onChange={(event) => setEnvelope(event.target.value as WalletType | '')}>
            <option value="">All envelopes</option>
            {walletOrder.map((type) => <option key={type} value={type}>{envelopeMeta[type].name}</option>)}
          </Select>
        </Field>
      </fieldset>

      {invalid && <p className="mb-4 text-xs font-medium text-action-danger" role="alert">{invalid}</p>}
      {exportNotice?.key === key && (
        <p className={exportNotice.error ? 'mb-4 text-xs font-medium text-action-danger' : 'mb-4 text-xs text-muted'} role={exportNotice.error ? 'alert' : 'status'}>
          {exportNotice.message}
        </p>
      )}
      {!invalid && error && (
        <Alert
          tone="danger"
          role="alert"
          className="mb-4"
          action={<button type="button" onClick={() => setRevision((value) => value + 1)} className="shrink-0 font-semibold underline">Retry analytics</button>}
        >
          {error}{report && ' The last loaded values are shown below.'}
        </Alert>
      )}
      {loading && <p className="mb-4 text-xs text-muted" role="status">{report ? 'Updating analytics…' : 'Loading analytics…'}</p>}

      {report && (
        <AnalyticsResults
          report={report}
          data={data}
          filters={filters}
          onAsk={onAsk}
          onRules={onRules}
          onRefresh={() => void refresh()}
        />
      )}
    </Page>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Check, Download } from 'lucide-react'
import { SettingsApiError, securityFromExport, settingsRequest } from '../../../api/settingsApi'
import type { SecurityInfo } from '../../../api/settingsApi'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { buttonClass } from '../../../components/ui/styles'
import { Select } from '../../../components/ui/Field'
import { SettingsCard } from '../SettingsCard'

/** GDPR JSON/CSV export with local validation and download. */
export function DataExportCard({ online, onSecurityInfo, onSessionEnded }: {
  online: boolean
  onSecurityInfo: (info: SecurityInfo) => void
  onSessionEnded: () => void
}) {
  const [format, setFormat] = useState<'json' | 'csv'>('json')
  const [prepared, setPrepared] = useState<{ url: string; format: string; message: string } | null>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const controller = useRef<AbortController | null>(null)
  const exportUrl = useRef<string | null>(null)
  const inFlight = useRef(false)

  useEffect(() => () => {
    controller.current?.abort()
    if (exportUrl.current) URL.revokeObjectURL(exportUrl.current)
  }, [])

  const prepareExport = async () => {
    if (inFlight.current || !online) return
    inFlight.current = true
    const next = new AbortController()
    controller.current = next
    setExporting(true)
    setError(null)
    try {
      const response = await settingsRequest(`/api/gdpr/export?format=${format}`, { signal: next.signal })
      const type = response.headers.get('Content-Type') || ''
      if (!(format === 'json' ? type.includes('application/json') : type.includes('application/zip'))) {
        throw new Error('The service did not return a valid export file.')
      }
      const blob = await response.blob()
      if (!blob.size) throw new Error('The service returned an empty export. Please try again.')
      let message = 'Your CSV tables are ready in a ZIP file.'
      if (format === 'json') {
        const data = await blob.text().then((text) => {
          try {
            return JSON.parse(text)
          } catch {
            throw new Error('The service did not return a valid JSON export.')
          }
        })
        const security = securityFromExport(data)
        if (!security || !Array.isArray(data.payments) || !Array.isArray(data.rules) || !Array.isArray(data.envelopes)) {
          throw new Error('The service returned an incomplete export. Please try again.')
        }
        onSecurityInfo(security)
        message = `Your export is ready. It includes ${data.payments.length} payments, ${data.rules.length} rules and ${data.envelopes.length} envelopes.`
      }
      if (next.signal.aborted) return
      if (exportUrl.current) URL.revokeObjectURL(exportUrl.current)
      exportUrl.current = URL.createObjectURL(blob)
      setPrepared({ url: exportUrl.current, format, message })
    } catch (reason) {
      if (next.signal.aborted) return
      if (reason instanceof SettingsApiError && reason.status === 401) {
        onSessionEnded()
        return
      }
      setError(reason instanceof Error ? reason.message : 'Could not prepare your export. Please try again.')
    } finally {
      inFlight.current = false
      setExporting(false)
    }
  }

  return (
    <SettingsCard title="Download your data" description="A file with your profile, envelopes, rules and payments.">
      {prepared && (
        <Alert tone="success" className="mt-4" icon={<Check className="size-4" />}>
          {prepared.message}
        </Alert>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Select
          aria-label="Export format"
          value={format}
          disabled={exporting}
          className="w-auto"
          onChange={(event) => {
            setFormat(event.target.value as 'json' | 'csv')
            setPrepared(null)
            setError(null)
            if (exportUrl.current) {
              URL.revokeObjectURL(exportUrl.current)
              exportUrl.current = null
            }
          }}
        >
          <option value="json">JSON</option>
          <option value="csv">CSV (ZIP)</option>
        </Select>
        {prepared ? (
          <a
            className={buttonClass()}
            href={prepared.url}
            download={`autowallet-my-data.${prepared.format === 'csv' ? 'zip' : 'json'}`}
          >
            <Download className="size-4" aria-hidden="true" />
            Download export ({prepared.format === 'csv' ? 'ZIP' : 'JSON'})
          </a>
        ) : (
          <Button onClick={() => void prepareExport()} disabled={exporting || !online} icon={<Download className="size-4" aria-hidden="true" />}>
            {exporting ? 'Preparing…' : 'Request export'}
          </Button>
        )}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        The file is prepared here for download. The account service may also email you a confirmation.
      </p>
      {error && <p className="mt-3 text-xs font-medium text-action-danger" role="alert">{error}</p>}
    </SettingsCard>
  )
}

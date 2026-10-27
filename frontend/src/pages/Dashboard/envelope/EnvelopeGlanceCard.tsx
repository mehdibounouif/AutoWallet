import { Card } from '../../../components/ui/Card'
import { useTranslation } from '../../../i18n'
import type { GlanceRow } from './envelopeDetailData'

/** Compact key-value facts for the selected envelope. */
export function EnvelopeGlanceCard({ rows }: { rows: GlanceRow[] }) {
  const { t } = useTranslation()

  return (
    <Card as="section" className="min-h-[275px] p-6 max-md:min-h-0 max-md:p-4" aria-labelledby="envelope-glance-heading">
      <h2 id="envelope-glance-heading" className="text-base font-extrabold text-ink max-md:text-[15px]">{t.atAGlance}</h2>
      <dl className="mt-3">
        {rows.map((row) => (
          <div key={row.label} className="flex min-h-[42px] items-baseline justify-between gap-3.5 border-b border-line py-3 text-xs">
            <dt className="text-muted">{row.label}</dt>
            <dd className="text-end font-bold text-body tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

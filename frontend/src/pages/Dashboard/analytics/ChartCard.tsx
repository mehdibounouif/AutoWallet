import { useState } from 'react'
import type { ReactNode } from 'react'
import { BarChart3, ChevronDown } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { useTranslation } from '../../../i18n'
import { cn } from '../../../utils/cn'

type Row = (string | number)[]

/** Chart container with an accessible, collapsible data table fallback. */
export function ChartCard({ title, description, headers, rows, children, unavailable }: {
  title: string
  description: string
  headers: string[]
  rows: Row[]
  children?: ReactNode
  unavailable?: string
}) {
  const { t } = useTranslation()
  const [showData, setShowData] = useState(false)

  return (
    <Card as="section" className="flex min-w-0 flex-col p-5 sm:p-6">
      <h3 className="text-base font-extrabold text-ink">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted">{description}</p>
      {unavailable ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 p-6 text-center text-xs leading-relaxed text-subtle">
          <BarChart3 className="size-5" aria-hidden="true" />
          <p>{unavailable}</p>
        </div>
      ) : (
        <>
          <div className="mt-5 flex-1">{children}</div>
          <button
            type="button"
            onClick={() => setShowData((value) => !value)}
            aria-expanded={showData}
            className="mt-4 flex items-center gap-1 self-start text-2xs font-semibold text-accent hover:underline"
          >
            {showData ? t.hideDataBtn : t.showDataBtn}
            <ChevronDown className={cn('size-3.5 transition-transform', showData && 'rotate-180')} aria-hidden="true" />
          </button>
          {showData && (
            <div className="mt-4 max-h-[300px] overflow-auto">
              <table className="w-full border-collapse text-start text-3xs">
                <caption className="sr-only">{title}</caption>
                <thead>
                  <tr>{headers.map((header) => <th key={header} className="border-b border-line px-2 py-2 text-start font-semibold whitespace-nowrap text-muted">{header}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => <td key={cellIndex} className="border-b border-line px-2 py-2 whitespace-nowrap">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

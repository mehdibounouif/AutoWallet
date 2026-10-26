import { ArrowDown, ArrowUp, ChevronRight } from 'lucide-react'
import type { DashboardTransaction } from '../dashboardApi'
import { money } from '../../../utils/format'
import { PaymentSplitBar, PaymentStatus } from '../PaymentDisplay'
import { paymentDate } from '../paymentUtils'
import { useTranslation } from '../../../i18n'
import type { ActivityGroup, SortDirection, SortField } from './activityUtils'
import { accessiblePaymentLabel, monthTitle } from './activityUtils'

interface ActivityTableProps {
  groups: ActivityGroup[]
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
  onSelect: (payment: DashboardTransaction) => void
}

/** Desktop activity table with sortable headers and month group rows. */
export function ActivityTable({ groups, sortField, sortDirection, onSort, onSelect }: ActivityTableProps) {
  const { t } = useTranslation()

  const sortHeader = (field: SortField, label: string) => (
    <button type="button" onClick={() => onSort(field)} className="inline-flex min-h-9 items-center gap-1.5 font-bold text-muted hover:text-accent">
      {label}
      {field === sortField
        ? sortDirection === 'desc'
          ? <ArrowDown className="size-3.5" aria-hidden="true" />
          : <ArrowUp className="size-3.5" aria-hidden="true" />
        : <span className="text-base leading-none text-subtle" aria-hidden="true">↕</span>}
    </button>
  )

  return (
    <table className="mx-6 mb-4 w-[calc(100%-3rem)] table-fixed border-collapse text-xs max-[1050px]:mx-[18px] max-[1050px]:w-[calc(100%-2.25rem)] max-md:hidden">
      <colgroup>
        <col className="w-[17%] max-[1050px]:w-[24%]" />
        <col className="w-[14%] max-[1050px]:w-[18%]" />
        <col className="w-[13%] max-[1050px]:w-[20%]" />
        <col className="w-[46%] max-[1050px]:w-[12%]" />
        <col className="w-[10%] max-[1050px]:w-[22%]" />
        <col className="w-5" />
      </colgroup>
      <thead>
        <tr>
          <th scope="col" aria-sort={sortField === 'reference' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined} className="h-12 px-2 text-start">{sortHeader('reference', t.thReference)}</th>
          <th scope="col" aria-sort={sortField === 'received' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined} className="h-12 px-2 text-start">{sortHeader('received', t.thReceived)}</th>
          <th scope="col" aria-sort={sortField === 'amount' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined} className="h-12 px-2 text-end">{sortHeader('amount', t.thAmountMad)}</th>
          <th scope="col" className="h-12 px-2 text-start text-muted">{t.thSplit}</th>
          <th scope="col" aria-sort={sortField === 'status' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined} className="h-12 px-2 text-start">{sortHeader('status', t.thStatus)}</th>
          <th scope="col" className="h-12 pe-0"><span className="sr-only">{t.thOpenSr}</span></th>
        </tr>
      </thead>
      <tbody>
        {groups.map(([key, items]) => (
          <MonthRows key={key} label={monthTitle(key)} items={items} onSelect={onSelect} />
        ))}
      </tbody>
    </table>
  )
}

function MonthRows({ label, items, onSelect }: {
  label: string
  items: DashboardTransaction[]
  onSelect: (payment: DashboardTransaction) => void
}) {
  return (
    <>
      <tr>
        <th colSpan={3} scope="rowgroup" className="h-14 px-2 pt-3.5 pb-1 ps-0 text-start text-xs font-extrabold text-body">{label}</th>
        <td colSpan={3} className="h-14 px-2 pt-3.5 pb-1 pe-0 text-end text-2xs text-muted">
          {items.length} {items.length === 1 ? 'payment' : 'payments'} · {money.format(items.reduce((sum, payment) => sum + payment.amount, 0))}
        </td>
      </tr>
      {items.map((payment) => (
        <tr key={payment.id} className="h-14 cursor-pointer hover:bg-canvas" onClick={() => onSelect(payment)}>
          <td className="overflow-hidden border-b border-line px-2 ps-0 text-ellipsis whitespace-nowrap">
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); onSelect(payment) }}
              aria-label={`View payment ${accessiblePaymentLabel(payment)}`}
              className="max-w-full truncate font-mono text-2xs font-bold text-body hover:text-accent hover:underline"
            >
              {payment.reference}
            </button>
          </td>
          <td className="overflow-hidden border-b border-line px-2 text-ellipsis whitespace-nowrap text-muted">{paymentDate(payment.created_at) || '—'}</td>
          <td className="border-b border-line px-2 text-end font-bold whitespace-nowrap text-body tabular-nums">{money.format(payment.amount)}</td>
          <td className="border-b border-line px-2"><PaymentSplitBar payment={payment} /></td>
          <td className="border-b border-line px-2"><PaymentStatus status={payment.status} /></td>
          <td className="border-b border-line py-3 pe-0 text-end text-muted"><ChevronRight className="size-4" aria-hidden="true" /></td>
        </tr>
      ))}
    </>
  )
}

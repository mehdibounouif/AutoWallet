import { useDeferredValue, useMemo, useState } from 'react'
import { Mail } from 'lucide-react'
import type { DashboardTransaction } from './dashboardApi'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Page } from '../../components/ui/Page'
import { PageHeader } from '../../components/ui/PageHeader'
import { Skeleton } from '../../components/ui/Skeleton'
import { useTranslation } from '../../i18n'
import { ActivityFilters } from './activity/ActivityFilters'
import { ActivityMobileList } from './activity/ActivityMobileList'
import { ActivityTable } from './activity/ActivityTable'
import type { ActivityFilterState, ActivityGroup, SortDirection, SortField } from './activity/activityUtils'
import {
  defaultActivityFilters,
  hasActiveFilters,
  localDateKey,
  monthKey,
} from './activity/activityUtils'

export function ActivitySkeleton() {
  return (
    <Page as="section" aria-label="Loading activity" role="status">
      <div className="mb-6 space-y-2.5">
        <Skeleton className="h-7 w-[150px]" />
        <Skeleton className="h-3 w-[240px]" />
      </div>
      <Skeleton className="mb-5 h-6 w-[340px]" />
      <Card className="px-6 pt-4 pb-5">
        <div className="grid min-h-12 grid-cols-[17%_14%_13%_46%_10%] items-center text-xs font-bold text-muted">
          <span>Reference</span><span>Received</span><span>Amount (MAD)</span><span>Split</span><span>Status</span>
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="grid min-h-14 grid-cols-[17%_14%_13%_46%_10%] items-center border-t border-line">
            {[0, 1, 2, 3, 4].map((cell) => <Skeleton key={cell} className="h-2.5 w-[70%]" />)}
          </div>
        ))}
      </Card>
      <span className="sr-only">Loading payments</span>
    </Page>
  )
}

export function ActivityView({ payments, onSelect }: {
  payments: DashboardTransaction[]
  onSelect: (payment: DashboardTransaction) => void
}) {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<ActivityFilterState>(defaultActivityFilters)
  const [sortField, setSortField] = useState<SortField>('received')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const deferredSearch = useDeferredValue(filters.search)
  const hasFilters = hasActiveFilters(filters)

  const updateFilters = (patch: Partial<ActivityFilterState>) => {
    setFilters((previous) => ({ ...previous, ...patch }))
  }
  const clearFilters = () => setFilters(defaultActivityFilters)

  const sortBy = (field: SortField) => {
    if (field === sortField) setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
    else {
      setSortField(field)
      setSortDirection(field === 'received' ? 'desc' : 'asc')
    }
  }

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    const min = filters.minAmount ? Number(filters.minAmount) : null
    const max = filters.maxAmount ? Number(filters.maxAmount) : null
    return payments.filter((payment) => {
      if (query && !payment.reference.toLowerCase().includes(query)) return false
      if ((filters.startDate || filters.endDate) && !payment.created_at) return false
      if (payment.created_at) {
        const received = localDateKey(payment.created_at)
        if (filters.startDate && received < filters.startDate) return false
        if (filters.endDate && received > filters.endDate) return false
      }
      if (min !== null && payment.amount < min) return false
      if (max !== null && payment.amount > max) return false
      if (filters.envelope) {
        const allocated = payment.allocations?.[filters.envelope] ?? 0
        if (allocated <= 0) return false
      }
      if (filters.status && payment.status !== filters.status) return false
      return true
    })
  }, [payments, deferredSearch, filters.startDate, filters.endDate, filters.minAmount, filters.maxAmount, filters.envelope, filters.status])

  const groups = useMemo<ActivityGroup[]>(() => {
    const sorted = [...filtered].sort((a, b) => {
      const result = sortField === 'received'
        ? (a.created_at ? new Date(a.created_at).getTime() : 0) - (b.created_at ? new Date(b.created_at).getTime() : 0)
        : sortField === 'amount' ? a.amount - b.amount : a[sortField].localeCompare(b[sortField])
      return (sortDirection === 'asc' ? result : -result) || a.reference.localeCompare(b.reference)
    })
    const byMonth = new Map<string, DashboardTransaction[]>()
    for (const payment of sorted) {
      const key = monthKey(payment)
      const items = byMonth.get(key)
      if (items) items.push(payment)
      else byMonth.set(key, [payment])
    }
    return [...byMonth.entries()].sort(([a], [b]) => (a === 'unknown' ? 1 : b === 'unknown' ? -1 : b.localeCompare(a)))
  }, [filtered, sortField, sortDirection])

  return (
    <Page as="section" aria-labelledby="activity-heading">
      <PageHeader id="activity-heading" title={t.activityHeading} description={t.activitySubheading} />

      <ActivityFilters
        payments={payments}
        state={filters}
        onChange={updateFilters}
        onClear={clearFilters}
        hasFilters={hasFilters}
        count={filtered.length}
      />

      <Card className="overflow-hidden max-md:border-0 max-md:bg-transparent">
        {filtered.length === 0 ? (
          <EmptyState
            bordered={false}
            icon={<Mail className="size-9" />}
            title={payments.length ? 'No payments match these filters.' : t.noPaymentsYetHeading}
            description={payments.length ? 'Try a wider date range or fewer filters.' : t.noPaymentsYetDescription}
            action={hasFilters ? <Button variant="secondary" onClick={clearFilters}>{t.clearAllFilters}</Button> : undefined}
            className="min-h-[360px] max-md:min-h-[285px]"
          />
        ) : (
          <>
            <ActivityTable
              groups={groups}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={sortBy}
              onSelect={onSelect}
            />
            <ActivityMobileList groups={groups} onSelect={onSelect} />
          </>
        )}
      </Card>
    </Page>
  )
}

import { useMemo, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import type { DashboardTransaction } from '../dashboardApi'
import { envelopeMeta } from '../envelopeDisplay'
import { money } from '../../../utils/format'
import { useDismissibleLayer } from '../../../hooks/useDismissibleLayer'
import { useTranslation } from '../../../i18n'
import { cn } from '../../../utils/cn'
import type { ActivityFilterState, FilterName } from './activityUtils'
import { dateRangeLabel, walletFilterOrder } from './activityUtils'

interface ActivityFiltersProps {
  payments: DashboardTransaction[]
  state: ActivityFilterState
  onChange: (patch: Partial<ActivityFilterState>) => void
  onClear: () => void
  hasFilters: boolean
  count: number
}

const menuClass = 'absolute start-0 top-[calc(100%+7px)] z-20 w-60 rounded-xl border border-line bg-surface p-3.5 text-xs shadow-popover max-md:fixed max-md:inset-x-4 max-md:bottom-[calc(82px+env(safe-area-inset-bottom))] max-md:top-auto max-md:max-h-[65dvh] max-md:w-auto max-md:overflow-y-auto'
const menuTitleClass = 'mb-2 block text-xs font-bold text-ink'
const menuInputClass = 'mt-1 block h-9 w-full rounded-md border border-line bg-surface px-2 text-xs text-ink focus:border-action-primary focus:ring-2 focus:ring-action-primary/20 focus:outline-none max-md:h-11'
const resetClass = 'mt-3 text-2xs font-bold text-accent hover:underline'
const optionClass = 'block w-full rounded px-2 py-1.5 text-start text-xs text-body hover:bg-selected hover:text-accent aria-pressed:bg-selected aria-pressed:text-accent max-md:min-h-11'
const chipClass = 'inline-flex min-h-7 items-center gap-1.5 rounded-full border border-dashed border-line-strong bg-surface px-2.5 text-xs font-semibold whitespace-nowrap text-body hover:border-accent hover:text-accent'

/** Search + date/amount/envelope/status filter chips. */
export function ActivityFilters({ payments, state, onChange, onClear, hasFilters, count }: ActivityFiltersProps) {
  const { t } = useTranslation()
  const [openFilter, setOpenFilter] = useState<FilterName | null>(null)
  const filtersRef = useDismissibleLayer(openFilter !== null, () => setOpenFilter(null))
  const availableRange = useMemo(() => dateRangeLabel(payments), [payments])

  const toggle = (name: FilterName) => setOpenFilter((current) => (current === name ? null : name))
  const selectedDate = state.startDate || state.endDate
    ? `${state.startDate || 'Any'} – ${state.endDate || 'Any'}`
    : availableRange
  const amountLabel = state.minAmount || state.maxAmount
    ? `${state.minAmount ? `From ${money.format(Number(state.minAmount))}` : ''}${state.minAmount && state.maxAmount ? ' · ' : ''}${state.maxAmount ? `To ${money.format(Number(state.maxAmount))}` : ''}`
    : 'Amount'

  const clear = () => {
    setOpenFilter(null)
    onClear()
  }

  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
      <label className="flex h-11 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-muted focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 md:h-9 md:w-64">
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <input
          value={state.search}
          onChange={(event) => onChange({ search: event.target.value })}
          placeholder={t.searchActivityPlaceholder}
          aria-label="Search payments by reference"
          type="search"
          className="w-full min-w-0 border-0 bg-transparent text-[13px] text-body outline-none placeholder:text-subtle"
        />
      </label>

      <div ref={filtersRef} className="relative flex flex-1 flex-wrap items-center gap-2">
        <div className="relative">
          <button type="button" onClick={() => toggle('date')} aria-expanded={openFilter === 'date'} className={chipClass}>
            {selectedDate}<ChevronDown className="size-3" aria-hidden="true" />
          </button>
          {openFilter === 'date' && (
            <div className={menuClass}>
              <strong className={menuTitleClass}>Received date</strong>
              <label className="mt-2 block text-2xs font-bold text-muted">From
                <input type="date" value={state.startDate} max={state.endDate || undefined} onChange={(event) => onChange({ startDate: event.target.value })} className={menuInputClass} />
              </label>
              <label className="mt-2 block text-2xs font-bold text-muted">To
                <input type="date" value={state.endDate} min={state.startDate || undefined} onChange={(event) => onChange({ endDate: event.target.value })} className={menuInputClass} />
              </label>
              <button type="button" className={resetClass} onClick={() => { onChange({ startDate: '', endDate: '' }); setOpenFilter(null) }}>All dates</button>
              {!payments.some((payment) => payment.created_at) && <p className="mt-2 text-2xs text-muted">Payment dates are unavailable.</p>}
            </div>
          )}
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggle('amount')} aria-expanded={openFilter === 'amount'} className={cn(chipClass, (state.minAmount || state.maxAmount) && 'border-transparent bg-selected text-accent')}>
            {state.minAmount || state.maxAmount ? '' : '+ '}{amountLabel}<ChevronDown className="size-3" aria-hidden="true" />
          </button>
          {openFilter === 'amount' && (
            <div className={menuClass}>
              <strong className={menuTitleClass}>Amount (MAD)</strong>
              <label className="mt-2 block text-2xs font-bold text-muted">Minimum
                <input type="number" min="0" step="0.01" value={state.minAmount} onChange={(event) => onChange({ minAmount: event.target.value })} placeholder="0.00" className={menuInputClass} />
              </label>
              <label className="mt-2 block text-2xs font-bold text-muted">Maximum
                <input type="number" min={state.minAmount || '0'} step="0.01" value={state.maxAmount} onChange={(event) => onChange({ maxAmount: event.target.value })} placeholder="Any" className={menuInputClass} />
              </label>
              <button type="button" className={resetClass} onClick={() => { onChange({ minAmount: '', maxAmount: '' }); setOpenFilter(null) }}>Clear amount</button>
            </div>
          )}
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggle('envelope')} aria-expanded={openFilter === 'envelope'} className={cn(chipClass, Boolean(state.envelope) && 'border-transparent bg-selected text-accent')}>
            {state.envelope ? envelopeMeta[state.envelope].name : '+ Envelope'}<ChevronDown className="size-3" aria-hidden="true" />
          </button>
          {openFilter === 'envelope' && (
            <div className={cn(menuClass, 'w-[205px]')}>
              <strong className={menuTitleClass}>Envelope received</strong>
              {walletFilterOrder.map((type) => (
                <button key={type} type="button" onClick={() => { onChange({ envelope: type }); setOpenFilter(null) }} aria-pressed={state.envelope === type} className={optionClass}>
                  {envelopeMeta[type].name}
                </button>
              ))}
              <button type="button" className={resetClass} onClick={() => { onChange({ envelope: '' }); setOpenFilter(null) }}>All envelopes</button>
              <p className="mt-2 text-2xs leading-snug text-muted">Envelope filtering needs payment split data.</p>
            </div>
          )}
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggle('status')} aria-expanded={openFilter === 'status'} className={cn(chipClass, Boolean(state.status) && 'border-transparent bg-selected text-accent')}>
            {state.status ? state.status[0].toUpperCase() + state.status.slice(1) : '+ Status'}<ChevronDown className="size-3" aria-hidden="true" />
          </button>
          {openFilter === 'status' && (
            <div className={cn(menuClass, 'w-[205px]')}>
              <strong className={menuTitleClass}>Payment status</strong>
              {(['processed', 'pending', 'failed'] as const).map((value) => (
                <button key={value} type="button" onClick={() => { onChange({ status: value }); setOpenFilter(null) }} aria-pressed={state.status === value} className={optionClass}>
                  {value[0].toUpperCase() + value.slice(1)}
                </button>
              ))}
              <button type="button" className={resetClass} onClick={() => { onChange({ status: '' }); setOpenFilter(null) }}>All statuses</button>
            </div>
          )}
        </div>

        {hasFilters && (
          <button type="button" onClick={clear} className="inline-flex items-center gap-1 px-1 py-1 text-xs font-semibold whitespace-nowrap text-accent hover:underline">
            {t.clearAllFilters} <X className="size-3" aria-hidden="true" />
          </button>
        )}
        <span className="border-s border-line ps-2 text-xs whitespace-nowrap text-muted" aria-live="polite">
          {count} {count === 1 ? 'payment' : 'payments'}
        </span>
      </div>
    </div>
  )
}

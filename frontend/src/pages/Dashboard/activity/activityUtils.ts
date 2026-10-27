import type { DashboardTransaction, WalletType } from '../dashboardApi'
import { paymentDate } from '../paymentUtils'
import { money } from '../../../utils/format'

export type FilterName = 'date' | 'amount' | 'envelope' | 'status'
export type SortField = 'reference' | 'received' | 'amount' | 'status'
export type SortDirection = 'asc' | 'desc'
export type ActivityGroup = [string, DashboardTransaction[]]

export interface ActivityFilterState {
  search: string
  startDate: string
  endDate: string
  minAmount: string
  maxAmount: string
  envelope: WalletType | ''
  status: DashboardTransaction['status'] | ''
}

export const defaultActivityFilters: ActivityFilterState = {
  search: '',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
  envelope: '',
  status: '',
}

export const walletFilterOrder: WalletType[] = ['rent', 'tax', 'savings', 'free', 'main']

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })
const rangeFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

export function hasActiveFilters(state: ActivityFilterState) {
  return Boolean(state.search.trim() || state.startDate || state.endDate || state.minAmount || state.maxAmount || state.envelope || state.status)
}

export function localDateKey(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function monthKey(payment: DashboardTransaction) {
  if (!payment.created_at) return 'unknown'
  return localDateKey(payment.created_at).slice(0, 7)
}

export function monthTitle(key: string) {
  if (key === 'unknown') return 'Date unavailable'
  const [year, month] = key.split('-').map(Number)
  return monthFormatter.format(new Date(year, month - 1, 1))
}

export function dateRangeLabel(payments: DashboardTransaction[]) {
  const dates = payments
    .flatMap((payment) => (payment.created_at ? [new Date(payment.created_at)] : []))
    .sort((a, b) => a.getTime() - b.getTime())
  if (!dates.length || dates.length !== payments.length) return 'All dates'
  const first = dates[0]
  const last = dates[dates.length - 1]
  return first.getFullYear() === last.getFullYear()
    ? `${rangeFormatter.format(first)} – ${rangeFormatter.format(last)}, ${last.getFullYear()}`
    : `${rangeFormatter.format(first)}, ${first.getFullYear()} – ${rangeFormatter.format(last)}, ${last.getFullYear()}`
}

export function accessiblePaymentLabel(payment: DashboardTransaction) {
  return `${payment.reference}, ${money.format(payment.amount)} MAD, ${payment.created_at ? paymentDate(payment.created_at) : 'date unavailable'}, ${payment.status}`
}

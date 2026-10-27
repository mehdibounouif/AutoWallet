import type { DashboardData, DashboardTransaction } from '../dashboardApi'
import type { SplitAmounts } from '../dashboardSplit'
import { previewSplit } from '../dashboardSplit'
import { hasCompleteSplit } from '../paymentUtils'
import { intlLocales } from '../../../i18n/languages'

export const PREVIEW_AMOUNT = 8500

export interface HomeModel {
  firstName: string
  latest: DashboardTransaction | undefined
  freeBalance: number
  setAside: number
  totalBalance: number
  historical: DashboardTransaction | undefined
  ribbonAllocations: SplitAmounts
  activeRules: number
  dateFormatted: string
}

/** Derived Home values, kept out of the view's render body. */
export function buildHomeModel(data: DashboardData, lang: 'en' | 'fr' | 'ar'): HomeModel {
  const locale = intlLocales[lang]
  const freeBalance = data.wallets.find((item) => item.wallet_type === 'free')?.balance ?? 0
  const setAside = data.wallets
    .filter((item) => item.wallet_type === 'rent' || item.wallet_type === 'tax' || item.wallet_type === 'savings')
    .reduce((sum, item) => sum + item.balance, 0)
  const historical = data.transactions.find((item) => item.status === 'processed' && hasCompleteSplit(item))

  return {
    firstName: data.user.full_name.trim().split(/\s+/)[0] || 'there',
    latest: data.transactions.find((payment) => payment.status === 'processed'),
    freeBalance,
    setAside,
    totalBalance: data.wallets.reduce((sum, item) => sum + item.balance, 0),
    historical,
    ribbonAllocations: historical
      ? { main: 0, rent: 0, tax: 0, savings: 0, free: 0, ...historical.allocations }
      : previewSplit(PREVIEW_AMOUNT, data.rules, data.wallets),
    activeRules: data.rules.filter((item) => item.is_active).length,
    dateFormatted: new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date()),
  }
}

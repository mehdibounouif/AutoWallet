import {
  Check,
  CheckCircle2,
  FlaskConical,
  Home,
  Landmark,
  Loader2,
  PiggyBank,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { Translations } from '../../../i18n'

interface Props {
  simulatedAmount: string
  setSimulatedAmount: (value: string) => void
  rentAmount: string
  taxPercent: string
  savingsPercent: string
  savingsCap: string
  hasSimulated: boolean
  isSimulating: boolean
  onSimulate: () => void
  t: Translations
}

interface Allocation {
  name: string
  amount: number
  remaining: number
  rule: string
  color: string
  Icon: ComponentType<{ className?: string }>
}

const parseAmount = (value: string) => {
  const trimmed = value.trim()
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(trimmed)) return NaN
  return Number(trimmed.replaceAll(',', ''))
}
const cents = (value: number) => Math.round(value * 100) / 100
const money = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function getAllocations(
  amount: number,
  rentAmount: string,
  taxPercent: string,
  savingsPercent: string,
  savingsCap: string,
  t: Translations,
): Allocation[] {
  const rent = Math.min(amount, parseAmount(rentAmount))
  const afterRent = cents(amount - rent)
  const tax = cents((afterRent * parseAmount(taxPercent)) / 100)
  const afterTax = cents(afterRent - tax)
  const savings = Math.min(
    cents((afterTax * parseAmount(savingsPercent)) / 100),
    parseAmount(savingsCap),
  )
  const free = cents(afterTax - savings)

  return [
    {
      name: t.rentName,
      amount: rent,
      remaining: afterRent,
      rule: t.fixedAmountType,
      color: '#2A78D6',
      Icon: Home,
    },
    {
      name: t.taxName,
      amount: tax,
      remaining: afterTax,
      rule: `${parseAmount(taxPercent)}% ${t.percentOfLeftType}`,
      color: '#EB6834',
      Icon: Landmark,
    },
    {
      name: t.savingsName,
      amount: savings,
      remaining: free,
      rule: `${parseAmount(savingsPercent)}% ${t.percentOfLeftType}`,
      color: '#1BAF7A',
      Icon: PiggyBank,
    },
    {
      name: t.freeToSpendName,
      amount: free,
      remaining: 0,
      rule: `100% ${t.percentOfLeftType}`,
      color: '#EDA100',
      Icon: ShoppingBag,
    },
  ]
}

export function Step5TryPayment({
  simulatedAmount,
  setSimulatedAmount,
  rentAmount,
  taxPercent,
  savingsPercent,
  savingsCap,
  hasSimulated,
  isSimulating,
  onSimulate,
  t,
}: Props) {
  const amount = parseAmount(simulatedAmount)
  const validAmount = Number.isFinite(amount) && amount > 0
  const allocations = validAmount
    ? getAllocations(amount, rentAmount, taxPercent, savingsPercent, savingsCap, t)
    : []
  const total = cents(allocations.reduce((sum, item) => sum + item.amount, 0))
  const segmentCenters = allocations.map((item, index) => {
    const precedingAmount = allocations
      .slice(0, index)
      .reduce((sum, allocation) => sum + allocation.amount, 0)
    return ((precedingAmount + item.amount / 2) / amount) * 1000
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn w-full px-2 sm:px-4">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A2330] tracking-tight">
          {t.tryPaymentTitle}
        </h1>
        <p className="text-sm sm:text-base text-[#5E6B7E] leading-relaxed">
          {t.tryPaymentSubtitle}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-3 w-full">
        <div className="w-full sm:w-80 space-y-1.5 text-left rtl:text-right">
          <label
            htmlFor="simulated-amount"
            className="block text-xs font-semibold uppercase tracking-wider text-[#5E6B7E]"
          >
            {t.amountInputLabel}
          </label>
          <div className="relative flex items-center">
            <input
              id="simulated-amount"
              type="text"
              inputMode="decimal"
              value={simulatedAmount}
              onChange={(event) => setSimulatedAmount(event.target.value)}
              disabled={isSimulating}
              aria-invalid={Boolean(simulatedAmount) && !validAmount}
              className="w-full h-11 pl-4 pr-16 rtl:pl-16 rtl:pr-4 rounded-[10px] border border-[#DDE3EA] bg-white text-[#1A2330] font-semibold text-base focus:outline-none focus:border-[#5A64B4] focus:ring-3 focus:ring-[#5A64B4]/15 transition shadow-2xs"
            />
            <span className="absolute right-3 rtl:right-auto rtl:left-3 text-xs font-bold text-[#5E6B7E] bg-[#F3F6FA] px-2 py-0.5 rounded">
              MAD
            </span>
          </div>
        </div>
        <button
          type="button"
          id={hasSimulated ? 'simulate-again-btn' : 'simulate-payment-btn'}
          onClick={onSimulate}
          disabled={isSimulating || !validAmount}
          className={`w-full sm:w-auto h-11 px-6 rounded-[10px] font-medium text-sm transition cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2 shrink-0 ${hasSimulated ? 'border border-[#DDE3EA] bg-white hover:bg-[#F3F6FA] text-[#3B495D]' : 'bg-[#5A64B4] hover:bg-[#4A53A0] active:bg-[#3F4789] text-white'}`}
        >
          {isSimulating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : hasSimulated ? (
            <RefreshCw className="w-4 h-4" />
          ) : (
            <FlaskConical className="w-4 h-4" />
          )}
          <span>
            {isSimulating
              ? t.simulatingPayment
              : hasSimulated
                ? t.simulateAgainButton
                : t.simulatePaymentButton}
          </span>
        </button>
      </div>

      {hasSimulated && validAmount && (
        <>
          <div
            id="split-success-alert"
            role="status"
            aria-live="polite"
            className="p-3.5 sm:p-4 rounded-xl bg-[#E8F8F0] border border-[#BCE8D3] text-[#0E7A4A] text-xs sm:text-sm flex items-center justify-center gap-2.5 max-w-2xl mx-auto shadow-2xs animate-fadeIn"
          >
            <CheckCircle2 className="w-5 h-5 text-[#1BAF7A] shrink-0" />
            <p className="font-medium leading-relaxed text-center sm:text-left rtl:sm:text-right">
              {t.splitSuccessAlert.replace('{amount}', money(amount))}
            </p>
          </div>
          <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-[#DDE3EA] p-6 sm:p-8 space-y-8 shadow-xs animate-fadeIn">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-[#5E6B7E] pb-2 border-b border-[#EDF0F4] select-none">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#1A2330]">{t.firstPaymentLabel}</span>
                  <span className="font-bold text-[#1A2330] text-base">{money(amount)} MAD</span>
                </div>
                <span className="font-semibold text-[#1A2330]">
                  {t.leftoverToMainLabel}: 0.00 MAD
                </span>
              </div>
              <div className="w-full h-8 rounded-lg overflow-hidden flex bg-[#EDF0F4] shadow-inner p-1 gap-1">
                {allocations
                  .filter((item) => item.amount > 0)
                  .map((item) => (
                    <div
                      key={item.name}
                      style={{
                        width: `${(item.amount / amount) * 100}%`,
                        backgroundColor: item.color,
                      }}
                      className="h-full rounded-md transition-all duration-700 flex items-center justify-center min-w-0"
                      title={`${item.name}: ${money(item.amount)} MAD`}
                    >
                      <span className="hidden md:inline text-[11px] font-semibold text-white truncate px-1">
                        {item.name}
                      </span>
                    </div>
                  ))}
              </div>
              <svg
                className="hidden md:block w-full h-10 overflow-visible"
                viewBox="0 0 1000 40"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {allocations.map((item, index) => {
                  const start = segmentCenters[index]
                  const end = (index + 0.5) * 250
                  return (
                    <path
                      key={item.name}
                      d={`M ${start} 0 C ${start} 20, ${end} 20, ${end} 40`}
                      fill="none"
                      stroke={item.color}
                      strokeWidth="2.5"
                      strokeOpacity="0.55"
                    />
                  )
                })}
              </svg>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 md:pt-0 text-xs">
                {allocations.map((item) => (
                  <div
                    key={item.name}
                    className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] border-t-[3px] md:border-t flex flex-col gap-1.5 transition-shadow hover:shadow-xs"
                    style={{ borderTopColor: item.color }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.color}1A`, color: item.color }}
                      >
                        <item.Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-semibold text-[#1A2330] text-sm truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="font-bold text-[#1A2330] text-base">
                      {money(item.amount)} MAD
                    </div>
                    <div className="text-[11px] text-[#5E6B7E]">
                      {money(item.remaining)} {t.leftText}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="max-w-[720px] mx-auto w-full pt-8 border-t border-[#EDF0F4]">
              <div className="py-3 px-1 flex items-center justify-between border-b border-[#DDE3EA]">
                <span className="font-semibold text-sm text-[#1A2330]">{t.firstPaymentLabel}</span>
                <span className="font-bold text-sm text-[#1A2330]">{money(amount)} MAD</span>
              </div>
              <div className="divide-y divide-[#DDE3EA] text-xs sm:text-sm">
                {allocations.map((item, index) => (
                  <div
                    key={item.name}
                    className="py-3.5 px-1 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <span className="w-4 text-[#8C9BAE] font-medium text-xs">{index + 1}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1A2330]">{item.name}</span>
                        <span className="bg-[#EDF0F4] text-[#5E6B7E] text-[11px] px-2.5 py-0.5 rounded-full font-normal">
                          {item.rule}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-6">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${item.amount > 0 ? 'text-[#1F7A3A]' : 'text-[#5E6B7E]'}`}
                      >
                        {item.amount > 0 && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                        {item.amount > 0 ? t.ranStatusBadge : t.skippedStatusBadge}
                      </span>
                      <div className="text-right rtl:text-left min-w-[70px]">
                        <div className="font-bold text-[#1A2330]">{money(item.amount)}</div>
                        <div className="text-[11px] text-[#5E6B7E]">
                          {money(item.remaining)} {t.leftText}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="py-3.5 px-1 flex items-center justify-between text-xs sm:text-sm text-[#5E6B7E]">
                  <span>{t.leftoverToMainLabel}</span>
                  <span>0.00</span>
                </div>
                <div className="pt-2">
                  <div className="border-t-2 border-[#DDE3EA]" />
                  <div className="py-2.5 px-1 flex items-center justify-between text-sm font-bold text-[#1A2330]">
                    <span>{t.totalLabel}</span>
                    <span className="inline-flex items-center gap-4">
                      {money(total)} <Check className="w-3.5 h-3.5 text-[#1F7A3A]" />{' '}
                      {t.checksOutBadge}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

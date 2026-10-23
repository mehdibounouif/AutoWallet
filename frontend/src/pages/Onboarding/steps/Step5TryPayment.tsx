import { TextInput } from '../../../components/ui/TextInput'
import {
  Check,
  CheckCircle2,
  FlaskConical,
  Home,
  Landmark,
  Loader2,
  PiggyBank,
  ShoppingBag,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { previewPayment } from '../../Dashboard/dashboardSplit'
import type { DashboardRule } from '../../Dashboard/dashboardApi'
import { walletTypes } from '../../../api/walletTypes'
import { money as moneyFormatter, parseAmount } from '../../../utils/format'
import '../paymentPreview.css'

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

}

interface Allocation {
  name: string
  amount: number
  remaining: number
  rule: string
  color: string
  Icon: ComponentType<{ className?: string }>
}

const money = (value: number) => moneyFormatter.format(value)

function getAllocations(
  amount: number,
  rentAmount: string,
  taxPercent: string,
  savingsPercent: string,
  savingsCap: string,
): Allocation[] {
  // Match the backend starter rules and reuse the Dashboard/Sandbox engine.
  // Keep fractional cents during allocation; format to two decimals for display.
  const base = { is_active: true, fixed_amount: null, percentage: null, condition_field: null, condition_operator: null, condition_value: null }
  const rules: DashboardRule[] = [
    { ...base, id: 'rent', name: 'Rent lock', rule_type: 'lock_fixed', target_wallet: 'rent', priority: 1, fixed_amount: parseAmount(rentAmount), condition_field: 'rent_balance', condition_operator: '<', condition_value: parseAmount(rentAmount) },
    { ...base, id: 'tax', name: 'Tax', rule_type: 'percentage_remainder', target_wallet: 'tax', priority: 2, percentage: parseAmount(taxPercent) },
    { ...base, id: 'savings', name: 'Savings (capped)', rule_type: 'percentage_remainder', target_wallet: 'savings', priority: 3, percentage: parseAmount(savingsPercent), condition_field: 'savings_balance', condition_operator: '<', condition_value: parseAmount(savingsCap) },
    { ...base, id: 'free', name: 'Free to spend', rule_type: 'percentage_remainder', target_wallet: 'free', priority: 4, percentage: 100 },
  ]
  const { allocations: { rent, tax, savings, free }, steps } = previewPayment(amount, rules,
    walletTypes.map(wallet_type => ({ id: wallet_type, wallet_type, balance: 0 })))
  const afterRent = steps[0]?.remaining ?? amount
  const afterTax = steps[1]?.remaining ?? afterRent

  return [
    {
      name: "Rent",
      amount: rent,
      remaining: afterRent,
      rule: "Fixed amount",
      color: '#2A78D6',
      Icon: Home,
    },
    {
      name: "Tax",
      amount: tax,
      remaining: afterTax,
      rule: `${parseAmount(taxPercent)}% of what's left`,
      color: '#EB6834',
      Icon: Landmark,
    },
    {
      name: "Savings",
      amount: savings,
      remaining: free,
      rule: `${parseAmount(savingsPercent)}% of what's left`,
      color: '#1BAF7A',
      Icon: PiggyBank,
    },
    {
      name: "Free to spend",
      amount: free,
      remaining: 0,
      rule: "100% of what's left",
      color: '#EDA100',
      Icon: ShoppingBag,
    },
  ]
}

const PIPE_HEIGHT = 120
const PIPE_TOP = 20
const PIPE_END = 188
const PIPE_BEND = 24
const SPLIT_X = [156, 300, 444, 588]

function PaymentPipe({ amount, allocations }: { amount: number; allocations: Allocation[] }) {
  const largeAmount = money(amount).length > 12
  const remainingHeights = allocations.map((item) => (item.remaining / amount) * PIPE_HEIGHT)
  const pipeOutline = [
    `M 60 ${PIPE_TOP}`,
    `H ${SPLIT_X[3]}`,
    `V ${PIPE_TOP + remainingHeights[2]}`,
    `H ${SPLIT_X[2]}`,
    `V ${PIPE_TOP + remainingHeights[1]}`,
    `H ${SPLIT_X[1]}`,
    `V ${PIPE_TOP + remainingHeights[0]}`,
    `H ${SPLIT_X[0]}`,
    `V ${PIPE_TOP + PIPE_HEIGHT}`,
    `H 60`,
    `A 60 60 0 0 1 60 ${PIPE_TOP}`,
    'Z',
  ].join(' ')

  return (
    <div className={`onboarding-payment-pipe ${largeAmount ? 'onboarding-payment-pipe--large' : ''} hidden min-[1200px]:grid grid-cols-[128px_664px_116px_132px] w-[1040px] mx-auto h-[250px]`}>
      <div className="onboarding-pipe-amount pt-[56px] pr-4 text-right">
        <div className="whitespace-nowrap text-lg font-bold text-brand-ink">
          {money(amount)} <span className="text-xs text-[#65748C]">MAD</span>
        </div>
        <div className="text-sm text-[#65748C]">First payment</div>
      </div>

      <div className="onboarding-pipe-graphic relative w-[664px] h-[250px]">
        <div className="onboarding-pipe-remaining">
          {allocations.slice(0, 3).map((item, index) => (
            <span
              key={item.name}
              className="absolute -top-1 whitespace-nowrap text-xs text-[#65748C]"
              style={{ left: SPLIT_X[index] + 8 }}
            >
              {money(item.remaining)} left
            </span>
          ))}
        </div>

        <svg
          className="absolute inset-0 overflow-visible"
          width="664"
          height="190"
          viewBox={`0 0 ${largeAmount ? 752 : 664} 190`}
          role="img"
          aria-label={`Payment of ${money(amount)} MAD split into ${allocations.map((item) => `${item.name}: ${money(item.amount)} MAD`).join(', ')}`}
        >
          {allocations.map((item, index) => {
            if (item.amount <= 0) return null
            const width = (item.amount / amount) * PIPE_HEIGHT
            const x = SPLIT_X[index]
            const y = PIPE_TOP + remainingHeights[index]
            const outerRadius = PIPE_BEND + width
            const branch = [
              `M ${x} ${y}`,
              `A ${outerRadius} ${outerRadius} 0 0 1 ${x + outerRadius} ${y + outerRadius}`,
              `V ${PIPE_END}`,
              `H ${x + PIPE_BEND}`,
              `V ${y + width + PIPE_BEND}`,
              `A ${PIPE_BEND} ${PIPE_BEND} 0 0 0 ${x} ${y + width}`,
              'Z',
            ].join(' ')
            return <path key={item.name} d={branch} fill={item.color} />
          })}
          <path d={pipeOutline} fill="#8A95D2" />
        </svg>

        <div className="onboarding-pipe-labels">
          {allocations.map((item, index) => (
            <div
              key={item.name}
              className="absolute top-[197px] whitespace-nowrap text-brand-ink"
              style={{ left: SPLIT_X[index] + PIPE_BEND }}
            >
              <div className="flex items-center gap-1 text-sm font-semibold">
                <span style={{ color: item.color }}><item.Icon className="w-4 h-4" /></span>
                <span>{item.name}</span>
              </div>
              <div className="mt-0.5 text-base font-bold leading-5">{money(item.amount)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="onboarding-pipe-spacer" aria-hidden="true" />
      <div className="onboarding-pipe-total pt-[46px] text-brand-ink">
        <div className="text-sm text-[#52617A]">Leftover → Main</div>
        <div className="text-base font-bold">0.00</div>
        <div className="mt-2 flex items-center gap-1 text-sm font-semibold">
          = {money(amount)} <Check className="h-4 w-4 text-status-success" />
        </div>
      </div>
    </div>
  )
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
}: Props) {
  const amount = parseAmount(simulatedAmount)
  const validAmount = Number.isFinite(amount) && amount > 0
  const largeAmount = validAmount && money(amount).length > 12
  const allocations = validAmount
    ? getAllocations(amount, rentAmount, taxPercent, savingsPercent, savingsCap)
    : []
  const total = allocations.reduce((sum, item) => sum + item.amount, 0)
  return (
    <div className={`onboarding-payment ${largeAmount ? 'onboarding-payment--large' : ''} max-w-[1200px] mx-auto space-y-6 animate-fadeIn w-full`}>
      <div className="text-center space-y-2 max-w-[640px] mx-auto pb-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink tracking-tight">
          See your first payment split
        </h1>
        <p className="text-sm sm:text-base text-brand-muted leading-relaxed">
          Simulate a payment to watch your rules work. It stays in Sandbox, so nothing real changes.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-3 w-full">
        <div className="w-full sm:w-80 space-y-1.5 text-left">
          <label
            htmlFor="simulated-amount"
            className="block text-sm font-medium text-brand-ink"
          >
            Amount
          </label>
          <div className="relative flex items-center">
            <TextInput appearance="auth"
              id="simulated-amount"
              type="text"
              inputMode="decimal"
              value={simulatedAmount}
              onChange={(event) => setSimulatedAmount(event.target.value)}
              disabled={isSimulating}
              aria-invalid={Boolean(simulatedAmount) && !validAmount}
              className="text-base"
            />
            <span className="absolute right-3 text-sm font-semibold text-[#65748C]">
              MAD
            </span>
          </div>
        </div>
        <button
          type="button"
          id={hasSimulated ? 'simulate-again-btn' : 'simulate-payment-btn'}
          onClick={onSimulate}
          disabled={isSimulating || !validAmount}
          className={`w-full sm:w-auto h-[52px] px-5 rounded-[12px] font-medium text-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 ${hasSimulated ? 'bg-[#ECEFF4] hover:bg-[#E1E6EE] text-brand-ink' : 'bg-action-primary hover:bg-action-primary-hover active:bg-action-primary-pressed text-white'}`}
        >
          {isSimulating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FlaskConical className="w-5 h-5" />
          )}
          <span>
            {isSimulating
              ? "Simulating…"
              : hasSimulated
                ? "Simulate again"
                : "Simulate payment"}
          </span>
        </button>
      </div>

      {hasSimulated && validAmount && (
        <>
          <div
            id="split-success-alert"
            role="status"
            aria-live="polite"
            className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#E4F3E8] text-status-success text-sm flex items-center gap-3 max-w-[640px] mx-auto animate-fadeIn"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="leading-relaxed">
              {`Split with your 4 rules. It adds up to ${money(amount)}. Your real balances didn't change.`}
            </p>
          </div>
          <div className="w-full bg-white rounded-2xl border border-border-subtle px-5 sm:px-8 pt-11 pb-12 animate-fadeIn">
            <PaymentPipe amount={amount} allocations={allocations} />

            <div className="min-[1200px]:hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 text-sm">
                <span className="font-semibold">First payment: {money(amount)} MAD</span>
                <span className="text-brand-muted">Leftover → Main: 0.00</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allocations.map((item) => (
                  <div
                    key={item.name}
                    className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] border-t-[3px] flex flex-col gap-1.5"
                    style={{ borderTopColor: item.color }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.color}1A`, color: item.color }}
                      >
                        <item.Icon className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-semibold text-brand-ink text-sm truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="font-bold text-brand-ink text-base">
                      {money(item.amount)} MAD
                    </div>
                    <div className="text-[11px] text-brand-muted">
                      {money(item.remaining)} left
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="max-w-[720px] mx-auto w-full mt-8 min-[1200px]:mt-12">
              <div className="onboarding-receipt-heading py-3 px-1 flex items-center justify-between border-b border-border-subtle">
                <span className="font-semibold text-sm text-brand-ink">First payment</span>
                <span className="font-bold text-base text-brand-ink">{money(amount)} <span className="text-xs text-[#65748C]">MAD</span></span>
              </div>
              <div className="divide-y divide-border-subtle text-xs sm:text-sm">
                {allocations.map((item, index) => (
                  <div
                    key={item.name}
                    className="onboarding-rule-row py-3 px-1 flex flex-wrap min-[850px]:grid min-[850px]:grid-cols-[24px_minmax(0,1fr)_max-content_max-content_minmax(0,100px)_minmax(0,110px)] items-center gap-x-2 gap-y-1"
                  >
                    <span className="w-4 text-[#65748C] font-medium text-xs">{index + 1}</span>
                    <span className="font-semibold text-brand-ink">{index === 0 ? 'Rent lock' : item.name}</span>
                    <span className="bg-[#EDF0F4] text-brand-navy text-[11px] px-2 py-0.5 rounded-full w-fit whitespace-nowrap">{item.rule}</span>
                    <span className={`inline-flex items-center gap-1 text-xs ${item.amount > 0 ? 'text-status-success' : 'text-brand-muted'}`}>
                      {item.amount > 0 && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      {item.amount > 0 ? "Ran" : "Skipped"}
                    </span>
                    <span className="onboarding-rule-value ml-auto font-semibold text-brand-ink">{money(item.amount)}</span>
                    <span className="onboarding-rule-remaining min-w-0 ml-auto text-right text-[#65748C]">{money(item.remaining)} left</span>
                  </div>
                ))}
                <div className="py-3.5 px-1 flex items-center justify-between text-xs sm:text-sm text-brand-muted">
                  <span>Leftover → Main</span>
                  <span>0.00</span>
                </div>
                <div className="pt-2">
                  <div className="border-t-2 border-border-subtle" />
                  <div className="onboarding-receipt-total py-2.5 px-1 flex items-center justify-between text-sm font-bold text-brand-ink">
                    <span>Total</span>
                    <span className="inline-flex items-center gap-4">
                      {money(total)} <Check className="w-3.5 h-3.5 text-status-success" />{' '}
                      Checks out
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

import { Home, Landmark, PiggyBank, Wallet, Info } from 'lucide-react'
import { RuleValueInput } from '../../../components/onboarding/RuleValueInput'
import { TokenEnvelopePill } from '../../../components/onboarding/TokenEnvelopePill'

interface Step4RulesProps {
  rentAmount: string
  setRentAmount: (val: string) => void
  taxPercent: string
  setTaxPercent: (val: string) => void
  savingsPercent: string
  setSavingsPercent: (val: string) => void
  savingsCap: string
  setSavingsCap: (val: string) => void

}

export function Step4Rules({
  rentAmount,
  setRentAmount,
  taxPercent,
  setTaxPercent,
  savingsPercent,
  setSavingsPercent,
  savingsCap,
  setSavingsCap,
}: Step4RulesProps) {
  return (
    <div className="w-full max-w-[680px] mx-auto px-2 sm:px-4 space-y-5">
      {/* Step 4 Heading */}
      <div className="mb-6 space-y-1.5">
        <h1 className="text-2xl sm:text-[28px] font-semibold text-brand-ink tracking-tight">
          Your starter rules
        </h1>
        <p className="text-[15px] sm:text-base text-brand-muted leading-relaxed">
          They run from top to bottom on every payment. Change the numbers now or later.
        </p>
      </div>

      {/* Rules Cards Stack */}
      <div className="space-y-3.5">
        {/* Rule 1: Rent lock */}
        <div className="bg-white rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-3">
          <h2 className="text-sm sm:text-base font-semibold text-brand-ink">
            1. Rent lock
          </h2>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm sm:text-base text-brand-ink leading-relaxed">
            <span>Lock</span>
            <RuleValueInput
              value={rentAmount}
              onChange={setRentAmount}
              id="rule1-token-amount-1"
              label="1. Rent lock"
              unit="MAD"
            />
            <span>into</span>
            <TokenEnvelopePill name="Rent" icon={Home} color="#2270D8" bgColor="#EAF2FC" />
          </div>
        </div>

        {/* Rule 2: Tax */}
        <div className="bg-white rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-3">
          <h2 className="text-sm sm:text-base font-semibold text-brand-ink">
            2. Tax
          </h2>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm sm:text-base text-brand-ink leading-relaxed">
            <span>Put</span>
            <RuleValueInput
              value={taxPercent}
              onChange={setTaxPercent}
              id="rule2-token-tax"
              label="2. Tax"
              unit="%"
            />
            <span>of what's left into</span>
            <TokenEnvelopePill name="Tax" icon={Landmark} color="#EB6834" bgColor="#FDEEE8" />
          </div>
        </div>

        {/* Rule 3: Savings (capped) */}
        <div className="bg-white rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-3">
          <h2 className="text-sm sm:text-base font-semibold text-brand-ink">
            3. Savings (capped)
          </h2>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm sm:text-base text-brand-ink leading-relaxed">
            <span>Put</span>
            <RuleValueInput
              value={savingsPercent}
              onChange={setSavingsPercent}
              id="rule3-token-percent"
              label="3. Savings (capped)"
              unit="%"
            />
            <span>of what's left into</span>
            <TokenEnvelopePill name="Savings" icon={PiggyBank} color="#1BAF7A" bgColor="#E3F5EE" />
            <span>, only while</span>
            <TokenEnvelopePill name="Savings" icon={PiggyBank} color="#1BAF7A" bgColor="#E3F5EE" />
            <span>is below</span>
            <RuleValueInput
              value={savingsCap}
              onChange={setSavingsCap}
              id="rule3-token-cap"
              label="Savings is below"
              unit="MAD"
            />
          </div>
        </div>

        {/* Rule 4: Free to spend */}
        <div className="bg-white rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-1">
          <h2 className="text-sm sm:text-base font-semibold text-brand-ink">
            4. Free to spend
          </h2>
          <p className="text-sm sm:text-base text-brand-muted">
            Gets 100% of what's left.
          </p>
        </div>

        {/* Leftover Row: Main */}
        <div className="border border-dashed border-[#8C9BAE] bg-brand-surface rounded-2xl p-4 sm:p-5 flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-[10px] bg-[#EDF0F4] text-brand-muted flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm text-brand-navy leading-relaxed">
            <span className="font-semibold text-brand-ink">Main</span> — Whatever is left after these rules goes to Main. It can't be moved or turned off.
          </p>
        </div>

        {/* Informational Alert Banner (Figma #118:1488) */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-action-primary-subtle border border-[#D0D6F5] text-brand-navy text-xs sm:text-sm flex items-start gap-3">
          <Info className="w-5 h-5 text-action-primary shrink-0 mt-0.5" />
          <p className="leading-snug">15% for tax is a neutral budgeting default, not tax advice. Change it any time on Rules.</p>
        </div>
      </div>
    </div>
  )
}

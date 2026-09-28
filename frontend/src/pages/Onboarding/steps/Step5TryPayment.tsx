import {
  Loader2,
  FlaskConical,
  RefreshCw,
  CheckCircle2,
  Check,
  Home,
  Landmark,
  PiggyBank,
  ShoppingBag,
} from 'lucide-react'
import type { Translations } from '../../../i18n'

interface Step5TryPaymentProps {
  simulatedAmount: string
  setSimulatedAmount: (val: string) => void
  hasSimulated: boolean
  isSimulating: boolean
  onSimulate: () => void
  t: Translations
}

export function Step5TryPayment({
  simulatedAmount,
  setSimulatedAmount,
  hasSimulated,
  isSimulating,
  onSimulate,
  t,
}: Step5TryPaymentProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn w-full px-2 sm:px-4">
      {/* Step 5 Heading (Figma #119:1667) */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A2330] tracking-tight">
          {t.tryPaymentTitle}
        </h1>
        <p className="text-sm sm:text-base text-[#5E6B7E] leading-relaxed">
          {t.tryPaymentSubtitle}
        </p>
      </div>

      {/* Simulation Input Row (Figma #119:1670 & #119:1761) */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-3 w-full">
        <div className="w-full sm:w-80 space-y-1.5 text-left rtl:text-right">
          <label htmlFor="simulated-amount" className="block text-xs font-semibold uppercase tracking-wider text-[#5E6B7E]">
            {t.amountInputLabel}
          </label>
          <div className="relative flex items-center">
            <input
              id="simulated-amount"
              type="text"
              value={simulatedAmount}
              onChange={(e) => setSimulatedAmount(e.target.value)}
              disabled={isSimulating}
              className="w-full h-11 pl-4 pr-16 rtl:pl-16 rtl:pr-4 rounded-[10px] border border-[#DDE3EA] bg-white text-[#1A2330] font-semibold text-base focus:outline-none focus:border-[#5A64B4] focus:ring-3 focus:ring-[#5A64B4]/15 transition shadow-2xs"
            />
            <span className="absolute right-3 rtl:right-auto rtl:left-3 text-xs font-bold text-[#5E6B7E] bg-[#F3F6FA] px-2 py-0.5 rounded">
              MAD
            </span>
          </div>
        </div>

        {!hasSimulated ? (
          <button
            type="button"
            id="simulate-payment-btn"
            onClick={onSimulate}
            disabled={isSimulating}
            className="w-full sm:w-auto h-11 px-6 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] active:bg-[#3F4789] text-white font-medium text-sm transition cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2 shrink-0"
          >
            {isSimulating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.simulatingPayment}</span>
              </>
            ) : (
              <>
                <FlaskConical className="w-4 h-4" />
                <span>{t.simulatePaymentButton}</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            id="simulate-again-btn"
            onClick={onSimulate}
            disabled={isSimulating}
            className="w-full sm:w-auto h-11 px-5 rounded-[10px] border border-[#DDE3EA] bg-white hover:bg-[#F3F6FA] text-[#3B495D] font-medium text-sm transition cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{t.simulateAgainButton}</span>
          </button>
        )}
      </div>

      {/* Success Alert Banner (Figma #119:1774) */}
      {hasSimulated && (
        <div
          id="split-success-alert"
          role="status"
          aria-live="polite"
          className="p-3.5 sm:p-4 rounded-xl bg-[#E8F8F0] border border-[#BCE8D3] text-[#0E7A4A] text-xs sm:text-sm flex items-center justify-center gap-2.5 max-w-2xl mx-auto shadow-2xs animate-fadeIn"
        >
          <CheckCircle2 className="w-5 h-5 text-[#1BAF7A] shrink-0" />
          <p className="font-medium leading-relaxed text-center sm:text-left rtl:sm:text-right">
            {t.splitSuccessAlert}
          </p>
        </div>
      )}

      {/* Split Flow Card: Ribbon + Receipt (Figma #119:1784) */}
      {hasSimulated && (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl border border-[#DDE3EA] p-6 sm:p-8 space-y-8 shadow-xs animate-fadeIn">
          {/* 1. Split Flow / Ribbon (Figma #119:1785 / #88:2513) */}
          <div className="space-y-6">
            {/* Top Incoming / Leftover Summary Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm text-[#5E6B7E] pb-2 border-b border-[#EDF0F4] select-none">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1A2330]">{t.firstPaymentLabel}</span>
                <span className="font-bold text-[#1A2330] text-base">{simulatedAmount} MAD</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#94A3B8]" />
                  <span>{t.leftoverToMainLabel}:</span>
                  <span className="font-semibold text-[#1A2330]">0.00 MAD</span>
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#1F7A3A] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-xs">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>= {simulatedAmount} MAD</span>
                </span>
              </div>
            </div>

            {/* Flow Ribbon Diagram */}
            <div className="w-full overflow-hidden">
              {/* Multi-segmented Proportional Ribbon */}
              <div className="relative w-full">
                {/* Flow Stream Bar */}
                <div className="w-full h-8 rounded-lg overflow-hidden flex bg-[#EDF0F4] shadow-inner p-1 gap-1">
                  <div
                    style={{ width: '41.18%' }}
                    className="bg-[#2A78D6] h-full rounded-md transition-all duration-700 relative group flex items-center justify-center"
                    title="Rent: 3,500.00 MAD (41.18%)"
                  >
                    <span className="hidden md:inline text-[11px] font-semibold text-white truncate px-1">
                      {t.rentName} (41.2%)
                    </span>
                  </div>
                  <div
                    style={{ width: '8.82%' }}
                    className="bg-[#EB6834] h-full rounded-md transition-all duration-700 relative group flex items-center justify-center"
                    title="Tax: 750.00 MAD (8.82%)"
                  >
                    <span className="hidden lg:inline text-[10px] font-semibold text-white truncate px-0.5">
                      {t.taxName}
                    </span>
                  </div>
                  <div
                    style={{ width: '7.50%' }}
                    className="bg-[#1BAF7A] h-full rounded-md transition-all duration-700 relative group flex items-center justify-center"
                    title="Savings: 637.50 MAD (7.50%)"
                  >
                    <span className="hidden lg:inline text-[10px] font-semibold text-white truncate px-0.5">
                      {t.savingsName}
                    </span>
                  </div>
                  <div
                    style={{ width: '42.50%' }}
                    className="bg-[#EDA100] h-full rounded-md transition-all duration-700 relative group flex items-center justify-center"
                    title="Free to spend: 3,612.50 MAD (42.50%)"
                  >
                    <span className="hidden md:inline text-[11px] font-semibold text-white truncate px-1">
                      {t.freeToSpendName} (42.5%)
                    </span>
                  </div>
                </div>

                {/* SVG Flow Streams connecting ribbon bar to the 4 cards */}
                <svg className="w-full h-8 hidden sm:block overflow-visible" viewBox="0 0 800 32" preserveAspectRatio="none">
                  <path d="M 160 0 C 160 16, 100 16, 100 32" fill="none" stroke="#2A78D6" strokeWidth="2.5" strokeOpacity="0.4" />
                  <path d="M 360 0 C 360 16, 300 16, 300 32" fill="none" stroke="#EB6834" strokeWidth="2.5" strokeOpacity="0.4" />
                  <path d="M 420 0 C 420 16, 500 16, 500 32" fill="none" stroke="#1BAF7A" strokeWidth="2.5" strokeOpacity="0.4" />
                  <path d="M 600 0 C 600 16, 700 16, 700 32" fill="none" stroke="#EDA100" strokeWidth="2.5" strokeOpacity="0.4" />
                </svg>
              </div>

              {/* 4 Envelope Allocation Destination Cards with Icons (Figma #88:2520 to #88:2546) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
                {/* Card 1: Rent */}
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1.5 transition-shadow hover:shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-[#2A78D6]/10 text-[#2A78D6] flex items-center justify-center shrink-0">
                      <Home className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-semibold text-[#1A2330] text-sm">{t.rentName}</span>
                  </div>
                  <div className="font-bold text-[#1A2330] text-base">3,500.00 MAD</div>
                  <div className="text-[11px] text-[#5E6B7E]">5,000.00 {t.leftText}</div>
                </div>

                {/* Card 2: Tax */}
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1.5 transition-shadow hover:shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-[#EB6834]/10 text-[#EB6834] flex items-center justify-center shrink-0">
                      <Landmark className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-semibold text-[#1A2330] text-sm">{t.taxName}</span>
                  </div>
                  <div className="font-bold text-[#1A2330] text-base">750.00 MAD</div>
                  <div className="text-[11px] text-[#5E6B7E]">4,250.00 {t.leftText}</div>
                </div>

                {/* Card 3: Savings */}
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1.5 transition-shadow hover:shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-[#1BAF7A]/10 text-[#1BAF7A] flex items-center justify-center shrink-0">
                      <PiggyBank className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-semibold text-[#1A2330] text-sm truncate">{t.savingsName}</span>
                  </div>
                  <div className="font-bold text-[#1A2330] text-base">637.50 MAD</div>
                  <div className="text-[11px] text-[#5E6B7E]">3,612.50 {t.leftText}</div>
                </div>

                {/* Card 4: Free to spend */}
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col gap-1.5 transition-shadow hover:shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-[#EDA100]/10 text-[#EDA100] flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-semibold text-[#1A2330] text-sm truncate">{t.freeToSpendName}</span>
                  </div>
                  <div className="font-bold text-[#1A2330] text-base">3,612.50 MAD</div>
                  <div className="text-[11px] text-[#5E6B7E]">0.00 {t.leftText}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Split Flow / Receipt (Figma #119:1837 / #91:2829) */}
          <div className="max-w-[720px] mx-auto w-full pt-8 border-t border-[#EDF0F4] space-y-0">
            {/* Receipt Header */}
            <div className="py-3 px-1 flex items-center justify-between border-b border-[#DDE3EA]">
              <span className="font-semibold text-sm text-[#1A2330]">{t.firstPaymentLabel}</span>
              <span className="font-bold text-sm text-[#1A2330]">{simulatedAmount} MAD</span>
            </div>

            {/* Step Rows */}
            <div className="divide-y divide-[#DDE3EA] text-xs sm:text-sm">
              {/* Step 1: Rent lock */}
              <div className="py-3.5 px-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="w-4 text-[#8C9BAE] font-medium text-xs">1</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1A2330]">{t.rule1Title.replace(/^\d+\.\s*/, '')}</span>
                    <span className="bg-[#EDF0F4] text-[#5E6B7E] text-[11px] px-2.5 py-0.5 rounded-full font-normal">
                      {t.fixedAmountType}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-6">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1F7A3A]">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t.ranStatusBadge}</span>
                  </span>
                  <div className="text-right rtl:text-left min-w-[70px]">
                    <div className="font-bold text-[#1A2330]">3,500.00</div>
                    <div className="text-[11px] text-[#5E6B7E]">5,000.00 {t.leftText}</div>
                  </div>
                </div>
              </div>

              {/* Step 2: Tax */}
              <div className="py-3.5 px-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="w-4 text-[#8C9BAE] font-medium text-xs">2</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1A2330]">{t.taxName}</span>
                    <span className="bg-[#EDF0F4] text-[#5E6B7E] text-[11px] px-2.5 py-0.5 rounded-full font-normal">
                      15% {t.percentOfLeftType}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-6">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1F7A3A]">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t.ranStatusBadge}</span>
                  </span>
                  <div className="text-right rtl:text-left min-w-[70px]">
                    <div className="font-bold text-[#1A2330]">750.00</div>
                    <div className="text-[11px] text-[#5E6B7E]">4,250.00 {t.leftText}</div>
                  </div>
                </div>
              </div>

              {/* Step 3: Savings (capped) */}
              <div className="py-3.5 px-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="w-4 text-[#8C9BAE] font-medium text-xs">3</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1A2330]">{t.savingsName} (capped)</span>
                    <span className="bg-[#EDF0F4] text-[#5E6B7E] text-[11px] px-2.5 py-0.5 rounded-full font-normal">
                      15% {t.percentOfLeftType}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-6">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1F7A3A]">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t.ranStatusBadge}</span>
                  </span>
                  <div className="text-right rtl:text-left min-w-[70px]">
                    <div className="font-bold text-[#1A2330]">637.50</div>
                    <div className="text-[11px] text-[#5E6B7E]">3,612.50 {t.leftText}</div>
                  </div>
                </div>
              </div>

              {/* Step 4: Free to spend */}
              <div className="py-3.5 px-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="w-4 text-[#8C9BAE] font-medium text-xs">4</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#1A2330]">{t.freeToSpendName}</span>
                    <span className="bg-[#EDF0F4] text-[#5E6B7E] text-[11px] px-2.5 py-0.5 rounded-full font-normal">
                      100% {t.percentOfLeftType}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-6">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1F7A3A]">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t.ranStatusBadge}</span>
                  </span>
                  <div className="text-right rtl:text-left min-w-[70px]">
                    <div className="font-bold text-[#1A2330]">3,612.50</div>
                    <div className="text-[11px] text-[#5E6B7E]">0.00 {t.leftText}</div>
                  </div>
                </div>
              </div>

              {/* Leftover row */}
              <div className="py-3.5 px-1 flex items-center justify-between text-xs sm:text-sm text-[#5E6B7E]">
                <span className="font-medium text-[#5E6B7E]">{t.leftoverToMainLabel}</span>
                <span className="font-semibold text-[#1A2330]">0.00</span>
              </div>

              {/* Total Section with Double Rule (Figma #91:2888) */}
              <div className="pt-2">
                <div className="flex flex-col gap-0.5 mb-2">
                  <div className="h-px w-full bg-[#DDE3EA]" />
                  <div className="h-px w-full bg-[#DDE3EA]" />
                </div>
                <div className="py-2.5 px-1 flex items-center justify-between text-sm font-bold text-[#1A2330]">
                  <span>{t.totalLabel}</span>
                  <div className="flex items-center gap-4">
                    <span>{simulatedAmount}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F7A3A]">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{t.checksOutBadge}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

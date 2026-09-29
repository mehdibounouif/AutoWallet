import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, Loader2, AlertCircle } from 'lucide-react'
import { getTranslations } from '../../i18n'
import type { Language } from '../../i18n'
import { TopBar } from '../../components/common/TopBar'
import { Stepper } from '../../components/common/Stepper'
import { Step1About } from './steps/Step1About'
import { Step2Account } from './steps/Step2Account'
import { Step3Envelopes } from './steps/Step3Envelopes'
import { Step4Rules } from './steps/Step4Rules'
import { Step5TryPayment } from './steps/Step5TryPayment'
import { onboardingPaths } from './routes'

interface OnboardingPageProps {
  currentLang: Language
  onSelectLang: (lang: Language) => void
}

const normalizeRuleValue = (value: string | undefined, fallback: string) =>
  value ? value.replace(/[^\d.-]/g, '') || fallback : fallback

const isValidRuleValue = (value: string, maximum = Infinity) => {
  const numericValue = Number(value)
  return value.trim() !== '' && Number.isFinite(numericValue) && numericValue >= 0 && numericValue <= maximum
}

export function OnboardingPage({
  currentLang,
  onSelectLang,
}: OnboardingPageProps) {
  const t = getTranslations(currentLang)
  const navigate = useNavigate()
  const location = useLocation()

  // Derive step directly from URL route
  const step = onboardingPaths.indexOf(location.pathname as typeof onboardingPaths[number]) + 1

  const [draft] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('autowallet_signup_draft') || '{}')
      return { ...saved, ...location.state } as Record<string, string>
    } catch {
      return (location.state || {}) as Record<string, string>
    }
  })
  const draftEmail = draft.email || ''
  const draftPassword = draft.password || ''

  useEffect(() => {
    if (!draftEmail || !draftPassword) navigate('/signup', { replace: true })
  }, [draftEmail, draftPassword, navigate])

  const hasLegacySampleName = draft.firstName === 'Yasmine' && draft.lastName === 'El Amrani'
  const [firstName, setFirstName] = useState(hasLegacySampleName ? '' : draft.firstName || '')
  const [lastName, setLastName] = useState(hasLegacySampleName ? '' : draft.lastName || '')
  const [bankAccount, setBankAccount] = useState(draft.bankAccount || '')

  // Step 4 Rule customization states (Figma #118:1359)
  const [rentAmount, setRentAmount] = useState(normalizeRuleValue(draft.rentAmount, '3500'))
  const [taxPercent, setTaxPercent] = useState(normalizeRuleValue(draft.taxPercent, '15'))
  const [savingsPercent, setSavingsPercent] = useState(normalizeRuleValue(draft.savingsPercent, '15'))
  const [savingsCap, setSavingsCap] = useState(normalizeRuleValue(draft.savingsCap, '10000'))

  // Step 5 Simulation states (Figma #119:1613)
  const [simulatedAmount, setSimulatedAmount] = useState('8,500.00')
  const [hasSimulated, setHasSimulated] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)

  const handleSimulate = () => {
    setIsSimulating(true)
    setTimeout(() => {
      setIsSimulating(false)
      setHasSimulated(true)
    }, 700)
  }

  // Submission & Validation States
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [firstNameError, setFirstNameError] = useState<string | null>(null)
  const [lastNameError, setLastNameError] = useState<string | null>(null)
  const [bankAccountError, setBankAccountError] = useState<string | null>(null)

  const persistDraft = (extra: Record<string, unknown> = {}) => {
    try {
      const existing = JSON.parse(sessionStorage.getItem('autowallet_signup_draft') || '{}')
      const merged = {
        ...existing,
        email: draftEmail,
        password: draftPassword,
        firstName,
        lastName,
        bankAccount,
        rentAmount,
        taxPercent,
        savingsPercent,
        savingsCap,
        ...extra,
      }
      sessionStorage.setItem('autowallet_signup_draft', JSON.stringify(merged))
    } catch {
      // ignore
    }
  }

  const handleStep1Continue = (e?: FormEvent) => {
    if (e) e.preventDefault()
    let hasErr = false

    if (!firstName.trim() || firstName.trim().length < 2) {
      setFirstNameError(t.firstNameRequired)
      hasErr = true
    } else {
      setFirstNameError(null)
    }

    if (!lastName.trim() || lastName.trim().length < 2) {
      setLastNameError(t.lastNameRequired)
      hasErr = true
    } else {
      setLastNameError(null)
    }

    if (hasErr) {
      setErrorMessage(
        !firstName.trim() || firstName.trim().length < 2
          ? t.firstNameRequired
          : t.lastNameRequired
      )
      return
    }

    setErrorMessage(null)
    persistDraft({ firstName: firstName.trim(), lastName: lastName.trim() })
    navigate('/welcome/account')
  }

  const handleStep2Continue = (skip = false) => {
    setErrorMessage(null)
    setBankAccountError(null)

    if (skip) {
      setBankAccount('')
      persistDraft({ bankAccount: '', skippedBank: true })
      navigate('/welcome/envelopes')
      return
    }

    const cleanAcc = bankAccount.trim()
    if (!cleanAcc) {
      setBankAccountError(t.bankAccountRequired)
      setErrorMessage(t.bankAccountRequired)
      return
    }

    if (cleanAcc.length < 3) {
      setBankAccountError(t.bankAccountInvalid)
      setErrorMessage(t.bankAccountInvalid)
      return
    }

    persistDraft({ bankAccount: cleanAcc, skippedBank: false })
    navigate('/welcome/envelopes')
  }

  const handleStep3Continue = () => {
    setErrorMessage(null)
    persistDraft()
    navigate('/welcome/rules')
  }

  const handleStep4Continue = () => {
    setErrorMessage(null)
    const invalidInput = [
      { id: 'rule1-token-amount-1', value: rentAmount, max: Infinity },
      { id: 'rule2-token-tax', value: taxPercent, max: 100 },
      { id: 'rule3-token-percent', value: savingsPercent, max: 100 },
      { id: 'rule3-token-cap', value: savingsCap, max: Infinity },
    ].find(({ value, max }) => !isValidRuleValue(value, max))

    if (invalidInput) {
      setErrorMessage(t.ruleValueInvalid)
      document.getElementById(invalidInput.id)?.focus()
      return
    }
    persistDraft()
    navigate('/welcome/try')
  }

  const handleBack = () => {
    setErrorMessage(null)
    persistDraft()
    if (step > 1) navigate(onboardingPaths[step - 2])
  }

  const handleStepClick = (targetStep: number) => {
    setErrorMessage(null)
    persistDraft()
    const path = onboardingPaths[targetStep - 1]
    if (path) navigate(path)
  }

  const handleComplete = async () => {
    if (loading) return
    setErrorMessage(null)

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
    const email = draftEmail.trim()
    const password = draftPassword
    const bankAccountId = bankAccount.trim() || `TEMP-${crypto.randomUUID()}`

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      persistDraft()
      navigate('/welcome/about')
      return
    }

    setLoading(true)

    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          bank_account_id: bankAccountId,
        }),
      })

      if (!regRes.ok) {
        const errData = await regRes.json().catch(() => ({}))
        const detail = typeof errData.detail === 'string' ? errData.detail.toLowerCase() : ''
        if (detail.includes('email')) setErrorMessage(t.emailExists)
        else if (detail.includes('bank account')) setErrorMessage(t.bankAccountExists)
        else setErrorMessage(t.serviceUnavailable)
        return
      }

      try {
        sessionStorage.removeItem('autowallet_signup_draft')
      } catch {
        // Registration has already succeeded, even if storage is unavailable.
      }
      try {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (loginRes.ok) {
          const tokenData = await loginRes.json()
          if (typeof tokenData.access_token === 'string') {
            localStorage.setItem('autowallet_token', tokenData.access_token)
            navigate('/maintenance', { replace: true })
            return
          }
        }
      } catch {
        // Registration is complete; login can be retried from the login page.
      }
      navigate('/login', { replace: true })
    } catch {
      setErrorMessage(t.serviceUnavailable)
    } finally {
      setLoading(false)
    }
  }

  if (!draftEmail || !draftPassword) return null

  return (
    <div className="min-h-screen w-full bg-[#F3F6FA] flex flex-col justify-between">
      {/* Onboarding Top Bar with Logo, Stepper, and Language Switcher */}
      <TopBar
        currentLang={currentLang}
        onSelectLang={onSelectLang}
        variant="onboarding"
      >
        <Stepper
          currentStep={step}
          onStepClick={handleStepClick}
          currentLang={currentLang}
          t={t}
        />
      </TopBar>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 z-10">
        {/* Error Alert Display */}
        {errorMessage && (
          <div
            role="alert"
            className="w-full max-w-[560px] mb-5 p-3.5 rounded-xl bg-[#FFF5F5] border border-[#FFD2D2] text-[#C62F31] text-sm flex items-start gap-3 animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-[#C62F31] mt-0.5" />
            <div className="flex-1 leading-snug">
              <span>{errorMessage}</span>
              {errorMessage === t.emailExists && (
                <div className="mt-1.5 text-xs text-[#5E6B7E]">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="underline text-[#5A64B4] font-medium cursor-pointer"
                  >
                    {t.loginButton}
                  </button>
                </div>
              )}
              {errorMessage === t.bankAccountExists && step !== 2 && (
                <div className="mt-1.5 text-xs text-[#5E6B7E]">
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/welcome/account')
                    }}
                    className="underline text-[#5A64B4] font-medium cursor-pointer"
                  >
                    {t.changeBankAccount}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 1: About you */}
        {step === 1 && (
          <Step1About
            firstName={firstName}
            setFirstName={(val) => {
              setFirstName(val)
              if (firstNameError && val.trim().length >= 2) setFirstNameError(null)
            }}
            lastName={lastName}
            setLastName={(val) => {
              setLastName(val)
              if (lastNameError && val.trim().length >= 2) setLastNameError(null)
            }}
            currentLang={currentLang}
            onSelectLang={onSelectLang}
            t={t}
            onSubmit={handleStep1Continue}
            externalFirstNameError={firstNameError}
            externalLastNameError={lastNameError}
          />
        )}

        {/* Step 2: Link account */}
        {step === 2 && (
          <Step2Account
            bankAccount={bankAccount}
            setBankAccount={(val) => {
              setBankAccount(val)
              if (bankAccountError && val.trim().length >= 3) setBankAccountError(null)
            }}
            t={t}
            externalBankAccountError={bankAccountError}
          />
        )}

        {/* Step 3: Envelopes */}
        {step === 3 && <Step3Envelopes t={t} />}

        {/* Step 4: Rules */}
        {step === 4 && (
          <Step4Rules
            rentAmount={rentAmount}
            setRentAmount={setRentAmount}
            taxPercent={taxPercent}
            setTaxPercent={setTaxPercent}
            savingsPercent={savingsPercent}
            setSavingsPercent={setSavingsPercent}
            savingsCap={savingsCap}
            setSavingsCap={setSavingsCap}
            t={t}
          />
        )}

        {/* Step 5: Try payment simulation */}
        {step === 5 && (
          <Step5TryPayment
            simulatedAmount={simulatedAmount}
            setSimulatedAmount={(value) => { setSimulatedAmount(value); setHasSimulated(false) }}
            rentAmount={rentAmount}
            taxPercent={taxPercent}
            savingsPercent={savingsPercent}
            savingsCap={savingsCap}
            hasSimulated={hasSimulated}
            isSimulating={isSimulating}
            onSimulate={handleSimulate}
            t={t}
          />
        )}
      </main>

      {/* Fixed / Bottom Actions Bar per Figma layout_daff2d4f */}
      <footer className="w-full bg-white border-t border-[#DDE3EA] px-6 sm:px-10 py-4 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {step === 1 ? (
            <>
              <div /> {/* Spacer */}
              <button
                type="button"
                id="onboarding-continue-step1"
                onClick={() => handleStep1Continue()}
                disabled={!firstName.trim()}
                className="h-11 px-6 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] active:bg-[#3F4789] text-white font-medium text-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center justify-center gap-2"
              >
                <span>{t.continueButton}</span>
              </button>
            </>
          ) : step === 2 ? (
            <>
              <button
                type="button"
                id="onboarding-back-step2"
                onClick={handleBack}
                disabled={loading}
                className="inline-flex items-center gap-1.5 h-11 px-4 rounded-[10px] border border-[#DDE3EA] bg-white text-[#3B495D] hover:bg-[#F3F6FA] text-sm font-medium transition cursor-pointer disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t.backButton}</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  id="onboarding-skip-step2"
                  onClick={() => handleStep2Continue(true)}
                  disabled={loading}
                  className="h-11 px-4 rounded-[10px] text-[#5E6B7E] hover:text-[#1A2330] hover:bg-[#F3F6FA] text-sm font-medium transition cursor-pointer disabled:opacity-50"
                >
                  {t.skipForNowButton}
                </button>
                <button
                  type="button"
                  id="onboarding-continue-step2"
                  onClick={() => handleStep2Continue(false)}
                  disabled={loading}
                  className="h-11 px-6 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] active:bg-[#3F4789] text-white font-medium text-sm transition cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
                >
                  <span>{t.continueButton}</span>
                </button>
              </div>
            </>
          ) : step === 3 ? (
            <>
              <button
                type="button"
                id="onboarding-back-step3"
                onClick={handleBack}
                disabled={loading}
                className="inline-flex items-center gap-1.5 h-11 px-4 rounded-[10px] border border-[#DDE3EA] bg-white text-[#3B495D] hover:bg-[#F3F6FA] text-sm font-medium transition cursor-pointer disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t.backButton}</span>
              </button>

              <button
                type="button"
                id="onboarding-continue-step3"
                onClick={handleStep3Continue}
                disabled={loading}
                className="h-11 px-6 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] active:bg-[#3F4789] text-white font-medium text-sm transition cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
              >
                <span>{t.continueButton}</span>
              </button>
            </>
          ) : step === 4 ? (
            <>
              <button
                type="button"
                id="onboarding-back-step4"
                onClick={handleBack}
                disabled={loading}
                className="inline-flex items-center gap-1.5 h-11 px-4 rounded-[10px] border border-[#DDE3EA] bg-white text-[#3B495D] hover:bg-[#F3F6FA] text-sm font-medium transition cursor-pointer disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t.backButton}</span>
              </button>

              <button
                type="button"
                id="onboarding-continue-step4"
                onClick={handleStep4Continue}
                disabled={loading}
                className="h-11 px-6 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] active:bg-[#3F4789] text-white font-medium text-sm transition cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
              >
                <span>{t.continueButton}</span>
              </button>
            </>
          ) : (
            /* Step 5: Try a payment */
            <>
              <button
                type="button"
                id="onboarding-back-step5"
                onClick={handleBack}
                disabled={loading || isSimulating}
                className="inline-flex items-center gap-1.5 h-11 px-4 rounded-[10px] border border-[#DDE3EA] bg-white text-[#3B495D] hover:bg-[#F3F6FA] text-sm font-medium transition cursor-pointer disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                <span>{t.backButton}</span>
              </button>

              {!hasSimulated ? (
                <button
                  type="button"
                  id="onboarding-skip-to-home-step5"
                  onClick={handleComplete}
                  disabled={loading || isSimulating}
                  className="h-11 px-6 rounded-[10px] border border-[#DDE3EA] bg-white text-[#3B495D] hover:bg-[#F3F6FA] text-sm font-medium transition cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{t.skipToHomeButton}</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="onboarding-go-to-home-step5"
                  onClick={handleComplete}
                  disabled={loading || isSimulating}
                  className="h-11 px-6 rounded-[10px] bg-[#5A64B4] hover:bg-[#4A53A0] active:bg-[#3F4789] text-white font-medium text-sm transition cursor-pointer disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{t.goToHomeButton}</span>
                </button>
              )}
            </>
          )}
        </div>
      </footer>
    </div>
  )
}

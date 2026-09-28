import { useState } from 'react'
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

interface OnboardingPageProps {
  initialStep?: 1 | 2 | 3 | 4 | 5
  currentLang: Language
  onSelectLang: (lang: Language) => void
}

function getStepFromPath(pathname: string, fallback: 1 | 2 | 3 | 4 | 5): 1 | 2 | 3 | 4 | 5 {
  if (pathname === '/welcome/try') return 5
  if (pathname === '/welcome/rules') return 4
  if (pathname === '/welcome/envelopes') return 3
  if (pathname === '/welcome/account') return 2
  if (pathname === '/welcome/about') return 1
  return fallback
}

export function OnboardingPage({
  initialStep = 1,
  currentLang,
  onSelectLang,
}: OnboardingPageProps) {
  const t = getTranslations(currentLang)
  const navigate = useNavigate()
  const location = useLocation()

  // Derive step directly from URL route
  const step = getStepFromPath(location.pathname, initialStep)

  // Retrieve draft registration credentials from navigation state or sessionStorage
  const [draftEmail] = useState<string>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('autowallet_signup_draft') || '{}')
      return location.state?.email || saved.email || 'yasmine.alami@example.com'
    } catch {
      return 'yasmine.alami@example.com'
    }
  })

  const [draftPassword] = useState<string>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('autowallet_signup_draft') || '{}')
      return location.state?.password || saved.password || 'AutoWallet2026!'
    } catch {
      return 'AutoWallet2026!'
    }
  })

  // Step 1 Fields (About you) - matching Figma placeholders
  const [firstName, setFirstName] = useState('Yasmine')
  const [lastName, setLastName] = useState('El Amrani')

  // Step 2 Fields (Link account) - matching Figma placeholders
  const [bankAccount, setBankAccount] = useState('ACC-2026-001')

  // Step 4 Rule customization states (Figma #118:1359)
  const [rentAmount, setRentAmount] = useState('3,500.00 MAD')
  const [taxPercent, setTaxPercent] = useState('15%')
  const [savingsPercent, setSavingsPercent] = useState('15%')
  const [savingsCap, setSavingsCap] = useState('10,000.00 MAD')

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
  const [serviceDown] = useState(false)
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
    navigate('/welcome/account', { state: { email: draftEmail, password: draftPassword } })
  }

  const handleStep2Continue = (skip = false) => {
    setErrorMessage(null)
    setBankAccountError(null)

    if (skip) {
      persistDraft({ bankAccount: '', skippedBank: true })
      navigate('/welcome/envelopes', { state: { email: draftEmail, password: draftPassword } })
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
    navigate('/welcome/envelopes', { state: { email: draftEmail, password: draftPassword } })
  }

  const handleStep3Continue = () => {
    setErrorMessage(null)
    persistDraft()
    navigate('/welcome/rules', { state: { email: draftEmail, password: draftPassword } })
  }

  const handleStep4Continue = () => {
    setErrorMessage(null)
    persistDraft()
    navigate('/welcome/try', { state: { email: draftEmail, password: draftPassword } })
  }

  const handleBack = () => {
    setErrorMessage(null)
    if (step === 5) {
      navigate('/welcome/rules', { state: { email: draftEmail, password: draftPassword } })
    } else if (step === 4) {
      navigate('/welcome/envelopes', { state: { email: draftEmail, password: draftPassword } })
    } else if (step === 3) {
      navigate('/welcome/account', { state: { email: draftEmail, password: draftPassword } })
    } else if (step === 2) {
      navigate('/welcome/about', { state: { email: draftEmail, password: draftPassword } })
    }
  }

  const handleStepClick = (targetStep: number) => {
    setErrorMessage(null)
    persistDraft()
    if (targetStep === 1) {
      navigate('/welcome/about', { state: { email: draftEmail, password: draftPassword } })
    } else if (targetStep === 2) {
      navigate('/welcome/account', { state: { email: draftEmail, password: draftPassword } })
    } else if (targetStep === 3) {
      navigate('/welcome/envelopes', { state: { email: draftEmail, password: draftPassword } })
    } else if (targetStep === 4) {
      navigate('/welcome/rules', { state: { email: draftEmail, password: draftPassword } })
    } else if (targetStep === 5) {
      navigate('/welcome/try', { state: { email: draftEmail, password: draftPassword } })
    }
  }

  // Handle final registration submission to backend POST /api/auth/register
  const handleComplete = async (skipBank = false) => {
    setErrorMessage(null)
    setLoading(true)

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || 'Yasmine El Amrani'
    const emailToUse = draftEmail.trim() || 'yasmine.alami@example.com'
    const passwordToUse = draftPassword || 'AutoWallet2026!'
    const bankAccountIdToUse = skipBank
      ? `TEMP-${Math.floor(1000 + Math.random() * 9000)}`
      : (bankAccount.trim() || 'ACC-2026-001')

    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email: emailToUse,
          password: passwordToUse,
          bank_account_id: bankAccountIdToUse,
        }),
      })

      if (regRes.status === 201 || regRes.ok) {
        // Automatically log in
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailToUse, password: passwordToUse }),
        }).catch(() => null)

        if (loginRes && loginRes.ok) {
          const tokenData = await loginRes.json()
          if (tokenData.access_token) {
            localStorage.setItem('autowallet_token', tokenData.access_token)
          }
        }
        try {
          sessionStorage.removeItem('autowallet_signup_draft')
        } catch {
          // ignore
        }
        navigate('/maintenance')
      } else {
        const errData = await regRes.json().catch(() => ({}))
        const detailMsg = typeof errData.detail === 'string' ? errData.detail : ''
        if (detailMsg.toLowerCase().includes('email')) {
          setErrorMessage(t.emailExists)
          return
        }
        if (detailMsg.toLowerCase().includes('bank account')) {
          setErrorMessage(t.bankAccountExists)
          return
        }
        // Fallback for simulation / preview
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailToUse, password: passwordToUse }),
        }).catch(() => null)
        if (loginRes && loginRes.ok) {
          const tokenData = await loginRes.json()
          if (tokenData.access_token) {
            localStorage.setItem('autowallet_token', tokenData.access_token)
          }
        }
        navigate('/maintenance')
      }
    } catch {
      try {
        sessionStorage.removeItem('autowallet_signup_draft')
      } catch {
        // ignore
      }
      navigate('/maintenance')
    } finally {
      setLoading(false)
    }
  }

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
              {serviceDown && (
                <div className="mt-1 text-xs text-[#5E6B7E]">
                  You can test inputs or click{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/maintenance')}
                    className="underline text-[#5A64B4] font-medium cursor-pointer"
                  >
                    continue to preview
                  </button>
                  .
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
            setSimulatedAmount={setSimulatedAmount}
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
                  onClick={() => handleComplete(true)}
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
                  onClick={() => handleComplete(false)}
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

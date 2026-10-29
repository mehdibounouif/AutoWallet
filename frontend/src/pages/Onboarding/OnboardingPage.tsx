import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { TopBar } from '../../components/layout/TopBar'
import { Stepper } from '../../components/ui/Stepper'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Step1About } from './steps/Step1About'
import { Step2Account } from './steps/Step2Account'
import { Step3Envelopes } from './steps/Step3Envelopes'
import { Step4Rules } from './steps/Step4Rules'
import { Step5TryPayment } from './steps/Step5TryPayment'
import { onboardingPaths } from './routes'
import { clearSignupCredentials, getSignupPassword } from '../../auth/pendingCredentials'
import { setToken } from '../../auth/session'
import { isValidBankAccountId } from '../../auth/validation'
import { isValidRuleValue } from '../../utils/format'
import { clearSignupDraft, parseSignupDraft, readSignupDraft, writeSignupDraft } from '../../auth/signupDraft'
import type { SignupDraft } from '../../auth/signupDraft'
import { apiFetch } from '../../api/request'
import { apiErrorDetail } from '../../api/errors'
import { useRequestSignal } from '../../hooks/useRequestSignal'
import { cn } from '../../utils/cn'
import { OnboardingFooter } from './OnboardingFooter'

const normalizeRuleValue = (value: string | undefined, fallback: string) =>
  value ? value.replaceAll(',', '').trim() || fallback : fallback

export function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const requestSignal = useRequestSignal()

  const step = onboardingPaths.indexOf(location.pathname as typeof onboardingPaths[number]) + 1
  const [draft] = useState(() => ({ ...readSignupDraft(), ...parseSignupDraft(location.state) }))
  const draftEmail = draft.email || ''
  const [draftPassword] = useState(() => getSignupPassword(draftEmail) || '')
  const [registered, setRegistered] = useState(Boolean(draft.registered))

  useEffect(() => {
    if (!draftEmail || !draftPassword) {
      const path = draft.registered ? '/login' : '/signup'
      const emailQuery = draftEmail ? `?email=${encodeURIComponent(draftEmail)}` : ''
      navigate(`${path}${emailQuery}`, { replace: true })
    }
  }, [draft.registered, draftEmail, draftPassword, navigate])

  useEffect(() => {
    if (registered && step < 3) navigate('/welcome/envelopes', { replace: true })
  }, [navigate, registered, step])

  const [firstName, setFirstName] = useState(draft.firstName || '')
  const [lastName, setLastName] = useState(draft.lastName || '')
  const [bankAccount, setBankAccount] = useState(draft.bankAccount || '')
  const [rentAmount, setRentAmount] = useState(normalizeRuleValue(draft.rentAmount, '3500'))
  const [taxPercent, setTaxPercent] = useState(normalizeRuleValue(draft.taxPercent, '15'))
  const [savingsPercent, setSavingsPercent] = useState(normalizeRuleValue(draft.savingsPercent, '15'))
  const [savingsCap, setSavingsCap] = useState(normalizeRuleValue(draft.savingsCap, '10000'))
  const [simulatedAmount, setSimulatedAmount] = useState('8,500.00')
  const [hasSimulated, setHasSimulated] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)

  const simulationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (simulationTimer.current) clearTimeout(simulationTimer.current) }, [])

  const handleSimulate = () => {
    if (isSimulating) return
    setIsSimulating(true)
    simulationTimer.current = setTimeout(() => {
      setIsSimulating(false)
      setHasSimulated(true)
    }, 700)
  }

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [firstNameError, setFirstNameError] = useState<string | null>(null)
  const [lastNameError, setLastNameError] = useState<string | null>(null)
  const [bankAccountError, setBankAccountError] = useState<string | null>(draft.bankAccountError ?? null)

  const persistDraft = (extra: Partial<SignupDraft> = {}) => {
    writeSignupDraft({
      ...readSignupDraft(),
      email: draftEmail,
      firstName,
      lastName,
      bankAccount,
      rentAmount,
      taxPercent,
      savingsPercent,
      savingsCap,
      registered,
      ...extra,
    })
  }

  const handleStep1Continue = (event?: FormEvent) => {
    event?.preventDefault()
    const invalidFirst = !firstName.trim() || firstName.trim().length < 2
    const invalidLast = !lastName.trim() || lastName.trim().length < 2
    setFirstNameError(invalidFirst ? t.firstNameRequired : null)
    setLastNameError(invalidLast ? t.lastNameRequired : null)
    if (invalidFirst || invalidLast) {
      setErrorMessage(invalidFirst ? t.firstNameRequired : t.lastNameRequired)
      return
    }
    setErrorMessage(null)
    persistDraft({ firstName: firstName.trim(), lastName: lastName.trim() })
    navigate('/welcome/account')
  }

  const handleStep2Continue = async () => {
    if (loading || registered) return
    setErrorMessage(null)
    setBankAccountError(null)
    const cleanAccount = bankAccount.trim()
    if (!cleanAccount) {
      setBankAccountError(t.bankAccountRequired)
      setErrorMessage(t.bankAccountRequired)
      return
    }
    if (!isValidBankAccountId(cleanAccount)) {
      setBankAccountError(t.bankAccountInvalid)
      setErrorMessage(t.bankAccountInvalid)
      return
    }
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      persistDraft({ bankAccount: cleanAccount })
      navigate('/welcome/about')
      return
    }

    const signal = requestSignal()
    setLoading(true)
    try {
      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          email: draftEmail.trim(),
          password: draftPassword,
          bank_account_id: cleanAccount,
        }),
        signal,
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        const detail = apiErrorDetail(error, '').message.toLowerCase()
        if (detail.includes('email')) {
          setErrorMessage(t.emailExists)
        } else if (detail.includes('bank account')) {
          setBankAccountError(t.bankAccountExists)
          setErrorMessage(t.bankAccountExists)
        } else {
          setErrorMessage(t.serviceUnavailable)
        }
        return
      }
      persistDraft({ bankAccount: cleanAccount, registered: true })
      setRegistered(true)
      navigate('/welcome/envelopes')
    } catch {
      if (!signal.aborted) setErrorMessage(t.serviceUnavailable)
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }

  const handleStep3Continue = () => {
    setErrorMessage(null)
    persistDraft()
    navigate('/welcome/rules')
  }

  const handleStep4Continue = async () => {
    if (loading) return
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
    if (!registered) {
      navigate('/welcome/account')
      return
    }

    const signal = requestSignal()
    setLoading(true)
    try {
      const loginResponse = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: draftEmail.trim(), password: draftPassword }),
        signal,
      })
      if (!loginResponse.ok) {
        setErrorMessage(t.rulesSaveFailed)
        return
      }
      const loginData = await loginResponse.json()
      if (typeof loginData.access_token !== 'string') {
        setErrorMessage(t.rulesSaveFailed)
        return
      }
      const rulesResponse = await apiFetch('/api/rules/onboarding', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${loginData.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rent_amount: Number(rentAmount),
          tax_percent: Number(taxPercent),
          savings_percent: Number(savingsPercent),
          savings_cap: Number(savingsCap),
        }),
        signal,
      })
      if (!rulesResponse.ok) {
        setErrorMessage(t.rulesSaveFailed)
        return
      }
      navigate('/welcome/try')
    } catch {
      if (!signal.aborted) setErrorMessage(t.rulesSaveFailed)
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }

  const handleBack = () => {
    setErrorMessage(null)
    persistDraft()
    if (step > (registered ? 3 : 1)) navigate(onboardingPaths[step - 2])
  }

  const handleStepClick = (targetStep: number) => {
    if (registered && targetStep < 3) return
    setErrorMessage(null)
    persistDraft()
    const path = onboardingPaths[targetStep - 1]
    if (path) navigate(path)
  }

  const handleComplete = async () => {
    if (loading) return
    setErrorMessage(null)
    if (!registered) {
      persistDraft()
      navigate('/welcome/account')
      return
    }

    const signal = requestSignal()
    setLoading(true)
    try {
      const loginRes = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: draftEmail.trim(), password: draftPassword }),
        signal,
      })
      if (loginRes.ok) {
        const tokenData = await loginRes.json()
        if (typeof tokenData.access_token === 'string') {
          setToken(tokenData.access_token)
          clearSignupDraft()
          navigate('/dashboard', { replace: true })
          return
        }
      }
      clearSignupDraft()
      navigate('/login', { replace: true })
    } catch {
      if (signal.aborted) return
      // The account exists; sign-in can be retried without registering again.
      clearSignupDraft()
      navigate('/login', { replace: true })
    } finally {
      if (!signal.aborted) {
        clearSignupCredentials()
        setLoading(false)
      }
    }
  }

  if (!draftEmail || !draftPassword) return null

  const primaryAction = (() => {
    switch (step) {
      case 1:
        return (
          <Button id="onboarding-continue-step1" disabled={!firstName.trim()} onClick={() => handleStep1Continue()}>
            {t.continueButton}
          </Button>
        )
      case 2:
        return (
          <Button id="onboarding-continue-step2" loading={loading} onClick={() => void handleStep2Continue()}>
            {t.signupButton}
          </Button>
        )
      case 3:
        return (
          <Button id="onboarding-continue-step3" disabled={loading} onClick={handleStep3Continue}>
            {t.continueButton}
          </Button>
        )
      case 4:
        return (
          <Button id="onboarding-continue-step4" loading={loading} onClick={() => void handleStep4Continue()}>
            {t.continueButton}
          </Button>
        )
      default:
        return hasSimulated ? (
          <Button id="onboarding-go-to-home-step5" size="lg" loading={loading} onClick={() => void handleComplete()}>
            {t.goToHomeButton}
          </Button>
        ) : (
          <Button id="onboarding-skip-to-home-step5" variant="outline" loading={loading} onClick={() => void handleComplete()}>
            {t.skipToHomeButton}
          </Button>
        )
    }
  })()

  return (
    <div className="flex min-h-screen flex-col justify-between bg-canvas">
      <TopBar variant="onboarding" finalStep={step === 5}>
        <Stepper currentStep={step} onStepClick={registered || loading ? undefined : handleStepClick} expanded={step === 5} t={t} />
      </TopBar>

      <main className={cn('z-10 flex flex-1 flex-col items-center px-4', step === 5 ? 'justify-start pt-8 pb-32 sm:pt-[54px] sm:pb-40' : 'justify-center py-8 sm:py-12')}>
        {errorMessage && (
          <Alert
            tone="danger"
            className="mb-5 w-full max-w-[560px]"
            icon={<AlertCircle className="size-5" />}
          >
            <span>{errorMessage}</span>
            {errorMessage === t.emailExists && (
              <div className="mt-1.5 flex gap-4 text-xs text-muted">
                <button type="button" onClick={() => navigate('/login')} className="font-medium text-action-primary underline">{t.loginButton}</button>
                <button type="button" onClick={() => navigate('/signup')} className="font-medium text-action-primary underline">{t.changeEmail}</button>
              </div>
            )}
          </Alert>
        )}

        {step === 1 && (
          <Step1About
            firstName={firstName}
            setFirstName={(value) => {
              setFirstName(value)
              if (firstNameError && value.trim().length >= 2) setFirstNameError(null)
            }}
            lastName={lastName}
            setLastName={(value) => {
              setLastName(value)
              if (lastNameError && value.trim().length >= 2) setLastNameError(null)
            }}
            t={t}
            onSubmit={handleStep1Continue}
            externalFirstNameError={firstNameError}
            externalLastNameError={lastNameError}
          />
        )}

        {step === 2 && (
          <Step2Account
            bankAccount={bankAccount}
            setBankAccount={(value) => {
              setBankAccount(value)
              if (errorMessage === t.bankAccountExists) setErrorMessage(null)
              if (bankAccountError) setBankAccountError(null)
            }}
            t={t}
            externalBankAccountError={bankAccountError}
            disabled={loading}
          />
        )}

        {step === 3 && <Step3Envelopes t={t} />}

        {step === 4 && (
          <fieldset disabled={loading} className="w-full">
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
          </fieldset>
        )}

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

      <OnboardingFooter
        step={step}
        loading={loading}
        isSimulating={isSimulating}
        onBack={handleBack}
        primaryAction={primaryAction}
      />
    </div>
  )
}

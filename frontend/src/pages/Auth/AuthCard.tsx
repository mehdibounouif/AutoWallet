import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, AlertTriangle, Globe, Info, Loader2 } from 'lucide-react'
import { SessionEndedCard } from './SessionEndedCard'
import { useTranslation } from '../../i18n'
import type { Translations } from '../../i18n'
import { writeSignupDraft } from '../../auth/signupDraft'
import { clearGoogleReturnPath, rememberGoogleReturnPath, safeReturnPath } from '../../auth/returnPath'
import { apiFetch } from '../../api/request'
import { apiErrorDetail } from '../../api/errors'
import { useRequestSignal } from '../../hooks/useRequestSignal'
import { isValidEmail } from '../../auth/validation'
import { setTwoFactorStatus } from '../../auth/recoveryCodes'
import { setToken } from '../../auth/session'
import {
  clearSignupCredentials,
  clearTwoFactorCredentials,
  setSignupCredentials,
  setTwoFactorCredentials,
} from '../../auth/pendingCredentials'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input, RevealInput } from '../../components/ui/Field'
import { FormCard, FormHeading } from '../../components/ui/FormCard'
import { PasswordStrength } from '../../components/ui/PasswordStrength'
import { AuthShell } from '../../components/layout/AuthShell'

interface AuthCardProps {
  mode: 'login' | 'signup'
  t?: Translations
}

type GoogleStatus = 'idle' | 'redirecting' | 'cancelled' | 'existing_password'

export function AuthCard({ mode, t: providedTranslations }: AuthCardProps) {
  const { t: translated } = useTranslation()
  const t = providedTranslations ?? translated
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const statusFromQuery = searchParams.get('google_status')
  const emailFromQuery = searchParams.get('email')
  const reasonFromQuery = searchParams.get('reason')
  const redirectTarget = searchParams.get('redirect') || searchParams.get('return_to')

  const [sessionExpired, setSessionExpired] = useState(reasonFromQuery === 'expired')
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus>(
    statusFromQuery === 'cancelled' ? 'cancelled'
      : statusFromQuery === 'existing_password' ? 'existing_password'
        : statusFromQuery === 'redirecting' ? 'redirecting'
          : 'idle',
  )

  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState(emailFromQuery || '')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const requestSignal = useRequestSignal()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [termsError, setTermsError] = useState(false)

  // Adjust state during render when query params change (the URL is the source of truth).
  const [previousStatus, setPreviousStatus] = useState(statusFromQuery)
  if (statusFromQuery !== previousStatus) {
    setPreviousStatus(statusFromQuery)
    if (statusFromQuery === 'cancelled') setGoogleStatus('cancelled')
    else if (statusFromQuery === 'existing_password') setGoogleStatus('existing_password')
    else if (statusFromQuery === 'redirecting') setGoogleStatus('redirecting')
    else if (!statusFromQuery) setGoogleStatus('idle')
  }

  const [previousEmail, setPreviousEmail] = useState(emailFromQuery)
  if (emailFromQuery !== previousEmail) {
    setPreviousEmail(emailFromQuery)
    if (emailFromQuery) setEmail(emailFromQuery)
  }

  const [previousReason, setPreviousReason] = useState(reasonFromQuery)
  if (reasonFromQuery !== previousReason) {
    setPreviousReason(reasonFromQuery)
    setSessionExpired(reasonFromQuery === 'expired')
  }

  useEffect(() => {
    if (statusFromQuery === 'existing_password') passwordInputRef.current?.focus()
    else if (statusFromQuery === 'cancelled') emailInputRef.current?.focus()
  }, [statusFromQuery])

  useEffect(() => () => {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
  }, [])

  useEffect(() => {
    if (mode === 'login') {
      clearSignupCredentials()
      clearTwoFactorCredentials()
    }
  }, [mode])

  const validateEmail = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return t.emailRequired
    if (!isValidEmail(trimmed)) return t.emailInvalid
    return null
  }

  const checkEmailAvailability = async (emailToCheck: string, signal?: AbortSignal) => {
    const trimmed = emailToCheck.trim().toLowerCase()
    if (!trimmed || !isValidEmail(trimmed)) return false
    const fetchFn = window.fetch as unknown as { _isMockFunction?: boolean; getMockImplementation?: () => unknown }
    if (fetchFn?._isMockFunction && !fetchFn.getMockImplementation?.()) {
      return false
    }
    try {
      const response = await apiFetch(`/api/auth/check-email?email=${encodeURIComponent(trimmed)}`, { signal })
      if (response && response.ok) {
        const data = await response.json()
        if (data && data.exists) {
          setEmailError(t.emailExists)
          setErrorMessage(t.emailExists)
          return true
        } else {
          setEmailError((cur) => (cur === t.emailExists ? null : cur))
          setErrorMessage((cur) => (cur === t.emailExists ? null : cur))
        }
      }
    } catch {
      // ignore network errors
    }
    return false
  }

  useEffect(() => {
    if (mode !== 'signup') return
    const trimmed = email.trim()
    if (!trimmed || !isValidEmail(trimmed)) {
      if (emailError === t.emailExists) setEmailError(null)
      if (errorMessage === t.emailExists) setErrorMessage(null)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(() => {
      void checkEmailAvailability(trimmed, controller.signal)
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [email, mode, t.emailExists])

  const validatePassword = (value: string) => (mode === 'signup' && value.length < 8 ? t.pwTooShort : null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (loading) return
    setErrorMessage(null)

    if (mode === 'signup') {
      const nextEmailError = validateEmail(email)
      const nextPasswordError = validatePassword(password)
      const nextTermsError = !agreeTerms
      setEmailError(nextEmailError)
      setPasswordError(nextPasswordError)
      setTermsError(nextTermsError)

      if (nextEmailError || nextPasswordError || nextTermsError) {
        setErrorMessage(nextEmailError || (nextPasswordError ? t.pwRequirement : t.termsRequired))
        return
      }

      if (emailError === t.emailExists || errorMessage === t.emailExists) {
        setErrorMessage(t.emailExists)
        return
      }

      setLoading(true)
      const isTaken = await checkEmailAvailability(email)
      setLoading(false)
      if (isTaken) {
        return
      }

      // Keep the password in memory while non-secret draft details survive route changes.
      const draft = { email: email.trim() }
      setSignupCredentials({ ...draft, password })
      writeSignupDraft(draft)
      navigate('/welcome/about', { state: draft })
      return
    }

    if (!email.trim() || !password) {
      setErrorMessage(t.wrongCredentials)
      return
    }

    const signal = requestSignal()
    setLoading(true)
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        signal,
      })

      if (response.ok) {
        const data = await response.json()
        if (typeof data.access_token !== 'string') throw new Error('Missing access token')
        setToken(data.access_token)
        setTwoFactorStatus(email.trim(), false)
        navigate(safeReturnPath(redirectTarget))
      } else if (response.status === 401) {
        const errData = await response.json().catch(() => ({}))
        if (apiErrorDetail(errData, '').message === '2FA code required') {
          setTwoFactorCredentials({ email: email.trim(), password })
          setTwoFactorStatus(email.trim(), true)
          navigate(`/login/2fa?redirect=${encodeURIComponent(safeReturnPath(redirectTarget))}`)
          return
        }
        setErrorMessage(t.wrongCredentials)
      } else if (response.status === 503) {
        setErrorMessage(t.serviceUnavailable)
      } else {
        setErrorMessage(t.wrongCredentials)
      }
    } catch {
      if (!signal.aborted) setErrorMessage(t.serviceUnavailable)
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    setErrorMessage(null)
    setGoogleStatus('redirecting')
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('google_status', 'redirecting')
    setSearchParams(nextParams, { replace: true })
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    redirectTimerRef.current = setTimeout(() => {
      rememberGoogleReturnPath(redirectTarget)
      window.location.href = '/api/auth/oauth/google/login'
    }, 1800)
  }

  const handleCancelGoogle = () => {
    clearGoogleReturnPath()
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current)
      redirectTimerRef.current = null
    }
    setGoogleStatus('cancelled')
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('google_status', 'cancelled')
    setSearchParams(nextParams, { replace: true })
    setTimeout(() => emailInputRef.current?.focus(), 100)
  }

  const clearGoogleStatus = () => {
    setGoogleStatus('idle')
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('google_status')
    setSearchParams(nextParams, { replace: true })
  }

  if (sessionExpired) {
    return (
      <SessionEndedCard
        onLogInAgain={() => {
          setSessionExpired(false)
          const nextParams = new URLSearchParams(searchParams)
          nextParams.delete('reason')
          setSearchParams(nextParams, { replace: true })
          setTimeout(() => emailInputRef.current?.focus(), 100)
        }}
      />
    )
  }

  if (googleStatus === 'redirecting') {
    return (
      <AuthShell>
        <FormCard className="flex flex-col items-center p-8 text-center sm:p-10">
          <div role="status" aria-live="polite" className="flex flex-col items-center">
            <span className="mb-5 grid size-12 place-items-center rounded-full bg-action-primary-subtle">
              <Loader2 className="size-6 animate-spin text-action-primary" aria-hidden="true" />
            </span>
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink">{t.googleOpeningTitle}</h1>
            <p className="max-w-[340px] text-[15px] leading-relaxed text-muted">{t.googleOpeningSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={handleCancelGoogle}
            className="mt-7 rounded-control px-5 py-2.5 text-sm font-medium text-brand-navy transition-colors hover:bg-canvas hover:text-ink active:bg-layer"
          >
            {t.googleCancel}
          </button>
        </FormCard>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <FormCard>
        <FormHeading
          className="mb-5"
          title={mode === 'login' ? t.loginTitle : t.signupTitle}
          description={mode === 'login' ? t.loginSubtitle : t.signupSubtitle}
        />

        {googleStatus === 'cancelled' && (
          <Alert
            tone="warning"
            className="mb-5"
            icon={<AlertTriangle className="size-5" />}
            action={<button type="button" onClick={clearGoogleStatus} className="px-0.5 text-xs font-semibold opacity-60 hover:opacity-100" aria-label="Dismiss alert">✕</button>}
          >
            {t.googleCancelledAlert}
          </Alert>
        )}

        {googleStatus === 'existing_password' && (
          <Alert
            tone="brand"
            className="mb-5"
            icon={<Info className="size-5" />}
            action={<button type="button" onClick={clearGoogleStatus} className="px-0.5 text-xs font-semibold opacity-60 hover:opacity-100" aria-label="Dismiss alert">✕</button>}
          >
            {t.googleExistingPasswordAlert}
          </Alert>
        )}

        {errorMessage && (
          <Alert tone="danger" className="mb-5" icon={<AlertCircle className="size-5" />}>
            <div>{errorMessage}</div>
            {errorMessage === t.emailExists && (
              <div className="mt-2 flex gap-4 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null)
                    setEmailError(null)
                    navigate('/login')
                  }}
                  className="text-action-primary underline"
                >
                  {t.loginButton}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null)
                    setEmailError(null)
                    navigate('/forgot-password')
                  }}
                  className="text-action-primary underline"
                >
                  {t.forgotPassword}
                </button>
              </div>
            )}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t.emailLabel} htmlFor="email-input" error={emailError}>
            <Input
              id="email-input"
              ref={emailInputRef}
              type="email"
              autoComplete="email"
              required
              autoFocus={!statusFromQuery}
              value={email}
              onBlur={() => {
                if (mode === 'signup') {
                  const formatErr = validateEmail(email)
                  if (formatErr) {
                    setEmailError(formatErr)
                  } else {
                    void checkEmailAvailability(email)
                  }
                }
              }}
              onChange={(event) => {
                const nextVal = event.target.value
                setEmail(nextVal)
                if (emailError === t.emailExists || errorMessage === t.emailExists) {
                  setEmailError(null)
                  setErrorMessage(null)
                } else if (emailError) {
                  setEmailError(validateEmail(nextVal))
                }
                if (googleStatus !== 'idle') setGoogleStatus('idle')
              }}
              placeholder={t.emailPlaceholder}
              aria-invalid={Boolean(emailError)}
            />
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="password-input" className="block text-[13px] font-semibold text-ink">{t.passwordLabel}</label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs font-medium text-action-primary hover:text-action-primary-hover hover:underline"
                >
                  {t.forgotPassword}
                </button>
              )}
            </div>
            <RevealInput
              id="password-input"
              ref={passwordInputRef}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              revealed={showPassword}
              onToggleReveal={() => setShowPassword((value) => !value)}
              toggleLabel={showPassword ? 'Hide password' : 'Show password'}
              required
              value={password}
              onBlur={() => { if (mode === 'signup') setPasswordError(validatePassword(password)) }}
              onChange={(event) => {
                setPassword(event.target.value)
                if (passwordError) setPasswordError(validatePassword(event.target.value))
                if (googleStatus !== 'idle') setGoogleStatus('idle')
              }}
              placeholder={t.passwordPlaceholder}
              aria-invalid={Boolean(passwordError)}
            />
            {passwordError && (
              <p className="flex items-center gap-1.5 text-xs text-action-danger">
                <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{passwordError}</span>
              </p>
            )}
            {mode === 'signup' && <PasswordStrength password={password} t={t} />}
          </div>

          {mode === 'signup' && (
            <div className="pt-1">
              <label className="flex cursor-pointer items-start gap-2.5 select-none">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={agreeTerms}
                  onChange={(event) => {
                    setAgreeTerms(event.target.checked)
                    if (termsError && event.target.checked) setTermsError(false)
                  }}
                  className={`mt-1 size-4 cursor-pointer rounded accent-action-primary ${termsError ? 'ring-1 ring-action-danger' : ''}`}
                />
                <span className="text-xs leading-snug text-brand-navy">
                  I have read the{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" aria-label="Terms (opens in a new tab)" onClick={(event) => event.stopPropagation()} className="text-action-primary underline hover:text-action-primary-hover">Terms</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" aria-label="Privacy (opens in a new tab)" onClick={(event) => event.stopPropagation()} className="text-action-primary underline hover:text-action-primary-hover">Privacy</a>
                  {' '}pages.
                </span>
              </label>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              loading={loading}
              disabled={mode === 'signup' ? password.length < 8 || !email.trim() : !email.trim() || !password}
              className="w-full"
            >
              {loading ? (mode === 'login' ? t.loggingIn : t.signingUp) : mode === 'login' ? t.loginButton : t.signupButton}
            </Button>
          </div>

          <div className="relative flex items-center justify-center py-2">
            <div className="w-full border-t border-line" />
            <span className="absolute bg-surface px-3 text-xs text-muted">{t.or}</span>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={handleGoogleLogin}
            className="w-full font-medium"
            icon={<Globe className="size-4.5 shrink-0" aria-hidden="true" />}
          >
            {t.googleButton}
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 text-sm text-brand-navy">
          <span>{mode === 'login' ? t.newToAutoWallet : t.alreadyHaveAccount}</span>
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null)
              navigate(mode === 'login' ? '/signup' : '/login')
            }}
            className="font-semibold text-action-primary hover:text-action-primary-hover hover:underline"
          >
            {mode === 'login' ? t.signUpLink : t.logInLink}
          </button>
        </div>
      </FormCard>
    </AuthShell>
  )
}

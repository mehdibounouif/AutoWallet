import { Button } from '../../components/ui/Button'
import { TextInput } from '../../components/ui/TextInput'
import { AuthPanel } from '../../components/ui/AuthPanel'
import { EMAIL_REQUIRED, EMAIL_INVALID, PASSWORD_REQUIREMENT, SERVICE_UNAVAILABLE } from '../../content/messages'
import { LegalFooter } from '../../components/common/LegalFooter'
import { PasswordStrength } from '../../components/common/PasswordStrength'
import { useState, useEffect, useRef } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'
import { GoogleIcon } from '../../components/icons'
import { SessionEndedCard } from './SessionEndedCard'
import { writeSignupDraft } from '../../auth/signupDraft'
import { clearGoogleReturnPath, rememberGoogleReturnPath, safeReturnPath } from '../../auth/returnPath'
import { apiFetch } from '../../api/request'
import { saveAccessToken } from '../../auth/session'
import { apiErrorDetail } from '../../api/errors'
import { useRequestSignal } from '../../hooks/useRequestSignal'
import { useCountdown } from '../../hooks/useCountdown'
import { isValidEmail } from '../../auth/validation'
import {
  clearSignupCredentials,
  clearTwoFactorCredentials,
  setSignupCredentials,
  setTwoFactorCredentials,
} from '../../auth/pendingCredentials'

interface AuthCardProps {
  mode: 'login' | 'signup'
}

export function AuthCard({
  mode,
}: AuthCardProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const statusFromQuery = searchParams.get('google_status')
  const emailFromQuery = searchParams.get('email')
  const reasonFromQuery = searchParams.get('reason')

  // Session ended state per Figma A5 (#115:878)
  const [sessionExpired, setSessionExpired] = useState(reasonFromQuery === 'expired')

  // Google OAuth flow state per Figma A3 (#114:695)
  const [googleStatus, setGoogleStatus] = useState<
    'idle' | 'redirecting' | 'cancelled' | 'existing_password'
  >(
    statusFromQuery === 'cancelled'
      ? 'cancelled'
      : statusFromQuery === 'existing_password'
      ? 'existing_password'
      : statusFromQuery === 'redirecting'
      ? 'redirecting'
      : 'idle'
  )

  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  // Form States
  const [email, setEmail] = useState(emailFromQuery || '')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { countdown, startCountdown } = useCountdown()
  const requestSignal = useRequestSignal()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [termsError, setTermsError] = useState(false)

  // Adjust state during render if query params change
  const [prevQueryStatus, setPrevQueryStatus] = useState(statusFromQuery)
  if (statusFromQuery !== prevQueryStatus) {
    setPrevQueryStatus(statusFromQuery)
    if (statusFromQuery === 'cancelled') setGoogleStatus('cancelled')
    else if (statusFromQuery === 'existing_password') setGoogleStatus('existing_password')
    else if (statusFromQuery === 'redirecting') setGoogleStatus('redirecting')
    else if (!statusFromQuery) setGoogleStatus('idle')
  }

  const [prevQueryEmail, setPrevQueryEmail] = useState(emailFromQuery)
  if (emailFromQuery !== prevQueryEmail) {
    setPrevQueryEmail(emailFromQuery)
    if (emailFromQuery) setEmail(emailFromQuery)
  }

  const [prevReasonQuery, setPrevReasonQuery] = useState(reasonFromQuery)
  if (reasonFromQuery !== prevReasonQuery) {
    setPrevReasonQuery(reasonFromQuery)
    setSessionExpired(reasonFromQuery === 'expired')
  }

  // Auto-focus relevant field according to query status
  useEffect(() => {
    if (statusFromQuery === 'existing_password') {
      passwordInputRef.current?.focus()
    } else if (statusFromQuery === 'cancelled') {
      emailInputRef.current?.focus()
    }
  }, [statusFromQuery])

  // Cleanup redirect timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (mode === 'login') {
      clearSignupCredentials()
      clearTwoFactorCredentials()
    }
  }, [mode])

  const validateEmail = (val: string): string | null => {
    const trimmed = val.trim()
    if (!trimmed) return EMAIL_REQUIRED
    if (!isValidEmail(trimmed)) return EMAIL_INVALID
    return null
  }

  const validatePassword = (val: string): string | null => {
    if (mode === 'signup' && val.length < 8) return "Password must be at least 8 characters."
    return null
  }

  // Handle Form Submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (loading || countdown > 0) return
    setErrorMessage(null)

    if (mode === 'signup') {
      const errEmail = validateEmail(email)
      const errPassword = validatePassword(password)
      const errTerms = !agreeTerms

      setEmailError(errEmail)
      setPasswordError(errPassword)
      setTermsError(errTerms)

      if (errEmail || errPassword || errTerms) {
        if (errEmail) {
          setErrorMessage(errEmail)
        } else if (errPassword) {
          setErrorMessage(PASSWORD_REQUIREMENT)
        } else if (errTerms) {
          setErrorMessage("Please read the Terms and Privacy pages.")
        }
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
      setErrorMessage("Wrong email or password")
      return
    }

    const signal = requestSignal()
    setLoading(true)

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        signal,
      })

      if (res.ok) {
        const data = await res.json()
        if (typeof data.access_token !== 'string') throw new Error('Missing access token')
        saveAccessToken(data.access_token)
        navigate(safeReturnPath(searchParams.get('redirect') || searchParams.get('return_to')))
      } else if (res.status === 401) {
        const errData = await res.json().catch(() => ({}))
        if (apiErrorDetail(errData, '').message === '2FA code required') {
          setTwoFactorCredentials({ email: email.trim(), password })
          navigate(`/login/2fa?redirect=${encodeURIComponent(safeReturnPath(searchParams.get('redirect') || searchParams.get('return_to')))}`)
          return
        } else {
          setErrorMessage("Wrong email or password")
        }
      } else if (res.status === 429) {
        const retry = Number(res.headers.get('Retry-After'))
        startCountdown(Number.isFinite(retry) && retry > 0 ? Math.min(900, Math.ceil(retry)) : 60)
        setErrorMessage('Too many sign-in attempts. Wait before trying again.')
      } else if (res.status >= 500) {
        setErrorMessage(SERVICE_UNAVAILABLE)
      } else if (res.status === 422) {
        const payload = await res.json().catch(() => null)
        setErrorMessage(apiErrorDetail(payload, 'Check your email and password and try again.').message)
      } else {
        setErrorMessage('Sign-in could not be completed. Please try again.')
      }
    } catch {
      if (!signal.aborted) setErrorMessage(SERVICE_UNAVAILABLE)
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }

  // Handle Google OAuth per Figma A3 (#114:695)
  const handleGoogleLogin = () => {
    setErrorMessage(null)
    setGoogleStatus('redirecting')
    const newParams = new URLSearchParams(searchParams)
    newParams.set('google_status', 'redirecting')
    setSearchParams(newParams, { replace: true })

    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current)
    }

    // Give user brief moment to see the Figma Opening Google state, then redirect
    redirectTimerRef.current = setTimeout(() => {
      rememberGoogleReturnPath(searchParams.get('redirect') || searchParams.get('return_to'))
      window.location.href = '/api/auth/oauth/google/login'
    }, 1800)
  }

  // Handle Cancel from Google Redirecting Card (Figma #114:696 -> #114:734)
  const handleCancelGoogle = () => {
    clearGoogleReturnPath()
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current)
      redirectTimerRef.current = null
    }
    setGoogleStatus('cancelled')
    const newParams = new URLSearchParams(searchParams)
    newParams.set('google_status', 'cancelled')
    setSearchParams(newParams, { replace: true })
    setTimeout(() => {
      emailInputRef.current?.focus()
    }, 100)
  }

  // Figma A5 #115:879 & #115:914: Auth / Session ended / Default
  if (sessionExpired) {
    return (
      <SessionEndedCard
        onLogInAgain={() => {
          setSessionExpired(false)
          const newParams = new URLSearchParams(searchParams)
          newParams.delete('reason')
          setSearchParams(newParams, { replace: true })
          setTimeout(() => {
            emailInputRef.current?.focus()
          }, 100)
        }}
      />
    )
  }

  // Figma #114:696: Auth / Google / Redirecting / Desktop
  if (googleStatus === 'redirecting') {
    return (
      <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-5 z-10 animate-in fade-in duration-200">
        {/* 440px Centered White Card per Figma #114:696 */}
        <AuthPanel
          role="status"
          aria-live="polite"
          className="p-8 sm:p-10 text-center flex flex-col items-center"
        >
          {/* Animated Spinner (28-32px, #5A64B4) */}
          <div className="w-12 h-12 rounded-full bg-action-primary-subtle flex items-center justify-center mb-5">
            <Loader2 className="w-6 h-6 text-action-primary animate-spin" />
          </div>

          {/* Title: Opening Google… */}
          <h1 className="text-2xl font-semibold text-brand-ink tracking-tight mb-2">
            Opening Google…
          </h1>

          {/* Subtitle */}
          <p className="text-[15px] text-brand-muted leading-relaxed max-w-[340px]">
            Pick your Google account in the window that opens. You will come straight back here.
          </p>

          {/* Ghost Cancel Button */}
          <button
            type="button"
            onClick={handleCancelGoogle}
            className="mt-7 px-5 py-2.5 rounded-[10px] text-sm font-medium text-brand-navy hover:text-brand-ink hover:bg-brand-surface active:bg-[#EDF0F4] transition cursor-pointer"
          >
            Cancel
          </button>
        </AuthPanel>

        {/* Legal Footer */}
        <LegalFooter />
      </main>
    )
  }

  return (
    <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-5 z-10">
      {/* 440px Centered White Card per Figma layout_bd7b430b */}
      <AuthPanel className="transition-all">
        {/* Card Heading */}
        <div className="mb-5 space-y-1">
          <h1 className="text-2xl font-semibold text-brand-ink tracking-tight">
            {mode === 'login' ? "Log in" : "Create your account"}
          </h1>
          <p className="text-[15px] text-brand-muted leading-relaxed">
            {mode === 'login' ? "Welcome back to AutoWallet." : "It takes a minute. You set your rules right after."}
          </p>
        </div>

        {/* Figma A3: Cancelled Alert Banner (#114:734 & Mobile #114:896) */}
        {googleStatus === 'cancelled' && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] text-[#9A3412] text-sm flex items-start gap-3 animate-in fade-in"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 text-tax-solid mt-0.5" />
            <div className="flex-1 leading-snug">
              Google sign-in was cancelled. Try again, or use your email.
            </div>
            <button
              type="button"
              onClick={() => {
                setGoogleStatus('idle')
                const newParams = new URLSearchParams(searchParams)
                newParams.delete('google_status')
                setSearchParams(newParams, { replace: true })
              }}
              className="text-[#9A3412]/60 hover:text-[#9A3412] p-0.5 text-xs font-semibold cursor-pointer"
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        )}

        {/* Figma A3: Existing Password Alert Banner (#114:815) */}
        {googleStatus === 'existing_password' && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-action-primary-subtle border border-[#D0D6F5] text-brand-navy text-sm flex items-start gap-3 animate-in fade-in"
          >
            <Info className="w-5 h-5 shrink-0 text-action-primary mt-0.5" />
            <div className="flex-1 leading-snug">
              This email already has a password. Log in using your email and password.
            </div>
            <button
              type="button"
              onClick={() => {
                setGoogleStatus('idle')
                const newParams = new URLSearchParams(searchParams)
                newParams.delete('google_status')
                setSearchParams(newParams, { replace: true })
              }}
              className="text-brand-navy/60 hover:text-brand-navy p-0.5 text-xs font-semibold cursor-pointer"
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error / Feedback Alert Banner (Figma Alert component: EL-bf9e5c13) */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-action-danger-subtle border border-[#FFD2D2] text-action-danger text-sm flex items-start gap-3 animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-action-danger mt-0.5" />
            <div className="flex-1 leading-snug">{errorMessage}</div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label htmlFor="email-input" className="block text-sm font-medium text-brand-ink">
              Email
            </label>
            <TextInput appearance="auth"
              id="email-input"
              ref={emailInputRef}
              type="email"
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? 'auth-email-error' : undefined}
              autoComplete="email"
              required
              autoFocus={!statusFromQuery}
              value={email}
              onBlur={() => {
                if (mode === 'signup') {
                  setEmailError(validateEmail(email))
                }
              }}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) {
                  setEmailError(validateEmail(e.target.value))
                }
                if (googleStatus !== 'idle') {
                  setGoogleStatus('idle')
                }
              }}
              placeholder="name@example.com"
            />
            {emailError && (
              <p id="auth-email-error" className="text-xs text-action-danger flex items-center gap-1.5 mt-1 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{emailError}</span>
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password-input" className="block text-sm font-medium text-brand-ink">
                Password
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs font-medium text-action-primary hover:text-action-primary-hover hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>

            <div className="relative">
              <TextInput appearance="auth"
                id="password-input"
                ref={passwordInputRef}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                type={showPassword ? 'text' : 'password'}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? 'auth-password-error' : undefined}
                required
                value={password}
                onBlur={() => {
                  if (mode === 'signup') {
                    setPasswordError(validatePassword(password))
                  }
                }}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (passwordError) {
                    setPasswordError(validatePassword(e.target.value))
                  }
                  if (googleStatus !== 'idle') {
                    setGoogleStatus('idle')
                  }
                }}
                placeholder="••••••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-ink p-1 cursor-pointer transition"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p id="auth-password-error" className="text-xs text-action-danger flex items-center gap-1.5 mt-1 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{passwordError}</span>
              </p>
            )}

            {/* Password Strength Meter & Requirement (Figma A2 Signup) */}
            {mode === 'signup' && (
              <PasswordStrength password={password} />
            )}
          </div>

          {/* Terms Checkbox (Figma A2 component EL-d12cf65d) */}
          {mode === 'signup' && (
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked)
                    if (termsError && e.target.checked) setTermsError(false)
                  }}
                  className={`mt-1 w-4 h-4 rounded text-action-primary focus:ring-action-primary cursor-pointer ${
                    termsError ? 'border-action-danger ring-1 ring-action-danger' : 'border-border-subtle'
                  }`}
                />
                <span className="text-xs text-brand-navy leading-snug">
                  I have read the{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Terms (opens in a new tab)"
                    onClick={(event) => event.stopPropagation()}
                    className="underline text-action-primary hover:text-action-primary-hover"
                  >
                    Terms
                  </a>{' '}
                  and{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Privacy (opens in a new tab)"
                    onClick={(event) => event.stopPropagation()}
                    className="underline text-action-primary hover:text-action-primary-hover"
                  >
                    Privacy
                  </a>
                  {' '}pages.
                </span>
              </label>
            </div>
          )}

          {/* Submit Button (Figma Button: Primary 44px, radius 10px, #5A64B4) */}
          <div className="pt-2">
            <Button appearance="auth" variant="primary"
              type="submit"
              disabled={
                loading || countdown > 0 ||
                (mode === 'signup' && (password.length < 8 || !email.trim())) ||
                (mode === 'login' && (!email.trim() || !password))
              }
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'login' ? "Logging in…" : "Creating your account…"}</span>
                </>
              ) : countdown > 0 ? (
                `Try again in ${countdown}s`
              ) : mode === 'login' ? (
                "Log in"
              ) : (
                "Create account"
              )}
            </Button>
          </div>

          {/* Divider: or */}
          <div className="relative py-2 flex items-center justify-center">
            <div className="w-full border-t border-border-subtle" />
            <span className="absolute bg-white px-3 text-xs text-brand-muted">or</span>
          </div>

          {/* Social Google Login Button (Figma Button EL-6c8defc7) */}
          <Button appearance="auth" variant="outline"
            type="button"
            onClick={handleGoogleLogin}
          >
            <GoogleIcon className="w-4.5 h-4.5 shrink-0" />
            <span>Continue with Google</span>
          </Button>
        </form>

        {/* Switch Mode Prompt (Figma frame EL-6b7e32fb) */}
        <div className="mt-6 text-center text-sm text-brand-navy flex items-center justify-center gap-1.5">
          <span>{mode === 'login' ? "New to AutoWallet?" : "Already have an account?"}</span>
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null)
              navigate(mode === 'login' ? '/signup' : '/login')
            }}
            className="font-semibold text-action-primary hover:text-action-primary-hover hover:underline cursor-pointer"
          >
            {mode === 'login' ? "Sign up" : "Log in"}
          </button>
        </div>
      </AuthPanel>

      {/* Legal Footer (Figma frame EL-0b7a78e5) */}
      <LegalFooter />
    </main>
  )
}

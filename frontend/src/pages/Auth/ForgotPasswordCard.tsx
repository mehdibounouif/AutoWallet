import { TextInput } from '../../components/ui/TextInput'
import { Button } from '../../components/ui/Button'
import { AuthPanel } from '../../components/ui/AuthPanel'
import { PASSWORD_RECOVERY_UNAVAILABLE, SERVICE_UNAVAILABLE, EMAIL_INVALID, EMAIL_REQUIRED } from '../../content/messages'
import { useCountdown } from '../../hooks/useCountdown'
import { LegalFooter } from '../../components/common/LegalFooter'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, MailCheck, ArrowLeft, Loader2 } from 'lucide-react'
import { isValidEmail } from '../../auth/validation'
import { apiFetch } from '../../api/request'
import { useRequestSignal } from '../../hooks/useRequestSignal'
import { usePendingNavigation } from '../../hooks/usePendingNavigation'

export function ForgotPasswordCard() {
  const navigate = useNavigate()
  const requestSignal = useRequestSignal()

  const [email, setEmail] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigationBlocked = usePendingNavigation(loading, { allowSignedOut: true })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [emailTouched, setEmailTouched] = useState(false)
  const { countdown, startCountdown } = useCountdown()

  const sendResetLink = async () => {
    if (loading) return
    setEmailTouched(true)
    const requestedEmail = (submittedEmail ?? email).trim()
    if (!isValidEmail(requestedEmail)) return

    const signal = requestSignal()
    setLoading(true)
    setErrorMessage(null)
    try {
      const response = await apiFetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: requestedEmail }),
        signal,
      })
      if (response.status === 404) {
        setErrorMessage(PASSWORD_RECOVERY_UNAVAILABLE)
        return
      }
      if (!response.ok) throw new Error('Reset request failed')
      setSubmittedEmail(requestedEmail)
      startCountdown(60)
    } catch {
      if (!signal.aborted) setErrorMessage(SERVICE_UNAVAILABLE)
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    void sendResetLink()
  }

  const handleResend = () => {
    if (countdown === 0) void sendResetLink()
  }

  return (
    <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-5 z-10 animate-in fade-in duration-200">
      {/* 440px Centered Card per Figma #116:816 & #116:868 */}
      <AuthPanel className="transition-all">
        {errorMessage && <p role="alert" className="mb-4 text-sm text-action-danger">{errorMessage}</p>}
        {navigationBlocked && <p role="status" className="mb-4 text-sm text-brand-muted">Wait for the reset-link request to finish before leaving this page.</p>}
        {submittedEmail !== null ? (
          /* Screen 2: Link sent / Check your inbox (#116:868) */
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-action-primary-subtle flex items-center justify-center text-action-primary">
              <MailCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold text-brand-ink tracking-tight">
                Check your inbox
              </h1>
              <p className="text-[15px] text-brand-muted leading-relaxed max-w-[340px]">
                {`If an account exists for ${submittedEmail}, a link to choose a new password is on its way. It works once.`}
              </p>
            </div>

            {/* Resend button with 60s cooldown per Note #116:904 */}
            <div className="w-full pt-2">
              <Button appearance="auth" variant="secondary"
                type="button"
                onClick={handleResend}
                disabled={loading || countdown > 0}
              >
                {loading ? 'Sending…' : countdown > 0
                  ? `Send the link again in (${countdown}s)`
                  : "Send the link again"}
              </Button>
            </div>


            {/* Back to log in link */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 text-sm font-medium text-action-primary-hover hover:text-brand-navy hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to log in</span>
              </button>
            </div>
          </div>
        ) : (
          /* Screen 1: Reset your password form (#116:816 & #116:1037) */
          <div>
            <div className="w-12 h-12 rounded-full bg-action-primary-subtle flex items-center justify-center mb-5 text-action-primary">
              <KeyRound className="w-6 h-6" />
            </div>

            <div className="mb-6 space-y-1">
              <h1 className="text-2xl font-semibold text-brand-ink tracking-tight">
                Reset your password
              </h1>
              <p className="text-[15px] text-brand-muted leading-relaxed">
                Enter the email you signed up with. We'll send a link to choose a new password.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="block text-sm font-medium text-brand-ink">
                  Email
                </label>
                <TextInput appearance="auth"
                  id="reset-email"
                  type="email" autoComplete="email"
                  required
                  autoFocus
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  aria-invalid={emailTouched && !isValidEmail(email)}
                  aria-describedby={emailTouched && !isValidEmail(email) ? 'reset-email-error' : undefined}
                  placeholder="name@example.com"
                />
                {emailTouched && !isValidEmail(email) && <p id="reset-email-error" role="alert" className="text-xs text-action-danger">{email.trim() ? EMAIL_INVALID : EMAIL_REQUIRED}</p>}
              </div>

              <div className="pt-2">
                <Button appearance="auth" variant="primary"
                  type="submit"
                  disabled={loading || !email.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending…</span>
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 text-sm font-medium text-action-primary-hover hover:text-brand-navy hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to log in</span>
              </button>
            </div>
          </div>
        )}
      </AuthPanel>

      {/* Legal Footer */}
      <LegalFooter />
    </main>
  )
}

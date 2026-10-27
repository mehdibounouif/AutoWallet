import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound, MailCheck } from 'lucide-react'
import { useCountdown } from '../../hooks/useCountdown'
import { useRequestSignal } from '../../hooks/useRequestSignal'
import { apiFetch } from '../../api/request'
import { isValidEmail } from '../../auth/validation'
import { useTranslation } from '../../i18n'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { FormCard, FormHeading } from '../../components/ui/FormCard'
import { AuthShell } from '../../components/layout/AuthShell'

export function ForgotPasswordCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const requestSignal = useRequestSignal()

  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [emailTouched, setEmailTouched] = useState(false)
  const { countdown, startCountdown } = useCountdown()

  const sendResetLink = async () => {
    if (loading) return
    setEmailTouched(true)
    if (!isValidEmail(email)) return

    const signal = requestSignal()
    setLoading(true)
    setErrorMessage(null)
    try {
      const response = await apiFetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        signal,
      })
      if (response.status === 404) {
        setErrorMessage(t.passwordRecoveryUnavailable)
        return
      }
      if (!response.ok) throw new Error('Reset request failed')
      setSubmitted(true)
      startCountdown(60)
    } catch {
      if (!signal.aborted) setErrorMessage(t.serviceUnavailable)
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void sendResetLink()
  }

  return (
    <AuthShell>
      <FormCard>
        {errorMessage && <Alert tone="danger" className="mb-4">{errorMessage}</Alert>}

        {submitted ? (
          <div className="flex flex-col items-center space-y-5 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-action-primary-subtle text-action-primary">
              <MailCheck className="size-6" aria-hidden="true" />
            </span>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">{t.checkInboxTitle}</h1>
              <p className="max-w-[340px] text-[15px] leading-relaxed text-muted">
                {t.resetLinkSentSubtitle.replace('{email}', email)}
              </p>
            </div>
            <div className="w-full pt-2">
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                disabled={countdown > 0}
                loading={loading}
                onClick={() => { if (countdown === 0) void sendResetLink() }}
              >
                {countdown > 0 ? `${t.sendLinkAgainIn} (${countdown}s)` : t.sendLinkAgain}
              </Button>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 text-sm font-medium text-action-primary-hover hover:text-brand-navy hover:underline"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                <span>{t.backToLogIn}</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <span className="mb-5 grid size-12 place-items-center rounded-full bg-action-primary-subtle text-action-primary">
              <KeyRound className="size-6" aria-hidden="true" />
            </span>
            <FormHeading title={t.forgotPasswordTitle} description={t.forgotPasswordSubtitle} />

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <Field
                label={t.emailLabel}
                htmlFor="reset-email"
                error={emailTouched && !isValidEmail(email) ? (email.trim() ? t.emailInvalid : t.emailRequired) : null}
              >
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  aria-invalid={emailTouched && !isValidEmail(email)}
                  placeholder="name@example.com"
                />
              </Field>

              <div className="pt-2">
                <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!email.trim()}>
                  {loading ? 'Sending…' : t.sendResetLink}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 text-sm font-medium text-action-primary-hover hover:text-brand-navy hover:underline"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                <span>{t.backToLogIn}</span>
              </button>
            </div>
          </div>
        )}
      </FormCard>
    </AuthShell>
  )
}

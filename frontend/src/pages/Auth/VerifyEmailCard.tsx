import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, Mail } from 'lucide-react'
import { apiFetch } from '../../api/request'
import { apiErrorDetail } from '../../api/errors'
import { readSignupDraft } from '../../auth/signupDraft'
import { isValidEmail } from '../../auth/validation'
import { useCountdown } from '../../hooks/useCountdown'
import { useRequestSignal } from '../../hooks/useRequestSignal'
import { useTranslation } from '../../i18n'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { FormCard } from '../../components/ui/FormCard'
import { AuthShell } from '../../components/layout/AuthShell'

export function VerifyEmailCard() {
  const [params] = useSearchParams()
  return (
    <EmailVerification
      key={params.get('token') || 'request-link'}
      token={params.get('token')}
      initialEmail={params.get('email') || readSignupDraft().email || ''}
    />
  )
}

function EmailVerification({ token, initialEmail }: { token: string | null; initialEmail: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(initialEmail)
  const [verification, setVerification] = useState<'idle' | 'checking' | 'success' | 'error'>(token ? 'checking' : 'idle')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const pending = useRef(false)
  const verificationRequest = useRef<Promise<void> | null>(null)
  const requestSignal = useRequestSignal()
  const { countdown, startCountdown } = useCountdown()

  useEffect(() => {
    if (!token) return
    let active = true
    // A token is consumed once. Reuse the promise during StrictMode's effect
    // replay, and let an already-submitted verification finish on navigation.
    verificationRequest.current ??= apiFetch('/api/auth/email/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then(async (response) => {
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(apiErrorDetail(payload, 'Could not verify this link. Request a new link below.').message)
      }
    })
    verificationRequest.current.then(() => {
      if (active) { setVerification('success'); setError(null) }
    }).catch((reason: unknown) => {
      if (active) {
        setVerification('error')
        setError(reason instanceof Error ? reason.message : 'Verification could not be confirmed. Request a new link below.')
      }
    })
    return () => { active = false }
  }, [token])

  const resend = async () => {
    if (pending.current || countdown > 0 || !isValidEmail(email)) return
    pending.current = true
    const signal = requestSignal()
    setSending(true)
    setError(null)
    setNotice(null)
    try {
      const response = await apiFetch('/api/auth/email/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        signal,
      })
      if (signal.aborted) return
      if (!response.ok) {
        if (response.status === 429) {
          const retry = Number(response.headers.get('Retry-After'))
          startCountdown(Number.isFinite(retry) && retry > 0 ? Math.min(900, retry) : 60)
        }
        const payload = await response.json().catch(() => null)
        throw new Error(apiErrorDetail(payload, 'Could not request a verification email. Please try again.').message)
      }
      setNotice('If this account needs verification, a verification email will be sent. Check your inbox and spam folder.')
      startCountdown(60)
    } catch (reason) {
      if (!signal.aborted) setError(reason instanceof Error ? reason.message : 'Email service is unavailable. Please try again.')
    } finally {
      pending.current = false
      if (!signal.aborted) setSending(false)
    }
  }

  return (
    <AuthShell>
      <FormCard className="space-y-5">
        <span className="grid size-12 place-items-center rounded-full bg-action-primary-subtle text-action-primary">
          {verification === 'success' ? <CheckCircle2 className="size-6" aria-hidden="true" /> : <Mail className="size-6" aria-hidden="true" />}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {verification === 'success' ? 'Email verified' : 'Verify your email'}
        </h1>

        {verification === 'checking' ? (
          <p role="status" className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />Verifying your email…
          </p>
        ) : verification === 'success' ? (
          <p role="status" className="text-sm text-success">Your email address is verified. You can continue to your account.</p>
        ) : (
          <p className="text-sm leading-relaxed text-muted">
            {token
              ? 'This verification could not be completed. You can request another link.'
              : t.verifyEmailSubtitle.replace('{email}', email || 'your inbox')}
          </p>
        )}

        {error && <Alert tone="danger" role="alert">{error}</Alert>}
        {notice && <Alert tone="success" role="status">{notice}</Alert>}

        {verification !== 'success' && (
          <form onSubmit={(event) => { event.preventDefault(); void resend() }} className="space-y-3">
            <Field label="Email address" htmlFor="verify-email">
              <Input
                id="verify-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                disabled={sending || verification === 'checking'}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Button
              type="submit"
              variant="outline"
              size="lg"
              className="w-full"
              disabled={sending || verification === 'checking' || countdown > 0 || !isValidEmail(email)}
            >
              {sending ? 'Requesting…' : countdown > 0 ? `Request another link in ${countdown}s` : 'Send verification link'}
            </Button>
          </form>
        )}

        <Button size="lg" className="w-full" onClick={() => navigate('/dashboard', { replace: true })} disabled={verification === 'checking'}>
          Continue to account
        </Button>
      </FormCard>
    </AuthShell>
  )
}

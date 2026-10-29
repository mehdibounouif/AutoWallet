import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, LockKeyhole } from 'lucide-react'
import { apiFetch } from '../../api/request'
import { useRequestSignal } from '../../hooks/useRequestSignal'
import { useTranslation } from '../../i18n'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, RevealInput } from '../../components/ui/Field'
import { FormCard, FormHeading } from '../../components/ui/FormCard'
import { PasswordStrength } from '../../components/ui/PasswordStrength'
import { AuthShell } from '../../components/layout/AuthShell'

export function ResetPasswordCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const requestSignal = useRequestSignal()
  const [searchParams] = useSearchParams()
  const isExpired = searchParams.get('status') === 'expired' || !searchParams.get('token')

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (password.length < 8 || loading) return
    const signal = requestSignal()
    setLoading(true)
    setErrorMessage(null)
    try {
      const response = await apiFetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, token: searchParams.get('token') }),
        signal,
      })
      if (response.status === 404) {
        setErrorMessage(t.passwordRecoveryUnavailable)
        return
      }
      if (!response.ok) throw new Error('Password reset failed')
      setIsSuccess(true)
    } catch {
      if (!signal.aborted) setErrorMessage(t.serviceUnavailable)
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }

  return (
    <AuthShell>
      <FormCard>
        {isExpired ? (
          <div className="flex flex-col items-center space-y-5 text-center">
            <Alert
              tone="warning"
              icon={<AlertTriangle className="size-5 text-tax-solid" />}
              role="alert"
              className="w-full text-start"
            >
              {t.resetLinkExpired}
            </Alert>
            <Button size="lg" className="w-full" onClick={() => navigate('/forgot-password')}>
              {t.askForNewLink}
            </Button>
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col items-center space-y-5 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-savings-tint text-savings-solid">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </span>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">{t.passwordChangedTitle}</h1>
              <p className="text-[15px] leading-relaxed text-muted">{t.passwordChangedSubtitle}</p>
            </div>
            <Button size="lg" className="w-full" onClick={() => navigate('/login')}>{t.loginButton}</Button>
          </div>
        ) : (
          <div>
            <span className="mb-5 grid size-12 place-items-center rounded-full bg-action-primary-subtle text-action-primary">
              <LockKeyhole className="size-6" aria-hidden="true" />
            </span>
            <FormHeading title={t.chooseNewPasswordTitle} description={t.chooseNewPasswordSubtitle} />

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && <Alert tone="danger">{errorMessage}</Alert>}
              <div className="space-y-2">
                <Field label={t.newPasswordLabel} htmlFor="new-password-input">
                  <RevealInput
                    id="new-password-input"
                    autoComplete="new-password"
                    revealed={showPassword}
                    onToggleReveal={() => setShowPassword((value) => !value)}
                    toggleLabel={showPassword ? 'Hide password' : 'Show password'}
                    required
                    autoFocus
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t.passwordPlaceholder}
                  />
                </Field>
                <PasswordStrength password={password} t={t} className="pt-2" />
              </div>
              <div className="pt-2">
                <Button type="submit" size="lg" className="w-full" loading={loading} disabled={password.length < 8}>
                  {loading ? t.savingPassword : t.savePassword}
                </Button>
              </div>
            </form>
          </div>
        )}
      </FormCard>
    </AuthShell>
  )
}

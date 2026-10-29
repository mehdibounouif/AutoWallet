import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, KeyRound, ShieldCheck } from 'lucide-react'
import { isRecoveryCode, normalizeRecoveryCode, setTwoFactorStatus } from '../../auth/recoveryCodes'
import { apiErrorDetail } from '../../api/errors'
import { Dialog } from '../../components/ui/Dialog'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { FormCard, FormHeading } from '../../components/ui/FormCard'
import { OTPInput } from '../../components/ui/OTPInput'
import { AuthShell } from '../../components/layout/AuthShell'
import { loginPath, safeReturnPath } from '../../auth/returnPath'
import { apiFetch } from '../../api/request'
import { useRequestSignal } from '../../hooks/useRequestSignal'
import { useTranslation } from '../../i18n'
import { clearTwoFactorCredentials, getTwoFactorCredentials } from '../../auth/pendingCredentials'
import { setToken } from '../../auth/session'

export function TwoFactorCard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [pendingData] = useState(() => getTwoFactorCredentials() ?? { email: '', password: '' })
  const requestSignal = useRequestSignal()
  const returnTo = safeReturnPath(searchParams.get('redirect') || searchParams.get('return_to'))

  useEffect(() => {
    if (!pendingData.email || !pendingData.password) navigate(loginPath(returnTo), { replace: true })
  }, [navigate, pendingData.email, pendingData.password, returnTo])

  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [wrongCode, setWrongCode] = useState(false)
  const [serviceError, setServiceError] = useState<string | null>(null)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [backupCode, setBackupCode] = useState('')
  const [backupError, setBackupError] = useState(false)
  const inFlight = useRef(false)
  const isComplete = /^\d{6}$/.test(code.replace(/\s/g, ''))

  const signIn = async (method: 'totp_code' | 'recovery_code', value: string) => {
    if (inFlight.current || !pendingData.email || !pendingData.password) return
    if (method === 'totp_code' ? !/^\d{6}$/.test(value) : !isRecoveryCode(value)) return
    inFlight.current = true
    const signal = requestSignal()
    setVerifying(true)
    setWrongCode(false)
    setBackupError(false)
    setServiceError(null)
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingData.email, password: pendingData.password, [method]: value }),
        signal,
      })
      if (signal.aborted) return
      if (response.ok) {
        const data = await response.json()
        if (signal.aborted) return
        if (typeof data.access_token !== 'string' || !data.access_token) throw new Error('Missing access token')
        setToken(data.access_token)
        setTwoFactorStatus(pendingData.email, true)
        clearTwoFactorCredentials()
        setBackupCode('')
        navigate(returnTo, { replace: true })
      } else if (response.status === 401) {
        if (method === 'totp_code') setWrongCode(true)
        else setServiceError('That recovery code or your sign-in details could not be verified. Each recovery code can only be used once.')
      } else {
        const detail = await response.json().catch(() => null)
        setServiceError(apiErrorDetail(detail, t.serviceUnavailable).message)
      }
    } catch {
      if (!signal.aborted) {
        setServiceError(method === 'recovery_code'
          ? 'Sign-in could not be confirmed. If this code was consumed, try another saved code or your authenticator app.'
          : t.serviceUnavailable)
      }
    } finally {
      inFlight.current = false
      if (!signal.aborted) setVerifying(false)
    }
  }

  const handleVerify = (value = code) => void signIn('totp_code', value.replace(/\s/g, ''))
  const handleSubmit = (event: FormEvent) => { event.preventDefault(); handleVerify() }
  const handleLogout = () => { clearTwoFactorCredentials(); navigate(loginPath(returnTo)) }
  const closeBackup = () => {
    setShowBackupModal(false)
    setBackupCode('')
    setServiceError(null)
    setBackupError(false)
  }
  const handleBackupSubmit = (event: FormEvent) => {
    event.preventDefault()
    const value = normalizeRecoveryCode(backupCode)
    setBackupError(!isRecoveryCode(value))
    if (isRecoveryCode(value)) void signIn('recovery_code', value)
  }

  if (!pendingData.email || !pendingData.password) return null

  return (
    <AuthShell>
      <FormCard>
        <span className="mb-5 grid size-12 place-items-center rounded-full bg-action-primary-subtle text-action-primary">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </span>
        <FormHeading title={t.twoFactorTitle} description={t.twoFactorSubtitle} />

        {serviceError && <Alert tone="danger" className="mb-5" icon={<AlertCircle className="size-5" />}>{serviceError}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <span className="block text-[13px] font-semibold text-ink">{t.twoFactorCodeLabel}</span>
            <OTPInput
              value={code}
              onChange={(value) => { setCode(value); if (wrongCode) setWrongCode(false) }}
              disabled={verifying}
              hasError={wrongCode}
              onComplete={handleVerify}
              autoFocus
            />
            {wrongCode && (
              <p role="alert" className="mt-2 flex items-start gap-2 text-xs text-danger-ink">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="leading-snug">{t.twoFactorWrongCode}</span>
              </p>
            )}
          </div>

          <Button type="submit" size="lg" className="w-full" loading={verifying} disabled={!isComplete || verifying}>
            {verifying ? t.twoFactorChecking : t.continueButton}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-3 pt-2 text-sm text-action-primary-hover">
          <button
            type="button"
            disabled={verifying}
            onClick={() => { setServiceError(null); setShowBackupModal(true) }}
            className="font-medium hover:text-brand-navy hover:underline"
          >
            {t.twoFactorCantUseApp}
          </button>
          <button
            type="button"
            disabled={verifying}
            onClick={handleLogout}
            className="font-medium hover:text-brand-navy hover:underline"
          >
            {t.twoFactorLogOut}
          </button>
        </div>
      </FormCard>

      {showBackupModal && (
        <Dialog
          labelledBy="backup-code-title"
          dismissible={!verifying}
          onClose={closeBackup}
          panelClassName="max-w-[420px] space-y-4 p-6 sm:p-8"
        >
          <span className="grid size-10 place-items-center rounded-full bg-action-primary-subtle text-action-primary">
            <KeyRound className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h2 id="backup-code-title" className="text-xl font-semibold text-ink">{t.twoFactorBackupTitle}</h2>
            <p className="text-xs leading-relaxed text-muted sm:text-sm">{t.twoFactorBackupSubtitle}</p>
          </div>

          <form onSubmit={handleBackupSubmit} className="space-y-4 pt-2">
            <Field label="Recovery code" htmlFor="backup-code" error={backupError ? 'Please enter a valid 32-character recovery code.' : null}>
              {serviceError && <p role="alert" className="text-xs text-action-danger">{serviceError}</p>}
              <Input
                id="backup-code"
                type="text"
                autoFocus
                aria-label="Recovery code"
                autoComplete="off"
                spellCheck={false}
                disabled={verifying}
                placeholder={t.twoFactorBackupPlaceholder}
                value={backupCode}
                onChange={(event) => {
                  setBackupCode(normalizeRecoveryCode(event.target.value))
                  if (backupError) setBackupError(false)
                  setServiceError(null)
                }}
                className="text-center font-mono tracking-widest"
                aria-invalid={backupError}
              />
            </Field>

            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" size="lg" className="w-full" loading={verifying} disabled={verifying || !isRecoveryCode(backupCode)}>
                {verifying ? t.twoFactorChecking : t.twoFactorBackupSubmit}
              </Button>
              <Button type="button" variant="ghost" className="w-full" disabled={verifying} onClick={closeBackup}>
                {t.twoFactorBackToCode}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </AuthShell>
  )
}

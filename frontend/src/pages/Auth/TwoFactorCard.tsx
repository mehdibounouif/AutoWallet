import { TextInput } from '../../components/ui/TextInput'
import { Button } from '../../components/ui/Button'
import { AuthPanel } from '../../components/ui/AuthPanel'
import { SERVICE_UNAVAILABLE } from '../../content/messages'
import { isRecoveryCode, normalizeRecoveryCode } from '../../auth/recoveryCodes'
import { saveAccessToken } from '../../auth/session'
import { apiErrorDetail } from '../../api/errors'
import { Dialog } from '../../components/common/Dialog'
import { LegalFooter } from '../../components/common/LegalFooter'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldCheck, AlertCircle, Loader2, KeyRound } from 'lucide-react'
import { OTPInput } from '../../components/common/OTPInput'
import { loginPath, safeReturnPath } from '../../auth/returnPath'
import { apiFetch } from '../../api/request'
import { useRequestSignal } from '../../hooks/useRequestSignal'
import { useCountdown } from '../../hooks/useCountdown'
import { usePendingNavigation } from '../../hooks/usePendingNavigation'
import { clearTwoFactorCredentials, getTwoFactorCredentials } from '../../auth/pendingCredentials'

export function TwoFactorCard() {
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
  const isPending = useCallback(() => inFlight.current, [])
  const navigationBlocked = usePendingNavigation(verifying, { allowSignedOut: true, isActive: isPending })
  const { countdown, startCountdown } = useCountdown()
  const inputDisabled = verifying || countdown > 0
  const cleanCode = code.replace(/\s/g, '')
  const isComplete = /^\d{6}$/.test(cleanCode)

  const signIn = async (method: 'totp_code' | 'recovery_code', value: string) => {
    if (inFlight.current || countdown > 0 || !pendingData.email || !pendingData.password) return
    if (method === 'totp_code' ? !/^\d{6}$/.test(value) : !isRecoveryCode(value)) return
    inFlight.current = true
    const signal = requestSignal()
    setVerifying(true); setWrongCode(false); setBackupError(false); setServiceError(null)
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingData.email, password: pendingData.password, [method]: value }), signal,
      })
      if (signal.aborted) return
      if (res.ok) {
        const data = await res.json()
        if (signal.aborted) return
        if (typeof data.access_token !== 'string' || !data.access_token) throw new Error('Missing access token')
        // Release protection synchronously before the response-driven redirect.
        inFlight.current = false
        saveAccessToken(data.access_token)
        clearTwoFactorCredentials(); setBackupCode(''); navigate(returnTo, { replace: true })
      } else if (res.status === 429) {
        const retry = Number(res.headers.get('Retry-After'))
        startCountdown(Number.isFinite(retry) && retry > 0 ? Math.min(900, Math.ceil(retry)) : 60)
        setServiceError('Too many failed verification attempts. Wait before trying either sign-in method again.')
      } else if (res.status === 401) {
        if (method === 'totp_code') setWrongCode(true)
        else setServiceError('That recovery code or your sign-in details could not be verified. Each recovery code can only be used once.')
      } else {
        const detail = await res.json().catch(() => null)
        setServiceError(apiErrorDetail(detail, SERVICE_UNAVAILABLE).message)
      }
    } catch {
      if (!signal.aborted) setServiceError(method === 'recovery_code'
        ? 'Sign-in could not be confirmed. If this code was consumed, try another saved code or your authenticator app.'
        : SERVICE_UNAVAILABLE)
    } finally { inFlight.current = false; if (!signal.aborted) setVerifying(false) }
  }

  const handleVerify = (value = code) => signIn('totp_code', value.replace(/\s/g, ''))
  const handleSubmit = (event: FormEvent) => { event.preventDefault(); void handleVerify() }
  const handleLogout = () => { clearTwoFactorCredentials(); navigate(loginPath(returnTo)) }
  const closeBackup = () => { setShowBackupModal(false); setBackupCode(''); setServiceError(null); setBackupError(false) }
  const handleBackupSubmit = (event: FormEvent) => {
    event.preventDefault()
    const value = normalizeRecoveryCode(backupCode)
    setBackupError(!isRecoveryCode(value))
    if (isRecoveryCode(value)) void signIn('recovery_code', value)
  }

  if (!pendingData.email || !pendingData.password) return null

  const requestNotice = <>
    {countdown > 0 && <p className="text-sm text-brand-muted">Try again in {countdown}s. This wait applies to authenticator and recovery codes.</p>}
    {navigationBlocked && <p role="status" className="text-sm text-brand-muted">Wait for sign-in to finish before leaving this page.</p>}
  </>

  return (
    <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-5 z-10">
      {/* 440px Centered White Card per Figma A4 (#115:658) */}
      <AuthPanel className="transition-all">
        {/* Shield Icon container (Figma EL-f775418e) */}
        <div className="w-12 h-12 rounded-full bg-action-primary-subtle flex items-center justify-center mb-5 text-action-primary">
          <ShieldCheck className="w-6 h-6" />
        </div>

        {/* Card Heading */}
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold text-brand-ink tracking-tight">
            Enter your code
          </h1>
          <p className="text-[15px] text-brand-muted leading-relaxed">
            Open your authenticator app and type the 6-digit code for AutoWallet.
          </p>
        </div>

        {/* Backend service down notice (if applicable) */}
        {serviceError && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-action-danger-subtle border border-[#FFD2D2] text-action-danger text-sm flex items-start gap-3 animate-in fade-in"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-action-danger mt-0.5" />
            <div className="flex-1 leading-snug">
              <span>{serviceError}</span>
            </div>
          </div>
        )}

        {!showBackupModal && (countdown > 0 || navigationBlocked) && <div className="space-y-2 mb-4">{requestNotice}</div>}

        {/* 2FA Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-brand-ink">
              6-digit code
            </label>

            {/* 6-cell OTP Input */}
            <OTPInput
              value={code}
              onChange={(val) => {
                setCode(val)
                if (wrongCode) setWrongCode(false)
              }}
              disabled={inputDisabled}
              hasError={wrongCode}
              onComplete={(completedCode) => handleVerify(completedCode)}
              autoFocus
            />

            {/* Wrong Code Error Banner per Figma EL-df39dd6a */}
            {wrongCode && (
              <div
                role="alert"
                className="flex items-start gap-2 text-xs text-[#B42325] mt-2 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-[#B42325] mt-0.5" />
                <span className="leading-snug">That code didn't work. Codes change every 30 seconds, so use the newest one.</span>
              </div>
            )}
          </div>

          {/* Continue / Checking Button */}
          <Button appearance="auth" variant="primary"
            type="submit"
            disabled={!isComplete || inputDisabled}
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking…</span>
              </>
            ) : (
              countdown > 0 ? `Try again in ${countdown}s` : "Continue"
            )}
          </Button>
        </form>

        {/* Secondary Links ("other" frame #115:702 / #115:761) */}
        <div className="mt-6 flex items-center justify-between text-sm text-action-primary-hover pt-2">
          <button
            type="button"
            disabled={verifying}
            onClick={() => { setServiceError(null); setShowBackupModal(true) }}
            className="text-action-primary-hover hover:text-brand-navy hover:underline font-medium cursor-pointer"
          >
            Can't use your app?
          </button>
          <button
            type="button"
            disabled={verifying}
            onClick={handleLogout}
            className="text-action-primary-hover hover:text-brand-navy hover:underline font-medium cursor-pointer"
          >
            Log out
          </button>
        </div>
      </AuthPanel>

      {/* Backup Code Modal */}
      {showBackupModal && (
        <Dialog labelledBy="backup-code-title" dismissible={!verifying} onClose={closeBackup} panelClassName="w-full max-w-[420px] bg-white rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-action-primary-subtle flex items-center justify-center text-action-primary">
              <KeyRound className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h2 id="backup-code-title" className="text-xl font-semibold text-brand-ink">
                Use a backup code
              </h2>
              <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                Enter one of your 32-character recovery codes if you don't have access to your authenticator app.
              </p>
            </div>

            <form onSubmit={handleBackupSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                {serviceError && <p role="alert" className="text-xs text-action-danger">{serviceError}</p>}
                {requestNotice}
                <TextInput appearance="auth"
                  type="text"
                  autoFocus
                  aria-label="Recovery code"
                  aria-invalid={backupError}
                  aria-describedby={backupError ? 'recovery-code-error' : undefined}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={inputDisabled}
                  placeholder="32-character recovery code"
                  value={backupCode}
                  onChange={(e) => {
                    setBackupCode(normalizeRecoveryCode(e.target.value))
                    if (backupError) setBackupError(false)
                    setServiceError(null)
                  }}
                  className="font-mono text-center text-base tracking-widest"
                />
                {backupError && (
                  <p id="recovery-code-error" className="text-xs text-[#B42325] flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Please enter a valid 32-character recovery code.</span>
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button appearance="auth" variant="primary"
                  type="submit"
                  disabled={inputDisabled || !isRecoveryCode(backupCode)}
                >
                  {verifying ? "Checking…" : countdown > 0 ? `Try again in ${countdown}s` : "Verify backup code"}
                </Button>
                <button
                  type="button"
                  disabled={verifying}
                  onClick={closeBackup}
                  className="w-full h-10 rounded-[10px] text-sm text-brand-muted hover:text-brand-ink transition cursor-pointer"
                >
                  Back to authenticator code
                </button>
              </div>
            </form>
        </Dialog>
      )}

      {/* Legal Footer (Figma EL-0b7a78e5) */}
      <LegalFooter />
    </main>
  )
}

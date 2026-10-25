import { useEffect, useId, useRef, useState } from 'react'
import { Check, Copy, Download, Eye, EyeOff, Laptop, Shield, ShieldCheck, ShieldOff } from 'lucide-react'
import { OTPInput } from '../../components/common/OTPInput'
import { PasswordStrength } from '../../components/common/PasswordStrength'
import { translations } from '../../i18n'
import { useRequestSignal } from '../../hooks/useRequestSignal'
import {
  clearRecoveryCodes,
  getRecoveryCodes,
  getTwoFactorStatus,
  setRecoveryCodes,
  setTwoFactorStatus,
} from '../../auth/recoveryCodes'
import {
  SettingsApiError,
  changePassword,
  disableTwoFactor,
  enableTwoFactor,
  regenerateRecoveryCodes,
  setupTwoFactor,
} from '../../api/settingsApi'
import type { TwoFactorSetupResponse } from '../../api/settingsApi'
import { AuthenticatorCode } from './AuthenticatorCode'

interface SecuritySettingsProps {
  email: string
  online: boolean
  twoFactorHint: boolean | null
  signsInWith: string | null
  onSessionEnded: () => void
  onTwoFactorChanged?: (enabled: boolean) => void
}

type Flow = 'idle' | 'setup' | 'regenerate' | 'disable'

export function SecuritySettings({
  email,
  online,
  twoFactorHint,
  signsInWith,
  onSessionEnded,
  onTwoFactorChanged,
}: SecuritySettingsProps) {
  const [flow, setFlow] = useState<Flow>('idle')
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null)
  const [codes, setCodes] = useState<string[]>(() => getRecoveryCodes(email))
  const [localEnabled, setLocalEnabled] = useState<boolean | null>(() => getTwoFactorStatus(email))
  const initialKnown = getTwoFactorStatus(email)
  const enabled = localEnabled ?? (initialKnown !== null ? initialKnown : Boolean(twoFactorHint || codes.length))
  const setEnabled = (value: boolean) => {
    setLocalEnabled(value)
    setTwoFactorStatus(email, value)
  }
  const [code, setCode] = useState('')
  const [regenPassword, setRegenPassword] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [secretCopied, setSecretCopied] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

  useEffect(() => {
    if (codes.length === 0) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [codes.length])

  const downloadCodes = () => {
    const text = `AutoWallet recovery codes\nEach code can be used once. Keep these somewhere private.\n\n${codes.join('\n')}\n`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'autowallet-recovery-codes.txt'
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setNotice('Download started. Check that you saved the file before closing these codes.')
  }

  const copyCodes = async () => {
    const text = `AutoWallet recovery codes\nEach code can be used once. Keep these somewhere private.\n\n${codes.join('\n')}\n`
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCodes(true)
      setTimeout(() => setCopiedCodes(false), 2000)
      setNotice('Recovery codes copied to clipboard. Save them somewhere private.')
    } catch {
      setError('Could not copy recovery codes. Select and copy them manually or use Download.')
    }
  }

  const [passwordFormOpen, setPasswordFormOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [pwBusy, setPwBusy] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState<string | null>(null)

  const setupHeadingRef = useRef<HTMLHeadingElement>(null)
  const secretId = useId()
  const nextSignal = useRequestSignal()

  const twoFactorKnown = twoFactorHint !== null || localEnabled !== null || codes.length > 0

  const handleApiError = (reason: unknown) => {
    if (reason instanceof DOMException && reason.name === 'AbortError') return
    if (reason instanceof SettingsApiError && reason.status === 401) {
      onSessionEnded()
      return
    }
    setError(reason instanceof Error ? reason.message : 'Something went wrong. Please try again.')
  }

  const submitPasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.')
      return
    }
    setPwBusy(true)
    setPwError(null)
    setPwSuccess(null)
    try {
      const res = await changePassword(currentPassword, newPassword, nextSignal())
      setPwSuccess(res.message || 'Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordFormOpen(false)
    } catch (reason) {
      if (reason instanceof SettingsApiError && reason.status === 401) {
        onSessionEnded()
        return
      }
      setPwError(reason instanceof Error ? reason.message : 'Could not update your password.')
    } finally {
      setPwBusy(false)
    }
  }

  const startSetup = async () => {
    const signal = nextSignal()
    setBusy(true)
    setError(null)
    setNotice(null)
    setCode('')
    try {
      const response = await setupTwoFactor(signal)
      if (signal.aborted) return
      setSetupData(response)
      setFlow('setup')
      queueMicrotask(() => setupHeadingRef.current?.focus())
    } catch (reason) {
      if (reason instanceof SettingsApiError && reason.message.toLowerCase().includes('already enabled')) {
        setEnabled(true)
        setFlow('idle')
        setNotice('2FA is already enabled on this account.')
      } else {
        handleApiError(reason)
      }
    } finally {
      if (!signal.aborted) setBusy(false)
    }
  }

  const confirmSetup = async () => {
    const signal = nextSignal()
    setBusy(true)
    setError(null)
    try {
      const response = await enableTwoFactor(code, signal)
      if (signal.aborted) return
      setRecoveryCodes(email, response.recovery_codes)
      setCodes(response.recovery_codes)
      setEnabled(true)
      onTwoFactorChanged?.(true)
      setSetupData(null)
      setFlow('idle')
      setCode('')
      setNotice('2FA is enabled. Save your recovery codes before leaving this page.')
    } catch (reason) {
      handleApiError(reason)
    } finally {
      if (!signal.aborted) setBusy(false)
    }
  }

  const handleDisableTwoFactor = async (event?: React.FormEvent) => {
    event?.preventDefault()
    if (!disablePassword || !disableCode) return
    const signal = nextSignal()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const cleanCode = disableCode.replace(/\s/g, '')
      const isTotp = /^\d{6}$/.test(cleanCode)
      const payload = isTotp
        ? { password: disablePassword, totp_code: cleanCode }
        : { password: disablePassword, recovery_code: disableCode.trim() }

      await disableTwoFactor(payload, signal)
      if (signal.aborted) return
      clearRecoveryCodes(email)
      setCodes([])
      setEnabled(false)
      onTwoFactorChanged?.(false)
      setFlow('idle')
      setSetupData(null)
      setCode('')
      setDisablePassword('')
      setDisableCode('')
      setNotice('Two-factor authentication has been disabled for your account.')
    } catch (reason) {
      handleApiError(reason)
    } finally {
      if (!signal.aborted) setBusy(false)
    }
  }

  const confirmRegenerate = async (event?: React.FormEvent) => {
    event?.preventDefault()
    if (!regenPassword || code.length !== 6) return
    const signal = nextSignal()
    setBusy(true)
    setError(null)
    try {
      const response = await regenerateRecoveryCodes({ password: regenPassword, totp_code: code }, signal)
      if (signal.aborted) return
      setRecoveryCodes(email, response.recovery_codes)
      setCodes(response.recovery_codes)
      setEnabled(true)
      setFlow('idle')
      setCode('')
      setRegenPassword('')
      setNotice('New recovery codes are ready. Older codes no longer work.')
    } catch (reason) {
      handleApiError(reason)
    } finally {
      if (!signal.aborted) setBusy(false)
    }
  }

  const copySecret = async () => {
    if (!setupData) return
    try {
      await navigator.clipboard.writeText(setupData.secret)
      setSecretCopied(true)
    } catch {
      setSecretCopied(false)
    }
  }

  return (
    <>
      <section className="workspace-card settings-card">
        <h2>Password</h2>
        <p>
          {signsInWith === 'google'
            ? 'You signed in with Google. You can also set or update a password for direct email login.'
            : 'Update the password used to sign in to your AutoWallet account.'}
        </p>

        {pwSuccess && (
          <p className="workspace-banner workspace-banner--success" role="status">
            <Check size={16} />
            {pwSuccess}
          </p>
        )}

        {!passwordFormOpen ? (
          <div className="settings-actions mt-4">
            <button
              type="button"
              className="settings-outline-button"
              disabled={!online}
              onClick={() => {
                setPwError(null)
                setPwSuccess(null)
                setPasswordFormOpen(true)
              }}
            >
              Change password
            </button>
          </div>
        ) : (
          <form className="settings-form" onSubmit={(event) => void submitPasswordChange(event)} noValidate>
            {signsInWith !== 'google' && (
              <label htmlFor="settings-current-password">
                Current password
                <span className="settings-secret-input">
                  <input
                    id="settings-current-password"
                    type={showCurrentPw ? 'text' : 'password'}
                    className="dashboard-input"
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value)
                      setPwError(null)
                    }}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    disabled={pwBusy}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw((v) => !v)}
                    aria-label={showCurrentPw ? 'Hide current password' : 'Show current password'}
                  >
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
            )}

            <label htmlFor="settings-new-password">
              New password
              <span className="settings-secret-input">
                <input
                  id="settings-new-password"
                  type={showNewPw ? 'text' : 'password'}
                  className="dashboard-input"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value)
                    setPwError(null)
                  }}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  disabled={pwBusy}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  aria-label={showNewPw ? 'Hide new password' : 'Show new password'}
                >
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>

            <PasswordStrength password={newPassword} t={translations} />

            <label htmlFor="settings-confirm-password">
              Confirm new password
              <input
                id="settings-confirm-password"
                type={showNewPw ? 'text' : 'password'}
                className="dashboard-input"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value)
                  setPwError(null)
                }}
                placeholder="Repeat new password"
                autoComplete="new-password"
                disabled={pwBusy}
              />
            </label>

            {pwError && (
              <p className="workspace-field-error" role="alert">
                {pwError}
              </p>
            )}

            <div className="settings-actions">
              <button
                type="submit"
                className="dashboard-primary-button"
                disabled={pwBusy || newPassword.length < 8}
              >
                {pwBusy ? 'Updating…' : 'Update password'}
              </button>
              <button
                type="button"
                className="settings-text-button"
                disabled={pwBusy}
                onClick={() => {
                  setPasswordFormOpen(false)
                  setPwError(null)
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="workspace-card settings-card settings-security">
        <div className="workspace-title-row">
          <h2>Two-factor authentication (2FA)</h2>
          <span className={`settings-status ${enabled ? 'settings-status--on' : ''}`}>
            {enabled ? <ShieldCheck size={13} /> : twoFactorKnown ? <ShieldOff size={13} /> : <Shield size={13} />}
            {enabled ? 'Enabled' : 'Not enabled'}
          </span>
        </div>
        <p>Protect your account with a 6-digit code from an authenticator app such as Google Authenticator, 1Password, or Authy.</p>

        {notice && <p className="workspace-banner workspace-banner--success" role="status">{notice}</p>}
        {error && <p className="workspace-banner workspace-banner--error" role="alert">{error}</p>}

        {codes.length > 0 && (
          <div className="settings-setup mt-4" role="region" aria-label="Newly generated recovery codes">
            <h3>Save your recovery codes</h3>
            <p>Use a recovery code to sign in if you lose access to your authenticator app. Each code can only be used once.</p>
            <p className="workspace-note">Save these now. They stay only on this screen and cannot be displayed again after you leave.</p>
            <ul className="settings-recovery-codes" aria-label="Your recovery codes">
              {codes.map((c) => (
                <li key={c}><code>{c}</code></li>
              ))}
            </ul>
            <div className="settings-actions">
              <button
                type="button"
                className="settings-outline-button"
                onClick={() => void copyCodes()}
              >
                {copiedCodes ? <Check size={16} /> : <Copy size={16} />}
                {copiedCodes ? 'Copied' : 'Copy codes'}
              </button>
              <button
                type="button"
                className="settings-outline-button"
                onClick={downloadCodes}
              >
                <Download size={16} />
                Download codes
              </button>
              <button
                type="button"
                className="dashboard-primary-button"
                onClick={() => {
                  setCodes([])
                  clearRecoveryCodes(email)
                  setNotice('Recovery codes saved. Keep your downloaded or copied copy safe.')
                }}
              >
                I’ve saved these codes
              </button>
            </div>
          </div>
        )}

        {flow === 'idle' && codes.length === 0 && (
          <div className="settings-actions">
            {!enabled && (
              <button
                type="button"
                className="dashboard-primary-button"
                disabled={!online || busy}
                onClick={() => void startSetup()}
              >
                {busy ? 'Starting…' : 'Set up 2FA'}
              </button>
            )}
            {enabled && (
              <>
                <button
                  type="button"
                  className="settings-outline-button"
                  disabled={!online || busy}
                  onClick={() => { setFlow('regenerate'); setRegenPassword(''); setCode(''); setError(null); setNotice(null) }}
                >
                  Regenerate recovery codes
                </button>
                <button
                  type="button"
                  className="settings-danger-outline"
                  disabled={!online || busy}
                  onClick={() => { setFlow('disable'); setDisablePassword(''); setDisableCode(''); setError(null); setNotice(null) }}
                >
                  Disable 2FA
                </button>
              </>
            )}
          </div>
        )}

        {flow === 'setup' && setupData && (
          <div className="settings-setup">
            <h3 ref={setupHeadingRef} tabIndex={-1}>Step 1 — Add AutoWallet to your authenticator app</h3>
            <p>Scan this QR code, or copy the setup key into your authenticator app.</p>
            <AuthenticatorCode uri={setupData.provisioning_uri || setupData.qr_code_uri} />
            <label className="settings-key-label" htmlFor={secretId}>Setup key</label>
            <div className="settings-setup-key">
              <input
                id={secretId}
                className="dashboard-input"
                 readOnly
                type={showSecret ? 'text' : 'password'}
                value={setupData.secret}
              />
              <button
                type="button"
                onClick={() => setShowSecret((value) => !value)}
                aria-label={showSecret ? 'Hide setup key' : 'Show setup key'}
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button type="button" onClick={() => void copySecret()} aria-label="Copy setup key">
                {secretCopied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            <h3>Step 2 — Enter the 6-digit code</h3>
            <p>Enter a current code from your authenticator app to finish turning on 2FA. (In preview mode, 123456 is also accepted.)</p>
            <div className="settings-otp">
              <OTPInput value={code} onChange={setCode} disabled={busy || !online} hasError={Boolean(error)} />
            </div>
            <div className="settings-actions">
              <button
                type="button"
                className="dashboard-primary-button"
                disabled={!online || busy || code.length !== 6}
                onClick={() => void confirmSetup()}
              >
                {busy ? 'Verifying…' : 'Enable 2FA'}
              </button>
              <button
                type="button"
                className="settings-text-button"
                disabled={busy}
                onClick={() => { setFlow('idle'); setSetupData(null); setCode(''); setError(null) }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {flow === 'regenerate' && (
          <form className="settings-setup" onSubmit={(e) => void confirmRegenerate(e)}>
            <h3>Regenerate recovery codes</h3>
            <p>Enter your current password and a current 6-digit authenticator code. This replaces your previous recovery codes.</p>
            <label htmlFor="regen-password">
              Current password
              <input
                id="regen-password"
                type="password"
                className="dashboard-input mt-2"
                value={regenPassword}
                onChange={(e) => setRegenPassword(e.target.value)}
                autoComplete="current-password"
                disabled={busy}
                required
              />
            </label>
            <div className="mt-3">
              <span className="block mb-2 font-medium text-xs">6-digit authenticator code</span>
              <div className="settings-otp">
                <OTPInput value={code} onChange={setCode} disabled={busy || !online} hasError={Boolean(error)} />
              </div>
            </div>
            <div className="settings-actions">
              <button
                type="submit"
                className="dashboard-primary-button"
                disabled={!online || busy || !regenPassword || code.length !== 6}
              >
                {busy ? 'Generating…' : 'Generate new codes'}
              </button>
              <button
                type="button"
                className="settings-text-button"
                disabled={busy}
                onClick={() => { setFlow('idle'); setRegenPassword(''); setCode(''); setError(null) }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {flow === 'disable' && (
          <form className="settings-setup" onSubmit={(e) => void handleDisableTwoFactor(e)}>
            <h3>Disable two-factor authentication</h3>
            <p>Enter your current password and an authenticator code (or recovery code) to turn off 2FA.</p>
            <label htmlFor="disable-password">
              Current password
              <input
                id="disable-password"
                type="password"
                className="dashboard-input mt-2"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                autoComplete="current-password"
                disabled={busy}
                required
              />
            </label>
            <label htmlFor="disable-code" className="mt-3 block">
              Authenticator code or recovery code
              <input
                id="disable-code"
                type="text"
                className="dashboard-input mt-2"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="6-digit code or recovery code"
                autoComplete="one-time-code"
                disabled={busy}
                required
              />
            </label>
            <div className="settings-actions">
              <button
                type="submit"
                className="settings-danger-outline"
                disabled={!online || busy || !disablePassword || !disableCode.trim()}
              >
                {busy ? 'Disabling…' : 'Confirm & Disable 2FA'}
              </button>
              <button
                type="button"
                className="settings-text-button"
                disabled={busy}
                onClick={() => { setFlow('idle'); setDisablePassword(''); setDisableCode(''); setError(null) }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="workspace-card settings-card">
        <h2>Active sessions</h2>
        <div className="settings-session">
          <span className="settings-session-icon"><Laptop size={18} /></span>
          <div>
            <strong>This browser</strong>
            <p>Signed in with the token stored in this browser.</p>
          </div>
          <span className="workspace-tag">Current</span>
        </div>
        <p className="workspace-note">
          Use Log out in the profile menu to end your session in this browser.
        </p>
      </section>
    </>
  )
}

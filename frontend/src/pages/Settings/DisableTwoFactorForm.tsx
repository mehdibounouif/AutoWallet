import { useEffect, useRef, useState } from 'react'
import { isRecoveryCode, normalizeRecoveryCode } from '../../auth/recoveryCodes'
import { SettingsApiError, settingsRequest } from '../../api/settingsApi'

export function DisableTwoFactorForm({ online, onClose, onPendingChange, onDisabled, onUnconfirmed, onSessionEnded }: {
  online: boolean; onClose: () => void; onPendingChange: (pending: boolean) => void
  onDisabled: (alreadyOff: boolean) => void; onUnconfirmed: () => void; onSessionEnded: () => void
}) {
  const [password, setPassword] = useState('')
  const [method, setMethod] = useState<'totp_code' | 'recovery_code'>('totp_code')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const active = useRef<AbortController | null>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)
  useEffect(() => { passwordRef.current?.focus(); return () => active.current?.abort() }, [])

  const submit = async () => {
    if (active.current || !online) return
    if (!password) { setError('Enter your current password.'); passwordRef.current?.focus(); return }
    const cleanCode = method === 'recovery_code' ? normalizeRecoveryCode(code) : code.trim()
    if (method === 'totp_code' ? !/^\d{6}$/.test(cleanCode) : !isRecoveryCode(cleanCode)) {
      setError(method === 'totp_code' ? 'Enter the 6-digit code from your authenticator app.' : 'Enter one of your saved 32-character recovery codes.')
      codeRef.current?.focus()
      return
    }
    const controller = new AbortController()
    active.current = controller
    setBusy(true); setError(null); onPendingChange(true)
    try {
      await settingsRequest('/api/auth/2fa/disable', {
        method: 'POST', body: JSON.stringify({ password, [method]: cleanCode }), signal: controller.signal,
      })
      if (!controller.signal.aborted) onDisabled(false)
    } catch (reason) {
      if (controller.signal.aborted) return
      if (reason instanceof SettingsApiError && reason.status === 401) {
        if (reason.message === 'Invalid credentials') setError('Check your current password and latest authenticator code or unused recovery code.')
        else onSessionEnded()
      } else if (reason instanceof SettingsApiError && reason.status === 409 && reason.message === '2FA is not enabled') {
        onDisabled(true)
      } else if (reason instanceof SettingsApiError && reason.status < 500) {
        setError(reason.status === 404 ? 'Turning off two-factor login is unavailable right now.' : reason.message)
      } else {
        onUnconfirmed()
        setError('The result could not be confirmed. Sign in again to check whether two-factor login is still required before retrying.')
      }
    } finally {
      active.current = null
      onPendingChange(false)
      if (!controller.signal.aborted) { setBusy(false); setPassword(''); setCode('') }
    }
  }

  return <form className="settings-form mt-5" aria-labelledby="disable-two-factor-title" noValidate onSubmit={event => { event.preventDefault(); void submit() }}>
    <h3 id="disable-two-factor-title">Turn off two-factor login?</h3>
    <p>Your authenticator and all saved recovery codes will stop working. Your password will still be required to sign in.</p>
    <label>Current password<input ref={passwordRef} className="dashboard-input" type="password" autoComplete="current-password" value={password} disabled={busy} onChange={event => { setPassword(event.target.value); setError(null) }} /></label>
    <label>{method === 'totp_code' ? 'Authenticator code' : 'Recovery code'}<input ref={codeRef} className="dashboard-input" value={code} disabled={busy} inputMode={method === 'totp_code' ? 'numeric' : 'text'} autoComplete={method === 'totp_code' ? 'one-time-code' : 'off'} spellCheck={false} maxLength={method === 'totp_code' ? 6 : 32} onChange={event => { setCode(method === 'totp_code' ? event.target.value.replace(/\D/g, '') : event.target.value); setError(null) }} /></label>
    <button type="button" className="settings-text-button justify-self-start" disabled={busy} onClick={() => { setMethod(current => current === 'totp_code' ? 'recovery_code' : 'totp_code'); setCode(''); setError(null); codeRef.current?.focus() }}>{method === 'totp_code' ? 'Use a recovery code' : 'Use authenticator app'}</button>
    {error && <p className="workspace-field-error" role="alert">{error}</p>}
    <div className="settings-actions"><button type="button" className="settings-outline-button" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className="settings-danger-button" disabled={busy || !online}>{busy ? 'Turning off…' : 'Turn off two-factor login'}</button></div>
  </form>
}

import { useEffect, useId, useRef, useState } from 'react'
import { Check, Copy, Download, Eye, EyeOff, Shield, ShieldCheck, ShieldOff } from 'lucide-react'
import { OTPInput } from '../../components/ui/OTPInput'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { useRequestSignal } from '../../hooks/useRequestSignal'
import { downloadText } from '../../utils/download'
import {
  clearRecoveryCodes,
  getRecoveryCodes,
  getTwoFactorStatus,
  setRecoveryCodes,
  setTwoFactorStatus,
} from '../../auth/recoveryCodes'
import {
  SettingsApiError,
  disableTwoFactor,
  enableTwoFactor,
  regenerateRecoveryCodes,
  setupTwoFactor,
} from '../../api/settingsApi'
import type { TwoFactorSetupResponse } from '../../api/settingsApi'
import { AuthenticatorCode } from './AuthenticatorCode'
import { SettingsCard, SettingsForm } from './SettingsCard'

type Flow = 'idle' | 'setup' | 'regenerate' | 'disable'

function recoveryCodeText(codes: string[]) {
  return `AutoWallet recovery codes\nEach code can be used once. Keep these somewhere private.\n\n${codes.join('\n')}\n`
}

export function TwoFactorSettings({ email, online, twoFactorHint, onSessionEnded, onTwoFactorChanged }: {
  email: string
  online: boolean
  twoFactorHint: boolean | null
  onSessionEnded: () => void
  onTwoFactorChanged?: (enabled: boolean) => void
}) {
  const [flow, setFlow] = useState<Flow>('idle')
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null)
  const [codes, setCodes] = useState<string[]>(() => getRecoveryCodes(email))
  const [localEnabled, setLocalEnabled] = useState<boolean | null>(() => getTwoFactorStatus(email))
  const initialKnown = getTwoFactorStatus(email)
  const enabled = localEnabled ?? (initialKnown !== null ? initialKnown : Boolean(twoFactorHint || codes.length))
  const [code, setCode] = useState('')
  const [regenPassword, setRegenPassword] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const secretId = useId()
  const setupHeadingRef = useRef<HTMLHeadingElement>(null)
  const nextSignal = useRequestSignal()
  const { copied: secretCopied, copy: copySecret } = useCopyToClipboard()
  const { copied: codesCopied, copy: copyCodes } = useCopyToClipboard()

  const setEnabled = (value: boolean) => {
    setLocalEnabled(value)
    setTwoFactorStatus(email, value)
  }

  useEffect(() => {
    if (codes.length === 0) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [codes.length])

  const handleApiError = (reason: unknown) => {
    if (reason instanceof DOMException && reason.name === 'AbortError') return
    if (reason instanceof SettingsApiError && reason.status === 401) {
      onSessionEnded()
      return
    }
    setError(reason instanceof Error ? reason.message : 'Something went wrong. Please try again.')
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

  const disable = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!disablePassword || !disableCode) return
    const signal = nextSignal()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const cleanCode = disableCode.replace(/\s/g, '')
      const payload = /^\d{6}$/.test(cleanCode)
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

  const regenerate = async (event: React.FormEvent) => {
    event.preventDefault()
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

  const downloadCodes = () => {
    downloadText(recoveryCodeText(codes), 'autowallet-recovery-codes.txt')
    setNotice('Download started. Check that you saved the file before closing these codes.')
  }

  return (
    <SettingsCard
      title="Two-factor authentication (2FA)"
      description="Protect your account with a 6-digit code from an authenticator app such as Google Authenticator, 1Password, or Authy."
      action={
        <Badge tone={enabled ? 'success' : 'neutral'} icon={enabled ? <ShieldCheck className="size-3" aria-hidden="true" /> : twoFactorHint !== null ? <ShieldOff className="size-3" aria-hidden="true" /> : <Shield className="size-3" aria-hidden="true" />}>
          {enabled ? 'Enabled' : 'Not enabled'}
        </Badge>
      }
    >
      {notice && <Alert tone="success" className="mt-4">{notice}</Alert>}
      {error && <Alert tone="danger" className="mt-4">{error}</Alert>}

      {codes.length > 0 && (
        <div className="mt-5" role="region" aria-label="Newly generated recovery codes">
          <h3 className="text-sm font-bold text-ink">Save your recovery codes</h3>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Use a recovery code to sign in if you lose access to your authenticator app. Each code can only be used once.
          </p>
          <p className="mt-2 text-xs text-muted">Save these now. They stay only on this screen and cannot be displayed again after you leave.</p>
          <ul className="my-4 grid gap-2" aria-label="Your recovery codes">
            {codes.map((recoveryCode) => (
              <li key={recoveryCode} className="min-w-0 rounded-lg bg-layer px-2.5 py-2.5">
                <code className="text-xs [overflow-wrap:anywhere] select-all">{recoveryCode}</code>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => void copyCodes(recoveryCodeText(codes))} icon={codesCopied ? <Check className="size-4" /> : <Copy className="size-4" />}>
              {codesCopied ? 'Copied' : 'Copy codes'}
            </Button>
            <Button variant="outline" onClick={downloadCodes} icon={<Download className="size-4" />}>Download codes</Button>
            <Button onClick={() => { setCodes([]); clearRecoveryCodes(email); setNotice('Recovery codes saved. Keep your downloaded or copied copy safe.') }}>
              I’ve saved these codes
            </Button>
          </div>
        </div>
      )}

      {flow === 'idle' && codes.length === 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {!enabled && (
            <Button disabled={!online || busy} loading={busy} onClick={() => void startSetup()}>
              {busy ? 'Starting…' : 'Set up 2FA'}
            </Button>
          )}
          {enabled && (
            <>
              <Button variant="outline" disabled={!online || busy} onClick={() => { setFlow('regenerate'); setRegenPassword(''); setCode(''); setError(null); setNotice(null) }}>
                Regenerate recovery codes
              </Button>
              <Button variant="danger-outline" disabled={!online || busy} onClick={() => { setFlow('disable'); setDisablePassword(''); setDisableCode(''); setError(null); setNotice(null) }}>
                Disable 2FA
              </Button>
            </>
          )}
        </div>
      )}

      {flow === 'setup' && setupData && (
        <div className="mt-5">
          <h3 ref={setupHeadingRef} tabIndex={-1} className="text-sm font-bold text-ink">Step 1 — Add AutoWallet to your authenticator app</h3>
          <p className="mt-3 text-xs leading-relaxed text-muted">Scan this QR code, or copy the setup key into your authenticator app.</p>
          <AuthenticatorCode uri={setupData.provisioning_uri || setupData.qr_code_uri} />
          <label className="mt-4 block text-[13px] font-semibold text-ink" htmlFor={secretId}>Setup key</label>
          <div className="mt-2 flex max-w-[640px] items-center gap-1 rounded-[9px] border border-line bg-canvas px-3">
            <input
              id={secretId}
              type={showSecret ? 'text' : 'password'}
              value={setupData.secret}
              readOnly
              className="h-11 min-w-0 flex-1 border-0 bg-transparent font-mono text-xs text-ink outline-none"
            />
            <button type="button" onClick={() => setShowSecret((value) => !value)} aria-label={showSecret ? 'Hide setup key' : 'Show setup key'} className="grid size-9 shrink-0 place-items-center text-muted hover:text-ink">
              {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
            <button type="button" onClick={() => void copySecret(setupData.secret)} aria-label="Copy setup key" className="grid size-9 shrink-0 place-items-center text-muted hover:text-ink">
              {secretCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
          </div>

          <h3 className="mt-5 text-sm font-bold text-ink">Step 2 — Enter the 6-digit code</h3>
          <p className="mt-3 text-xs leading-relaxed text-muted">Enter a current code from your authenticator app to finish turning on 2FA. (In preview mode, 123456 is also accepted.)</p>
          <div className="mt-3 max-w-[340px]">
            <OTPInput value={code} onChange={setCode} disabled={busy || !online} hasError={Boolean(error)} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button disabled={!online || busy || code.length !== 6} loading={busy} onClick={() => void confirmSetup()}>
              {busy ? 'Verifying…' : 'Enable 2FA'}
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => { setFlow('idle'); setSetupData(null); setCode(''); setError(null) }}>Cancel</Button>
          </div>
        </div>
      )}

      {flow === 'regenerate' && (
        <SettingsForm onSubmit={(event) => void regenerate(event)} className="max-w-none">
          <h3 className="text-sm font-bold text-ink">Regenerate recovery codes</h3>
          <p className="-mt-1 text-xs leading-relaxed text-muted">Enter your current password and a current 6-digit authenticator code. This replaces your previous recovery codes.</p>
          <Field label="Current password" htmlFor="regen-password">
            <Input id="regen-password" type="password" value={regenPassword} onChange={(event) => setRegenPassword(event.target.value)} autoComplete="current-password" disabled={busy} required />
          </Field>
          <div>
            <span className="mb-2 block text-xs font-semibold text-ink">6-digit authenticator code</span>
            <div className="max-w-[340px]">
              <OTPInput value={code} onChange={setCode} disabled={busy || !online} hasError={Boolean(error)} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!online || busy || !regenPassword || code.length !== 6} loading={busy}>
              {busy ? 'Generating…' : 'Generate new codes'}
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => { setFlow('idle'); setRegenPassword(''); setCode(''); setError(null) }}>Cancel</Button>
          </div>
        </SettingsForm>
      )}

      {flow === 'disable' && (
        <SettingsForm onSubmit={(event) => void disable(event)} className="max-w-none">
          <h3 className="text-sm font-bold text-ink">Disable two-factor authentication</h3>
          <p className="-mt-1 text-xs leading-relaxed text-muted">Enter your current password and an authenticator code (or recovery code) to turn off 2FA.</p>
          <Field label="Current password" htmlFor="disable-password">
            <Input id="disable-password" type="password" value={disablePassword} onChange={(event) => setDisablePassword(event.target.value)} autoComplete="current-password" disabled={busy} required />
          </Field>
          <Field label="Authenticator code or recovery code" htmlFor="disable-code">
            <Input id="disable-code" value={disableCode} onChange={(event) => setDisableCode(event.target.value)} placeholder="6-digit code or recovery code" autoComplete="one-time-code" disabled={busy} required />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="danger-outline" disabled={!online || busy || !disablePassword || !disableCode.trim()} loading={busy}>
              {busy ? 'Disabling…' : 'Confirm & Disable 2FA'}
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => { setFlow('idle'); setDisablePassword(''); setDisableCode(''); setError(null) }}>Cancel</Button>
          </div>
        </SettingsForm>
      )}
    </SettingsCard>
  )
}

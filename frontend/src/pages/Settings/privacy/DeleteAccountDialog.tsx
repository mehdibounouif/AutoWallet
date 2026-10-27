import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { SettingsApiError, settingsRequest } from '../../../api/settingsApi'
import { Dialog } from '../../../components/ui/Dialog'
import { Button } from '../../../components/ui/Button'
import { Field, Input } from '../../../components/ui/Field'
import { SettingsForm } from '../SettingsCard'

interface DeleteAccountDialogProps {
  email: string
  online: boolean
  onClose: () => void
  onSecureExport: () => void
  onSessionEnded: () => void
  onDeleted: () => void
}

/** Double-confirm account deletion: typed DELETE + six-digit email code. */
export function DeleteAccountDialog({ email, online, onClose, onSecureExport, onSessionEnded, onDeleted }: DeleteAccountDialogProps) {
  const [confirmation, setConfirmation] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)
  const inFlight = useRef(false)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])
  useEffect(() => {
    if (sent) codeRef.current?.focus()
  }, [sent])

  const submit = async (confirmDelete: boolean) => {
    if (inFlight.current || !online || confirmation !== 'DELETE' ||
        (confirmDelete && !/^\d{6}$/.test(code)) || (!confirmDelete && cooldown > 0)) return
    inFlight.current = true
    const next = new AbortController()
    controller.current = next
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      await settingsRequest(
        `/api/gdpr/${confirmDelete ? 'delete-confirm' : 'delete-request'}`,
        { method: 'POST', ...(confirmDelete ? { body: JSON.stringify({ code }) } : {}), signal: next.signal },
      )
      if (confirmDelete) {
        onDeleted()
        return
      }
      setSent(true)
      setCode('')
      setCooldown(60)
      setStatus(`A 6-digit code was sent to ${email}. It is valid for 15 minutes.`)
    } catch (reason) {
      if (next.signal.aborted) return
      if (reason instanceof SettingsApiError && reason.status === 401) {
        onSessionEnded()
        return
      }
      if (reason instanceof SettingsApiError && reason.retryAfter > 0) setCooldown(reason.retryAfter)
      if (!confirmDelete && reason instanceof SettingsApiError && reason.code === 'wait') {
        setSent(true)
        setStatus('A confirmation code was recently requested. Use the latest code from your email, or wait to resend it.')
      }
      setError(reason instanceof SettingsApiError
        ? reason.message
        : confirmDelete
          ? 'The deletion result could not be confirmed. Check whether you can still sign in before trying again.'
          : 'Could not send a confirmation code. Please try again.')
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  const canSubmit = !busy && online && confirmation === 'DELETE' && (sent ? /^\d{6}$/.test(code) : cooldown === 0)

  return (
    <Dialog
      labelledBy="delete-account-title"
      role="alertdialog"
      initialFocusRef={cancelRef}
      dismissible={!busy}
      onClose={onClose}
      panelClassName="relative max-w-[560px] p-6 sm:p-7"
    >
      <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="absolute end-6 top-6 text-muted hover:text-ink">
        <X className="size-5" aria-hidden="true" />
      </button>
      <h2 id="delete-account-title" className="pe-6 text-xl font-extrabold text-ink">Delete your account?</h2>
      <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
        This deletes your envelopes, rules and payment history for good. Download your data first if you want a copy.
      </p>
      <button type="button" onClick={onSecureExport} disabled={busy} className="mt-3 text-xs font-bold text-accent hover:underline">
        Download your data
      </button>

      <SettingsForm onSubmit={(event) => { event.preventDefault(); void submit(sent) }} noValidate className="max-w-none">
        <Field label="Type DELETE to confirm" htmlFor="delete-confirmation">
          <Input
            id="delete-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={busy}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>

        {sent && (
          <Field label="Email confirmation code" htmlFor="delete-code" hint="Use the latest 6-digit code from your email.">
            <Input
              id="delete-code"
              aria-label="Email confirmation code"
              ref={codeRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(null) }}
              maxLength={6}
              disabled={busy}
            />
          </Field>
        )}

        {status && <p className="text-xs leading-relaxed text-muted" role="status">{status}</p>}
        {error && <p className="text-xs font-medium text-action-danger" role="alert">{error}</p>}
        {!sent && (
          <p className="text-xs leading-relaxed text-muted">
            Next, we’ll send a code to your account email. Nothing is deleted until you confirm that code.
          </p>
        )}
        {sent && (
          <button
            type="button"
            className="w-fit text-xs font-bold text-accent hover:underline disabled:text-subtle"
            disabled={busy || cooldown > 0 || !online}
            onClick={() => void submit(false)}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
        )}

        <div className="flex flex-wrap justify-end gap-3 max-md:flex-nowrap">
          <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="danger" disabled={!canSubmit} loading={busy}>
            {busy ? (sent ? 'Deleting…' : 'Sending…') : sent ? 'Delete account' : 'Send confirmation code'}
          </Button>
        </div>
      </SettingsForm>
    </Dialog>
  )
}

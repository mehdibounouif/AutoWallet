import { useState } from 'react'
import { Check } from 'lucide-react'
import { PasswordStrength } from '../../components/ui/PasswordStrength'
import { Button } from '../../components/ui/Button'
import { Field, Input, RevealInput } from '../../components/ui/Field'
import { Alert } from '../../components/ui/Alert'
import { useRequestSignal } from '../../hooks/useRequestSignal'
import { SettingsApiError, changePassword } from '../../api/settingsApi'
import { translations } from '../../i18n'
import { SettingsCard, SettingsForm } from './SettingsCard'

export function PasswordSettings({ online, signsInWith, onSessionEnded }: {
  online: boolean
  signsInWith: string | null
  onSessionEnded: () => void
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const nextSignal = useRequestSignal()

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await changePassword(currentPassword, newPassword, nextSignal())
      setSuccess(res.message || 'Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setFormOpen(false)
    } catch (reason) {
      if (reason instanceof SettingsApiError && reason.status === 401) {
        onSessionEnded()
        return
      }
      setError(reason instanceof Error ? reason.message : 'Could not update your password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SettingsCard
      title="Password"
      description={signsInWith === 'google'
        ? 'You signed in with Google. You can also set or update a password for direct email login.'
        : 'Update the password used to sign in to your AutoWallet account.'}
    >
      {success && <Alert tone="success" className="mt-4" icon={<Check className="size-4" />}>{success}</Alert>}

      {!formOpen ? (
        <div className="mt-4">
          <Button
            variant="outline"
            disabled={!online}
            onClick={() => { setError(null); setSuccess(null); setFormOpen(true) }}
          >
            Change password
          </Button>
        </div>
      ) : (
        <SettingsForm onSubmit={(event) => void submit(event)} noValidate>
          {signsInWith !== 'google' && (
            <Field label="Current password" htmlFor="settings-current-password">
              <RevealInput
                id="settings-current-password"
                revealed={showCurrent}
                onToggleReveal={() => setShowCurrent((value) => !value)}
                toggleLabel={showCurrent ? 'Hide current password' : 'Show current password'}
                value={currentPassword}
                onChange={(event) => { setCurrentPassword(event.target.value); setError(null) }}
                placeholder="Enter current password"
                autoComplete="current-password"
                disabled={busy}
              />
            </Field>
          )}

          <Field label="New password" htmlFor="settings-new-password">
            <RevealInput
              id="settings-new-password"
              revealed={showNew}
              onToggleReveal={() => setShowNew((value) => !value)}
              toggleLabel={showNew ? 'Hide new password' : 'Show new password'}
              value={newPassword}
              onChange={(event) => { setNewPassword(event.target.value); setError(null) }}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              disabled={busy}
            />
          </Field>

          <PasswordStrength password={newPassword} t={translations} />

          <Field label="Confirm new password" htmlFor="settings-confirm-password">
            <Input
              id="settings-confirm-password"
              type={showNew ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => { setConfirmPassword(event.target.value); setError(null) }}
              placeholder="Repeat new password"
              autoComplete="new-password"
              disabled={busy}
            />
          </Field>

          {error && <p className="text-xs font-medium text-action-danger" role="alert">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={busy} disabled={newPassword.length < 8}>
              {busy ? 'Updating…' : 'Update password'}
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => { setFormOpen(false); setError(null) }}>
              Cancel
            </Button>
          </div>
        </SettingsForm>
      )}
    </SettingsCard>
  )
}

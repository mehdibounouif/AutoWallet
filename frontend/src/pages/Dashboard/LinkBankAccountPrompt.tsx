import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input } from '../../components/ui/Field'
import { isValidBankAccountId } from '../../auth/validation'

interface LinkBankAccountPromptProps {
  email: string
  online: boolean
  onLink: (bankAccountId: string) => Promise<void>
}

/** First-run gate shown until the account has a bank account ID. */
export function LinkBankAccountPrompt({ email, online, onLink }: LinkBankAccountPromptProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = value.trim()
    if (!isValidBankAccountId(trimmed)) {
      setError('Enter a bank account ID between 3 and 50 digits.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onLink(trimmed)
      setValue('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not link this bank account ID.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto mt-10 w-full max-w-[880px]">
      <Card className="p-7">
        <h1 className="text-xl font-extrabold text-ink">Link your bank account ID</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          You signed in as <strong className="text-body">{email}</strong>. Add your bank account ID so AutoWallet can
          create your envelopes and split incoming payments.
        </p>
        <form onSubmit={(event) => void submit(event)} className="mt-5 max-w-md space-y-4" noValidate>
          <Field
            label="Bank account ID"
            htmlFor="dashboard-bank-account-id"
            error={error}
            hint="Use the account ID provided by your bank."
          >
            <Input
              id="dashboard-bank-account-id"
              value={value}
              inputMode="numeric"
              autoComplete="off"
              placeholder="MA00001234567890"
              aria-invalid={Boolean(error)}
              onChange={(event) => {
                setValue(event.target.value)
                setError(null)
              }}
            />
          </Field>
          <Button type="submit" loading={busy} disabled={!online}>
            {busy ? 'Linking…' : 'Link account'}
          </Button>
          {!online && (
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <AlertCircle className="size-3.5" aria-hidden="true" />
              Reconnect to link your account.
            </p>
          )}
        </form>
      </Card>
    </section>
  )
}

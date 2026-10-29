import { useState } from 'react'
import { X } from 'lucide-react'
import type { WalletType } from '../dashboardApi'
import { envelopeMeta } from '../envelopeDisplay'
import { parseAmount } from '../../../utils/format'
import { money } from '../../../utils/format'
import { Dialog } from '../../../components/ui/Dialog'
import { Button } from '../../../components/ui/Button'
import { AmountInput, Field, Input } from '../../../components/ui/Field'

interface SpendEnvelopeDialogProps {
  type: WalletType
  balance: number
  onClose: () => void
  onSubmit: (payload: { wallet_type: WalletType; amount: number; reference?: string }) => Promise<void>
}

/** Records an outgoing amount against a single envelope. */
export function SpendEnvelopeDialog({ type, balance, onClose, onSubmit }: SpendEnvelopeDialogProps) {
  const meta = envelopeMeta[type]
  const [amountInput, setAmountInput] = useState('')
  const [referenceInput, setReferenceInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = parseAmount(amountInput)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter an amount above 0.00 MAD.')
      return
    }
    if (parsed > balance + 0.001) {
      setError(`Only ${money.format(balance)} MAD is available in ${meta.name}.`)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ wallet_type: type, amount: parsed, reference: referenceInput.trim() || undefined })
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not record spending.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      onClose={() => { if (!submitting) onClose() }}
      dismissible={!submitting}
      labelledBy="detail-spend-title"
      panelClassName="p-6 sm:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="detail-spend-title" className="text-xl font-extrabold text-ink">Record spending from {meta.name}</h2>
        <button type="button" onClick={onClose} disabled={submitting} aria-label="Close" className="text-muted hover:text-ink">
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-muted">
        Deduct an outgoing payment or bill directly from your {meta.name} envelope ({money.format(balance)} MAD available).
      </p>
      <form onSubmit={(event) => void submit(event)} className="mt-6 grid gap-5" noValidate>
        <Field label="Amount (MAD)" htmlFor="detail-spend-amount">
          <AmountInput
            id="detail-spend-amount"
            inputMode="decimal"
            value={amountInput}
            onChange={(event) => { setAmountInput(event.target.value); setError(null) }}
            placeholder="350.00"
            disabled={submitting}
            aria-invalid={Boolean(error)}
            className="font-semibold"
          />
        </Field>
        <Field label="Description / Reference" htmlFor="detail-spend-ref">
          <Input
            id="detail-spend-ref"
            value={referenceInput}
            onChange={(event) => setReferenceInput(event.target.value)}
            placeholder={`Paid from ${meta.name}`}
            maxLength={100}
            disabled={submitting}
          />
        </Field>
        {error && <p className="text-xs font-medium text-action-danger" role="alert">{error}</p>}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" loading={submitting}>{submitting ? 'Recording…' : 'Record spending'}</Button>
        </div>
      </form>
    </Dialog>
  )
}

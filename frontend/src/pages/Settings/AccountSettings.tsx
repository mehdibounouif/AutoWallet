import { useState } from 'react'
import type { DashboardAccount } from '../Dashboard/dashboardApi'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { isValidBankAccountId } from '../../auth/validation'
import { SettingsCard, SettingsForm } from './SettingsCard'

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AW'
}

export function AccountSettings({ account, online, role, onLinkAccount }: {
  account: DashboardAccount
  online: boolean
  role: string | null
  onLinkAccount: (bankAccountId: string) => Promise<void>
}) {
  const [bankDraft, setBankDraft] = useState('')
  const [bankError, setBankError] = useState<string | null>(null)
  const [bankNotice, setBankNotice] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)

  const submitBankLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = bankDraft.trim()
    if (!isValidBankAccountId(trimmed)) {
      setBankError('Enter 3 to 50 digits. Letters and spaces are not accepted.')
      return
    }
    setLinking(true)
    setBankError(null)
    setBankNotice(null)
    try {
      await onLinkAccount(trimmed)
      setBankDraft('')
      setBankNotice('Your bank account ID is linked.')
    } catch (reason) {
      setBankError(reason instanceof Error ? reason.message : 'Could not link this bank account ID.')
    } finally {
      setLinking(false)
    }
  }

  return (
    <>
      <SettingsCard title="Profile" description="Your identity details for this AutoWallet account.">
        <div className="mt-5 flex min-w-0 items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-layer text-xl font-semibold text-muted max-md:size-14 max-md:text-lg">
            {initials(account.full_name)}
          </span>
          <div className="min-w-0">
            <strong className="flex flex-wrap items-center gap-2.5 text-[15px] font-bold text-ink">
              {account.full_name}
              {role && <Badge tone="neutral">{role}</Badge>}
            </strong>
            <span className="mt-1 block text-xs break-words text-subtle">{account.email}</span>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Connected bank account"
        description="Incoming payments for this bank account ID are split by your active rules."
      >
        {bankNotice && <p className="mt-4 text-xs text-success-ink" role="status">{bankNotice}</p>}
        {account.bank_account_id ? (
          <SettingsForm>
            <Field
              label="Bank account ID"
              htmlFor="settings-linked-bank-id"
              hint="This account ID is linked and ready to receive payments."
            >
              <Input id="settings-linked-bank-id" readOnly value={account.bank_account_id} className="bg-canvas" />
            </Field>
          </SettingsForm>
        ) : (
          <SettingsForm onSubmit={(event) => void submitBankLink(event)} noValidate>
            <Field label="Bank account ID" htmlFor="settings-bank-id" error={bankError}>
              <Input
                id="settings-bank-id"
                inputMode="numeric"
                value={bankDraft}
                onChange={(event) => { setBankDraft(event.target.value); setBankError(null) }}
                placeholder="00100000042"
                aria-invalid={Boolean(bankError)}
              />
            </Field>
            <Button type="submit" disabled={!online} loading={linking} className="justify-self-start">
              {linking ? 'Linking…' : 'Link bank account'}
            </Button>
          </SettingsForm>
        )}
      </SettingsCard>
    </>
  )
}

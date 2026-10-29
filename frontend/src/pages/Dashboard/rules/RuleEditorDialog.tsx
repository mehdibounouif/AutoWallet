import { useState } from 'react'
import { X } from 'lucide-react'
import type { DashboardRule, RuleDraft, WalletType } from '../dashboardApi'
import { envelopeMeta } from '../envelopeDisplay'
import { Dialog } from '../../../components/ui/Dialog'
import { Button } from '../../../components/ui/Button'
import { Field, Input, Select } from '../../../components/ui/Field'
import { Switch } from '../../../components/ui/Switch'

const selectableWallets: WalletType[] = ['rent', 'tax', 'savings', 'free', 'main']

interface RuleEditorDialogProps {
  rule: DashboardRule
  onClose: () => void
  onSave: (updates: Partial<RuleDraft>) => Promise<void>
}

/** Drawer form for editing an existing rule. */
export function RuleEditorDialog({ rule, onClose, onSave }: RuleEditorDialogProps) {
  const [nameInput, setNameInput] = useState(rule.name)
  const [targetWallet, setTargetWallet] = useState<WalletType>(rule.target_wallet)
  const [ruleType, setRuleType] = useState<'lock_fixed' | 'percentage_remainder'>(
    rule.rule_type === 'lock_fixed' ? 'lock_fixed' : 'percentage_remainder',
  )
  const [valueInput, setValueInput] = useState(String(
    rule.rule_type === 'lock_fixed' ? (rule.fixed_amount ?? 0) : (rule.percentage ?? 0),
  ))
  const [hasCap, setHasCap] = useState(Boolean(rule.condition_field && rule.condition_value !== null))
  const [capInput, setCapInput] = useState(rule.condition_value !== null ? String(rule.condition_value) : '')
  const [isActive, setIsActive] = useState(rule.is_active)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = nameInput.trim() || envelopeMeta[targetWallet].name
    const numeric = Number(valueInput)
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setFormError('Enter an amount above 0.')
      return
    }
    if (ruleType === 'percentage_remainder' && numeric > 100) {
      setFormError('Enter a percentage between 1 and 100.')
      return
    }

    let conditionValue: number | null = null
    if (hasCap) {
      const parsedCap = Number(capInput)
      if (!Number.isFinite(parsedCap) || parsedCap <= 0) {
        setFormError('Enter a valid balance cap above 0 MAD, or uncheck the balance condition.')
        return
      }
      conditionValue = Math.round(parsedCap * 100) / 100
    }

    const payload: RuleDraft = {
      name: trimmedName,
      rule_type: ruleType,
      target_wallet: targetWallet,
      priority: rule.priority,
      fixed_amount: ruleType === 'lock_fixed' ? Math.round(numeric * 100) / 100 : null,
      percentage: ruleType === 'percentage_remainder' ? Math.round(numeric * 100) / 100 : null,
      condition_field: hasCap ? `${targetWallet}_balance` : null,
      condition_operator: hasCap ? '<' : null,
      condition_value: conditionValue,
      is_active: isActive,
    }

    setSubmitting(true)
    setFormError(null)
    try {
      await onSave(payload)
      onClose()
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : 'Could not save this rule.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      onClose={() => { if (!submitting) onClose() }}
      dismissible={!submitting}
      labelledBy="edit-rule-title"
      placement="drawer"
      panelClassName="flex max-w-[480px] flex-col"
    >
      <div className="flex min-h-[66px] items-center justify-between border-b border-line px-6">
        <h2 id="edit-rule-title" className="text-[17px] font-extrabold text-ink">Edit rule</h2>
        <button type="button" onClick={onClose} disabled={submitting} aria-label="Close" className="text-muted hover:text-ink">
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <form onSubmit={(event) => void submit(event)} className="flex flex-1 flex-col gap-5 overflow-y-auto p-6" noValidate>
        <Field label="Envelope" htmlFor="rule-envelope">
          <Select
            id="rule-envelope"
            value={targetWallet}
            onChange={(event) => setTargetWallet(event.target.value as WalletType)}
            disabled={submitting}
          >
            {selectableWallets.map((wallet) => <option key={wallet} value={wallet}>{envelopeMeta[wallet].name}</option>)}
          </Select>
        </Field>

        <Field label="Rule name" htmlFor="rule-name">
          <Input
            id="rule-name"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            placeholder={envelopeMeta[targetWallet].name}
            maxLength={80}
            disabled={submitting}
          />
        </Field>

        <Field label="Rule type" htmlFor="rule-type-select">
          <Select
            id="rule-type-select"
            value={ruleType}
            onChange={(event) => {
              const nextType = event.target.value as 'lock_fixed' | 'percentage_remainder'
              setRuleType(nextType)
              if (nextType === 'percentage_remainder' && Number(valueInput) > 100) setValueInput('15')
              setFormError(null)
            }}
            disabled={submitting}
          >
            <option value="lock_fixed">Lock a fixed amount (MAD)</option>
            <option value="percentage_remainder">Percentage of what&apos;s left (%)</option>
          </Select>
        </Field>

        <Field label={ruleType === 'lock_fixed' ? 'Amount to lock (MAD)' : "Share of what's left (%)"} htmlFor="rule-value">
          <div className="flex items-center gap-2">
            <Input
              id="rule-value"
              type="number"
              inputMode="decimal"
              min="1"
              max={ruleType === 'percentage_remainder' ? '100' : undefined}
              step="0.01"
              value={valueInput}
              onChange={(event) => { setValueInput(event.target.value); setFormError(null) }}
              disabled={submitting}
            />
            <span className="text-xs font-semibold text-muted">{ruleType === 'lock_fixed' ? 'MAD' : '%'}</span>
          </div>
          {ruleType === 'percentage_remainder' && (
            <input
              type="range"
              min="1"
              max="100"
              value={Math.min(100, Math.max(1, Number(valueInput) || 1))}
              onChange={(event) => setValueInput(event.target.value)}
              aria-label="Share percentage slider"
              className="mt-2 w-full accent-action-primary"
              disabled={submitting}
            />
          )}
        </Field>

        <label className="flex items-start gap-2 text-xs font-semibold text-body">
          <input
            type="checkbox"
            checked={hasCap}
            onChange={(event) => {
              setHasCap(event.target.checked)
              if (event.target.checked && !capInput) setCapInput(targetWallet === 'rent' ? '3500' : '10000')
            }}
            disabled={submitting}
            className="mt-0.5 size-4 accent-action-primary"
          />
          <span>Only run while {envelopeMeta[targetWallet].name} balance is below a cap</span>
        </label>

        {hasCap && (
          <Field label="Balance target / cap (MAD)" htmlFor="rule-cap-value">
            <Input
              id="rule-cap-value"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              value={capInput}
              onChange={(event) => { setCapInput(event.target.value); setFormError(null) }}
              placeholder="10000"
              disabled={submitting}
            />
          </Field>
        )}

        <div className="flex items-center gap-2 text-xs font-semibold text-body">
          <Switch
            checked={isActive}
            onChange={setIsActive}
            disabled={submitting}
            label={isActive ? 'Active immediately' : 'Start paused'}
          />
        </div>

        <p className="text-2xs leading-relaxed text-muted">
          Rules run from top to bottom on every incoming payment. You can pause rules anytime.
        </p>

        {formError && <p className="text-xs font-medium text-action-danger" role="alert">{formError}</p>}

        <div className="mt-auto flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" loading={submitting}>{submitting ? 'Saving…' : 'Save rule'}</Button>
        </div>
      </form>
    </Dialog>
  )
}

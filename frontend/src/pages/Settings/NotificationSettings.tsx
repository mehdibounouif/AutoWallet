import { useState } from 'react'
import { Check } from 'lucide-react'
import { savePaymentAlerts, usePaymentAlerts } from './settingsAlerts'
import { SettingsCard } from './SettingsCard'
import { Switch } from '../../components/ui/Switch'

export function NotificationSettings({ accountId }: { accountId: string }) {
  const alertsEnabled = usePaymentAlerts(accountId)
  const [saved, setSaved] = useState(false)

  const update = (enabled: boolean) => {
    savePaymentAlerts(accountId, enabled)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <SettingsCard
      title="Notifications"
      description="Choose which live alerts appear while AutoWallet is open in this browser."
      action={saved ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-success-ink" role="status">
          <Check className="size-3.5" aria-hidden="true" />
          Saved in this browser
        </span>
      ) : undefined}
    >
      <div className="mt-5 divide-y divide-line">
        <div className="flex items-center justify-between gap-4 py-5 max-[1200px]:flex-wrap">
          <div>
            <h3 className="text-[13px] font-bold text-ink">Payment received</h3>
            <p className="mt-1 max-w-[350px] text-2xs leading-relaxed text-subtle">
              Show a live banner and add an item to the notification bell when a payment is processed.
            </p>
          </div>
          <Switch checked={alertsEnabled} onChange={update} label="In-app" />
        </div>
        <div className="flex items-center justify-between gap-4 py-5 max-[1200px]:flex-wrap">
          <div>
            <h3 className="text-[13px] font-bold text-ink">Security emails</h3>
            <p className="mt-1 max-w-[350px] text-2xs leading-relaxed text-subtle">
              Verification, password reset, and account deletion codes are always sent when you request those actions.
            </p>
          </div>
          <Switch checked onChange={() => {}} disabled label="Required" />
        </div>
      </div>
    </SettingsCard>
  )
}

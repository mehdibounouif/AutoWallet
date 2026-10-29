import { Laptop } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { PasswordSettings } from './PasswordSettings'
import { TwoFactorSettings } from './TwoFactorSettings'

interface SecuritySettingsProps {
  email: string
  online: boolean
  twoFactorHint: boolean | null
  signsInWith: string | null
  onSessionEnded: () => void
  onTwoFactorChanged?: (enabled: boolean) => void
}

export function SecuritySettings({ email, online, twoFactorHint, signsInWith, onSessionEnded, onTwoFactorChanged }: SecuritySettingsProps) {
  return (
    <>
      <PasswordSettings online={online} signsInWith={signsInWith} onSessionEnded={onSessionEnded} />
      <TwoFactorSettings
        email={email}
        online={online}
        twoFactorHint={twoFactorHint}
        onSessionEnded={onSessionEnded}
        onTwoFactorChanged={onTwoFactorChanged}
      />
      <Card as="section" className="p-5 sm:p-6">
        <h2 className="text-base font-extrabold text-ink">Active sessions</h2>
        <div className="mt-5 flex items-center gap-3.5 border-b border-line pb-5 max-md:flex-wrap">
          <span className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-layer text-muted">
            <Laptop className="size-[18px]" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 text-[13px]">
            <strong className="font-semibold text-ink">This browser</strong>
            <p className="mt-1 text-2xs leading-relaxed text-subtle">Signed in with the token stored in this browser.</p>
          </div>
          <Badge tone="neutral">Current</Badge>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">Use Log out in the profile menu to end your session in this browser.</p>
      </Card>
    </>
  )
}

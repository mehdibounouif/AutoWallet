import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowLeft, Bell, ChevronRight, Globe, KeyRound, LogOut, Shield, User } from 'lucide-react'
import type { DashboardAccount } from '../Dashboard/dashboardApi'
import { PrivacySettings } from './PrivacySettings'
import { SecuritySettings } from './SecuritySettings'
import { AccountSettings } from './AccountSettings'
import { DeveloperSettings } from './DeveloperSettings'
import { NotificationSettings } from './NotificationSettings'
import { getTwoFactorStatus, setTwoFactorStatus } from '../../auth/recoveryCodes'
import { Button } from '../../components/ui/Button'
import { Page } from '../../components/ui/Page'
import { PageHeader } from '../../components/ui/PageHeader'
import { useTranslation } from '../../i18n'
import { cn } from '../../utils/cn'

export type SettingsSection = 'account' | 'security' | 'privacy' | 'notifications' | 'developer'

interface SettingsViewProps {
  account: DashboardAccount
  online: boolean
  onLinkAccount: (bankAccountId: string) => Promise<void>
  onRefresh: () => Promise<void>
  onSignOut: () => void
  onSessionEnded: () => void
  onDeleted: () => void
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AW'
}

export function SettingsView({
  account,
  online,
  onLinkAccount,
  onRefresh,
  onSignOut,
  onSessionEnded,
  onDeleted,
}: SettingsViewProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const initialSection = (location.state as { section?: SettingsSection } | null)?.section || 'account'
  const [section, setSection] = useState<SettingsSection>(initialSection)
  const [mobileIndex, setMobileIndex] = useState(initialSection === 'account')
  const [twoFactorOverride, setTwoFactorOverride] = useState<boolean | null>(() => getTwoFactorStatus(account.email))
  const [signsInWith, setSignsInWith] = useState<string | null>(account.has_password === false ? 'google' : 'password')
  const [role, setRole] = useState<string | null>(account.role ?? null)

  const twoFactorHint = twoFactorOverride ?? account.is_2fa_enabled ?? getTwoFactorStatus(account.email) ?? null
  const setTwoFactorHint = (value: boolean | null) => {
    setTwoFactorOverride(value)
    if (value !== null) setTwoFactorStatus(account.email, value)
  }

  const sections: { id: SettingsSection; label: string; icon: typeof User }[] = [
    { id: 'account', label: t.tabAccount, icon: User },
    { id: 'security', label: t.tabSecurity, icon: Shield },
    { id: 'privacy', label: t.tabPrivacy, icon: Globe },
    { id: 'notifications', label: t.tabNotifications, icon: Bell },
    { id: 'developer', label: t.tabDeveloper, icon: KeyRound },
  ]
  const activeSection = sections.find((item) => item.id === section) ?? sections[0]

  const openSection = (next: SettingsSection) => {
    setSection(next)
    setMobileIndex(false)
  }

  return (
    <Page>
      <PageHeader
        title={t.settingsHeading}
        description={t.settingsSubheading}
        className={cn('settings-heading', !mobileIndex && 'max-md:hidden')}
      />

      <div className={cn('mb-5 md:hidden', !mobileIndex && 'hidden')}>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2.5 rounded-card border border-line bg-surface p-4 text-start"
          onClick={() => openSection('account')}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid size-[42px] shrink-0 place-items-center rounded-full bg-layer text-[15px] font-semibold text-muted">
              {initials(account.full_name)}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-[13px] font-bold text-ink">{account.full_name}</strong>
              <span className="mt-0.5 block truncate text-3xs text-subtle">{account.email}</span>
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-[220px_minmax(0,1fr)] items-start gap-8 max-[1200px]:grid-cols-[185px_minmax(0,1fr)] max-[1200px]:gap-5.5 max-md:block">
        <nav
          aria-label="Settings sections"
          className={cn(
            'sticky top-[90px] grid gap-1 self-start',
            'max-md:static max-md:rounded-card max-md:border max-md:border-line max-md:bg-surface max-md:p-2',
            !mobileIndex && 'max-md:hidden',
          )}
        >
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => openSection(id)}
              aria-current={section === id ? 'page' : undefined}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-[9px] px-3 py-2.5 text-[13px] font-semibold text-muted hover:bg-layer',
                section === id && 'bg-selected text-accent',
                'max-md:min-h-12',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span>{label}</span>
              <ChevronRight className="ms-auto hidden size-3.5 text-subtle max-md:block" aria-hidden="true" />
            </button>
          ))}
        </nav>

        <div className={cn('grid min-w-0 gap-6 max-md:gap-4.5', mobileIndex && 'max-md:hidden')}>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 justify-self-start text-xs font-semibold text-body md:hidden"
            onClick={() => setMobileIndex(true)}
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Settings
          </button>
          <h2 className="hidden text-[23px] font-bold text-ink max-md:block">{activeSection.label}</h2>

          {section === 'account' && (
            <AccountSettings account={account} online={online} role={role} onLinkAccount={onLinkAccount} />
          )}

          {section === 'security' && (
            <SecuritySettings
              email={account.email}
              online={online}
              twoFactorHint={twoFactorHint}
              signsInWith={signsInWith}
              onSessionEnded={onSessionEnded}
              onTwoFactorChanged={(isEnabled) => {
                setTwoFactorHint(isEnabled)
                void onRefresh()
              }}
            />
          )}

          {section === 'privacy' && (
            <PrivacySettings
              email={account.email}
              online={online}
              onSecurityInfo={(info) => {
                if (typeof info.two_factor_enabled === 'boolean') {
                  setTwoFactorHint(info.two_factor_enabled)
                  setTwoFactorStatus(account.email, info.two_factor_enabled)
                }
                if (info.signs_in_with) setSignsInWith(info.signs_in_with)
                if (info.role) setRole(info.role)
              }}
              onSessionEnded={onSessionEnded}
              onDeleted={onDeleted}
            />
          )}

          {section === 'notifications' && <NotificationSettings accountId={account.id} />}

          {section === 'developer' && <DeveloperSettings online={online} onSessionEnded={onSessionEnded} />}
        </div>
      </div>

      <div className={cn('mt-5 md:hidden', !mobileIndex && 'hidden')}>
        <Button
          variant="danger-outline"
          onClick={onSignOut}
          className="min-h-[46px] w-full"
          icon={<LogOut className="size-4" aria-hidden="true" />}
        >
          Log out
        </Button>
      </div>
    </Page>
  )
}

import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { useTranslation } from '../../i18n'
import { LegalFooter } from './LegalFooter'

/** Full-height centered column shared by login, recovery, verification and onboarding. */
export function AuthShell({ children, footer = true, className }: {
  children: ReactNode
  footer?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <main className={cn('z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12', className)}>
      {children}
      {footer && <LegalFooter t={t} />}
    </main>
  )
}

import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { LanguageSelector } from '../ui/LanguageSelector'
import { Logo } from '../ui/Logo'
import { cn } from '../../utils/cn'

interface TopBarProps {
  variant?: 'auth' | 'onboarding'
  finalStep?: boolean
  children?: ReactNode
}

/** Marketing-free application header used by authentication and onboarding. */
export function TopBar({ variant = 'auth', finalStep = false, children }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <header
      className={cn(
        'z-20 flex w-full flex-col justify-center px-6 py-5 sm:px-10',
        finalStep ? 'sm:py-[21px]' : 'sm:py-6',
        variant === 'onboarding' ? 'border-b border-line bg-surface' : 'border-b border-transparent',
      )}
    >
      <div className="flex w-full items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/login')}
          title="AutoWallet home"
          className="group shrink-0 rounded-lg text-start transition-opacity hover:opacity-90"
        >
          <Logo compact={finalStep} className="transition-opacity group-hover:opacity-90" />
        </button>

        {children && (
          <div className={cn('hidden min-w-0 flex-1 items-center', finalStep ? 'ps-4 xl:flex' : 'justify-center lg:flex')}>
            {children}
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSelector />
        </div>
      </div>

      {children && (
        <div className={cn('flex w-full justify-center pt-3', finalStep ? 'xl:hidden' : 'lg:hidden')}>
          {children}
        </div>
      )}
    </header>
  )
}

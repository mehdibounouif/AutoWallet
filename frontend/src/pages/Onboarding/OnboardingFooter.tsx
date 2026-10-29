import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { Button } from '../../components/ui/Button'
import { cn } from '../../utils/cn'

interface OnboardingFooterProps {
  step: number
  loading: boolean
  isSimulating: boolean
  onBack: () => void
  primaryAction: ReactNode
}

/** Fixed/bottom onboarding action bar; the page decides which primary action to show. */
export function OnboardingFooter({ step, loading, isSimulating, onBack, primaryAction }: OnboardingFooterProps) {
  const { t } = useTranslation()

  return (
    <footer className={cn('z-20 w-full border-t border-line bg-surface', step === 5 ? 'fixed inset-x-0 bottom-0 flex h-[88px] items-center px-4 pb-[env(safe-area-inset-bottom)] sm:h-[132px] sm:px-10' : 'px-6 py-4 sm:px-10')}>
      <div className={cn('flex items-center justify-between', step === 5 ? 'w-full' : 'mx-auto w-full max-w-5xl')}>
        {step === 1 ? <span /> : (
          <Button
            id={`onboarding-back-step${step}`}
            variant={step === 5 ? 'ghost' : 'outline'}
            disabled={loading || isSimulating}
            onClick={onBack}
            icon={<ChevronLeft className="size-4" aria-hidden="true" />}
          >
            {t.backButton}
          </Button>
        )}
        {primaryAction}
      </div>
    </footer>
  )
}

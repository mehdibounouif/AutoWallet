import { Check } from 'lucide-react'
import type { Translations } from '../../i18n'
import { cn } from '../../utils/cn'

export interface StepperProps {
  currentStep: number
  onStepClick?: (step: number) => void
  expanded?: boolean
  t: Translations
}

/** Five-step onboarding progress with clickable completed steps. */
export function Stepper({ currentStep, onStepClick, expanded = false, t }: StepperProps) {
  const steps = [
    { num: 1, label: t.stepAboutYou },
    { num: 2, label: t.stepLinkAccount },
    { num: 3, label: t.stepEnvelopes },
    { num: 4, label: t.stepRules },
    { num: 5, label: t.stepTryPayment },
  ]

  return (
    <nav aria-label="Progress" className={cn('flex items-center', expanded && 'w-full')}>
      <ol className={cn('hidden list-none items-center', expanded ? 'w-full gap-0 xl:flex' : 'gap-2 lg:flex lg:gap-3')}>
        {steps.map((step, index) => {
          const done = step.num < currentStep
          const current = step.num === currentStep
          const clickable = done && Boolean(onStepClick)

          return (
            <li key={step.num} className={cn('flex items-center select-none', expanded ? 'flex-1 last:flex-none' : 'gap-2 lg:gap-3')}>
              {!expanded && index > 0 && (
                <div
                  aria-hidden="true"
                  className={cn('h-0.5 w-6 rounded-full transition-colors duration-200 lg:w-10', done || current ? 'bg-action-primary' : 'bg-line')}
                />
              )}

              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(step.num)}
                aria-current={current ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg transition-all focus:outline-none',
                  expanded ? '' : 'p-1',
                  clickable ? 'cursor-pointer hover:opacity-85 active:scale-95' : 'cursor-default',
                )}
                title={clickable ? `Go back to ${step.label}` : step.label}
              >
                <div
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200',
                    expanded ? 'size-7' : 'size-6',
                    done
                      ? expanded ? 'bg-brand-navy text-white' : 'bg-action-primary text-white hover:bg-action-primary-hover'
                      : current
                        ? 'bg-action-primary text-white ring-2 ring-action-primary/25'
                        : 'border border-line bg-surface text-subtle',
                  )}
                >
                  {done ? <Check className="size-3.5 stroke-[2.5] text-white" aria-hidden="true" /> : <span>{step.num}</span>}
                </div>
                <span
                  className={cn(
                    'whitespace-nowrap transition-colors duration-200',
                    expanded ? 'text-sm' : 'text-xs xl:text-sm',
                    current ? 'font-semibold text-ink'
                      : done ? `font-medium ${expanded ? 'text-ink' : 'text-action-primary'}`
                        : 'text-subtle',
                  )}
                >
                  {step.label}
                </span>
              </button>
              {expanded && index < steps.length - 1 && <div aria-hidden="true" className="mx-4 h-0.5 flex-1 rounded-full bg-brand-navy" />}
            </li>
          )
        })}
      </ol>

      <div className={cn('flex flex-col items-center', expanded ? 'xl:hidden' : 'lg:hidden')}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink">{steps[currentStep - 1]?.label}</span>
          <span className="text-2xs font-normal text-muted">Step {currentStep} of 5</span>
        </div>
        <div className="mt-1 flex gap-1" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((value) => (
            <div key={value} className={cn('h-1 w-5 rounded-full transition-colors duration-300', value <= currentStep ? 'bg-action-primary' : 'bg-line')} />
          ))}
        </div>
      </div>
    </nav>
  )
}

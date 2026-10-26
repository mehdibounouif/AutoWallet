import { cn } from '../../utils/cn'

export function Logo({ compact = false, className, showText = true }: {
  compact?: boolean
  className?: string
  showText?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <img
        src="/AW.svg"
        alt=""
        className={cn('w-auto object-contain', compact ? 'h-8' : 'h-8 sm:h-9')}
      />
      {showText && (
        <span className={cn('font-bold tracking-tight whitespace-nowrap text-brand-navy leading-none', compact ? 'text-base' : 'text-xl sm:text-2xl')}>
          AutoWallet
        </span>
      )}
    </span>
  )
}

import { Check, House, Landmark, PiggyBank, ShoppingBag } from 'lucide-react'
import type { ComponentType } from 'react'
import type { SplitAmounts } from './dashboardSplit'
import { formatCompactMoney, money } from '../../utils/format'
import { cn } from '../../utils/cn'

type BranchType = 'rent' | 'tax' | 'savings' | 'free'

const branches: { type: BranchType; label: string; color: string; icon: ComponentType<{ className?: string }> }[] = [
  { type: 'rent', label: 'Rent', color: '#2a78d6', icon: House },
  { type: 'tax', label: 'Tax', color: '#eb6834', icon: Landmark },
  { type: 'savings', label: 'Savings', color: '#1baf7a', icon: PiggyBank },
  { type: 'free', label: 'Free to spend', color: '#eda100', icon: ShoppingBag },
]
const branchX = [136, 288, 440, 592]
const height = 50
const top = 15
const end = 96
const bend = 13

interface DashboardSplitRibbonProps {
  amount: number
  allocations: SplitAmounts
  reference?: string
  preview?: boolean
  previewLabel?: string
  branchNotes?: Partial<Record<BranchType, string>>
  size?: 'default' | 'large' | 'compact'
}

/** Visualises the priority-ordered split: one trunk, four branches, leftover to Main. */
export function DashboardSplitRibbon({
  amount,
  allocations,
  reference,
  preview = false,
  previewLabel = 'Preview',
  branchNotes,
  size = 'default',
}: DashboardSplitRibbonProps) {
  const compact = size === 'compact'
  const large = size === 'large'
  const remaining = branches.map((_, index) => amount - branches.slice(0, index + 1)
    .reduce((sum, item) => sum + allocations[item.type], 0))
  const remainingHeights = remaining.map((value) => (amount > 0 ? Math.max(0, (value / amount) * height) : 0))
  const outline = [
    `M 48 ${top}`, `H ${branchX[3]}`, `V ${top + remainingHeights[2]}`,
    `H ${branchX[2]}`, `V ${top + remainingHeights[1]}`,
    `H ${branchX[1]}`, `V ${top + remainingHeights[0]}`,
    `H ${branchX[0]}`, `V ${top + height}`, `H 48`,
    `A ${height / 2} ${height / 2} 0 0 1 48 ${top}`, 'Z',
  ].join(' ')

  return (
    <div
      className={cn(
        'grid w-full items-start gap-4 max-md:block',
        compact
          ? 'grid-cols-[minmax(80px,auto)_minmax(0,1fr)_minmax(80px,auto)] gap-2'
          : large
            ? 'grid-cols-[minmax(120px,auto)_minmax(0,1fr)_minmax(140px,auto)] gap-3.5'
            : 'grid-cols-[minmax(110px,auto)_minmax(0,1fr)_minmax(140px,auto)] gap-3',
      )}
    >
      <div className="pt-[42px] text-end max-md:hidden min-w-0">
        <strong
          className={cn(
            'block font-bold text-ink tabular-nums break-words',
            large ? (amount >= 1_000_000 ? 'text-lg' : 'text-2xl') : (amount >= 1_000_000 ? 'text-xs' : 'text-[15px]'),
            compact && 'text-2xs',
          )}
          title={`${money.format(amount)} MAD`}
        >
          {money.format(amount)} <small className="text-2xs font-bold tracking-normal text-muted">MAD</small>
        </strong>
        <span className={cn('mt-0.5 block truncate text-2xs text-subtle', compact && 'text-3xs')}>
          {preview ? previewLabel : reference}
        </span>
      </div>

      <div className="relative min-w-0">
        <div className={cn('absolute inset-x-0 -top-[3px] h-[18px] text-3xs text-subtle', compact && 'hidden')} aria-hidden="true">
          {remaining.slice(0, 3).map((value, index) => (
            <span
              key={index}
              className="absolute -translate-x-1/2 whitespace-nowrap tabular-nums"
              style={{ left: `${(branchX[index] / 644) * 100}%` }}
              title={`${money.format(Math.max(0, value))} left`}
            >
              {formatCompactMoney(Math.max(0, value))} left
            </span>
          ))}
        </div>

        <svg
          viewBox="0 0 644 108"
          className="block h-auto w-full overflow-visible"
          role="img"
          aria-label={`${preview ? 'Preview' : 'Payment'} split: ${branches.map((item) => `${item.label} ${money.format(allocations[item.type])} MAD`).join(', ')}, Main ${money.format(allocations.main)} MAD`}
        >
          {branches.map((branch, index) => {
            const value = allocations[branch.type]
            if (value <= 0 || amount <= 0) return null
            const width = Math.max(0, (value / amount) * height)
            const x = branchX[index]
            const y = top + remainingHeights[index]
            const outer = bend + width
            const path = [
              `M ${x} ${y}`, `A ${outer} ${outer} 0 0 1 ${x + outer} ${y + outer}`,
              `V ${end}`, `H ${x + bend}`, `V ${y + width + bend}`,
              `A ${bend} ${bend} 0 0 0 ${x} ${y + width}`, 'Z',
            ].join(' ')
            return <path key={branch.type} d={path} fill={branch.color} />
          })}
          <path d={outline} fill="#8a95d2" />
          {allocations.rent <= 0 && (
            <path
              d={`M ${branchX[0] + 18} ${top + height} V ${end}`}
              stroke="#abb8c9"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}
        </svg>

        <div
          className={cn(
            'relative h-11 text-2xs',
            'max-[1050px]:mt-1.5 max-[1050px]:grid max-[1050px]:h-auto max-[1050px]:grid-cols-4 max-[1050px]:gap-[7px] max-[1050px]:text-3xs',
            large && 'h-[73px]',
            compact && 'grid h-auto grid-cols-4 gap-1.5',
          )}
        >
          {branches.map((branch, index) => {
            const Icon = branch.icon
            const allocated = allocations[branch.type]
            return (
              <div
                key={branch.type}
                className={cn(
                  'absolute top-0 w-[120px] max-w-[24%] -translate-x-1/2 text-start',
                  'max-[1050px]:static max-[1050px]:w-auto max-[1050px]:max-w-none max-[1050px]:min-w-0 max-[1050px]:translate-x-0',
                  compact && 'static w-auto max-w-none translate-x-0',
                )}
                style={compact ? undefined : { left: `${(branchX[index] / 644) * 100}%` }}
              >
                <span className="flex items-center gap-1 font-semibold text-body">
                  <span style={{ color: branch.color }}><Icon className="size-3.5 shrink-0" aria-hidden="true" /></span>
                  <span className="truncate">{branch.label}</span>
                </span>
                <strong
                  className={cn(
                    'block font-bold text-ink truncate tabular-nums',
                    allocated >= 1_000_000 ? 'text-xs' : 'text-[13px]',
                    compact && 'text-2xs',
                    large && (allocated >= 1_000_000 ? 'text-xs' : 'text-[13px]'),
                  )}
                  title={allocated > 0 ? `${money.format(allocated)} MAD` : undefined}
                >
                  {allocated > 0 ? money.format(allocated) : 'Skipped'}
                </strong>
                {branchNotes?.[branch.type] && (
                  <small className="mt-0.5 block line-clamp-2 text-3xs leading-snug text-muted break-words" title={branchNotes[branch.type]}>
                    {branchNotes[branch.type]}
                  </small>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className={cn('pt-10 text-xs text-muted max-md:hidden min-w-0', compact && 'pt-10 text-2xs')}>
        <span>Leftover → Main</span>
        <strong
          className={cn('mt-0.5 block truncate font-bold text-ink tabular-nums', compact && 'text-2xs', allocations.main >= 1_000_000 ? 'text-xs' : 'text-[15px]')}
          title={`${money.format(allocations.main)} MAD`}
        >
          {money.format(allocations.main)}
        </strong>
        <b
          className={cn('mt-2.5 flex flex-wrap items-center gap-1 text-xs font-semibold text-ink break-words', compact && 'text-2xs')}
          title={`= ${money.format(amount)} MAD`}
        >
          <span>= {money.format(amount)}</span>
          <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
        </b>
      </div>
    </div>
  )
}

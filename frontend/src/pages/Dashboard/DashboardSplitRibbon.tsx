import { Check, House, Landmark, PiggyBank, ShoppingBag } from 'lucide-react'
import type { ComponentType } from 'react'
import type { SplitAmounts } from './dashboardSplit'
import { money } from '../../utils/format'
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
        'grid w-full items-start gap-5 max-md:block',
        compact
          ? 'grid-cols-[90px_minmax(0,1fr)_90px] gap-2 max-[1050px]:grid-cols-[90px_minmax(0,1fr)_90px]'
          : large
            ? 'grid-cols-[120px_minmax(0,1fr)_145px] gap-3.5 max-[1050px]:grid-cols-[120px_minmax(0,1fr)_145px]'
            : 'grid-cols-[116px_minmax(0,1fr)_173px] max-[1050px]:grid-cols-[100px_minmax(0,1fr)_110px] max-[1050px]:gap-2.5',
      )}
    >
      <div
        className={cn(
          'pt-[42px] text-end max-md:hidden',
          !large && !compact && 'translate-x-[15px]',
        )}
      >
        <strong className={cn('block whitespace-nowrap text-[15px] text-ink', large && 'text-2xl', compact && 'text-2xs', !large && !compact && 'max-[1050px]:text-xs')}>
          {money.format(amount)} <small className="text-2xs font-bold tracking-normal text-muted">MAD</small>
        </strong>
        <span className={cn('mt-0.5 block text-2xs text-subtle', compact && 'text-3xs')}>
          {preview ? previewLabel : reference}
        </span>
      </div>

      <div className="relative min-w-0">
        <div className={cn('absolute inset-x-0 -top-[3px] h-[18px] text-3xs text-subtle', compact && 'hidden')} aria-hidden="true">
          {remaining.slice(0, 3).map((value, index) => (
            <span key={index} className="absolute whitespace-nowrap" style={{ left: `${(branchX[index] / 644) * 100}%` }}>
              {money.format(Math.max(0, value))} left
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
            return (
              <div
                key={branch.type}
                className={cn(
                  'absolute top-0 w-[110px] -translate-x-[40%]',
                  'max-[1050px]:static max-[1050px]:w-auto max-[1050px]:min-w-0 max-[1050px]:translate-x-0',
                  compact && 'static w-auto translate-x-0',
                )}
                style={compact ? undefined : { left: `${(branchX[index] / 644) * 100}%` }}
              >
                <span className="flex items-center gap-1 font-semibold text-body">
                  <span style={{ color: branch.color }}><Icon className="size-3.5 shrink-0" aria-hidden="true" /></span>
                  <span className="truncate">{branch.label}</span>
                </span>
                <strong className={cn('block text-[13px] font-bold text-ink', compact && 'text-2xs', large && 'text-[13px]')}>
                  {allocations[branch.type] > 0 ? money.format(allocations[branch.type]) : 'Skipped'}
                </strong>
                {branchNotes?.[branch.type] && (
                  <small className="mt-0.5 block text-3xs leading-snug text-muted">{branchNotes[branch.type]}</small>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className={cn('pt-10 text-xs text-muted max-md:hidden', compact && 'pt-10 text-2xs')}>
        <span>Leftover → Main</span>
        <strong className={cn('mt-0.5 block text-[15px] font-bold text-ink', compact && 'text-2xs', !compact && 'max-[1050px]:text-xs')}>
          {money.format(allocations.main)}
        </strong>
        <b className={cn('mt-2.5 flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-ink', compact && 'text-2xs')}>
          = {money.format(amount)} <Check className="size-4 text-success" aria-hidden="true" />
        </b>
      </div>
    </div>
  )
}

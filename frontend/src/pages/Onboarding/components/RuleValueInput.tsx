import { inputClass } from '../../../components/ui/styles'
import { cn } from '../../../utils/cn'

interface RuleValueInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  unit: 'MAD' | '%'
}

/** Inline amount/percentage token used inside the onboarding rule sentences. */
export function RuleValueInput({ id, label, value, onChange, unit }: RuleValueInputProps) {
  const charLength = value ? String(value).length : 0
  return (
    <span className={cn(inputClass, 'inline-flex h-9 w-fit max-w-full items-center gap-1.5 px-3 shadow-xs focus-within:border-action-primary focus-within:ring-2 focus-within:ring-action-primary/20')}>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        max={unit === '%' ? '100' : undefined}
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        style={{ width: unit === '%' ? '3rem' : `${Math.max(5, Math.min(14, charLength + 1))}ch` }}
        className={cn(
          'bg-transparent text-end text-sm font-semibold text-ink outline-none',
          unit === '%' ? 'min-w-10' : 'min-w-20 max-w-56',
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
        )}
      />
      <span className="shrink-0 text-xs font-semibold text-muted">{unit}</span>
    </span>
  )
}

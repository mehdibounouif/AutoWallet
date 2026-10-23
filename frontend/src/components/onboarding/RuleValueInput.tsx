interface RuleValueInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  unit: 'MAD' | '%'
}

export function RuleValueInput({ id, label, value, onChange, unit }: RuleValueInputProps) {
  return (
    <span className="inline-flex min-w-0 max-w-full h-9 items-center gap-1 rounded-[10px] border border-border-subtle bg-white px-3 text-brand-ink shadow-2xs focus-within:border-action-primary focus-within:ring-2 focus-within:ring-action-primary/20">
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
        className={`${unit === '%' ? 'w-12' : 'w-24'} min-w-0 max-w-full bg-transparent text-right text-sm font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
      />
      <span className="text-xs font-semibold text-brand-muted">{unit}</span>
    </span>
  )
}

import { useRef } from 'react'
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from 'react'
import { cn } from '../../utils/cn'

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  hasError?: boolean
  onComplete?: (code: string) => void
  autoFocus?: boolean
}

/** Six single-digit boxes with paste and auto-advance support. */
export function OTPInput({ value, onChange, disabled = false, hasError = false, onComplete, autoFocus = true }: OTPInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    const char = event.target.value.slice(-1).replace(/\D/g, '')
    const chars = (value || '').padEnd(6, ' ').split('')
    chars[index] = char || ' '
    const nextValue = chars.join('').trimEnd()
    onChange(nextValue)

    if (char && index < 5) inputsRef.current[index + 1]?.focus()
    if (char && nextValue.replace(/\s/g, '').length === 6) onComplete?.(nextValue)
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    if (event.key === 'Backspace' && (!value[index] || value[index] === ' ') && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (event: ClipboardEvent) => {
    if (disabled) return
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    onChange(pasted)
    inputsRef.current[Math.min(pasted.length, 5)]?.focus()
    if (pasted.length === 6) onComplete?.(pasted)
  }

  return (
    <div
      role="group"
      aria-label="6-digit verification code"
      className="my-2 flex items-center justify-between gap-1.5 sm:gap-2.5"
      dir="ltr"
      onPaste={handlePaste}
    >
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(element) => { inputsRef.current[index] = element }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && index === 0}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of 6`}
          value={value[index] && value[index] !== ' ' ? value[index] : ''}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          aria-invalid={hasError || undefined}
          className={cn(
            'h-13 w-0 min-w-0 flex-1 rounded-[10px] border text-center font-mono text-2xl font-semibold transition outline-none sm:h-14 sm:w-12 sm:flex-none',
            disabled
              ? 'cursor-not-allowed border-line bg-canvas text-subtle opacity-60'
              : hasError
                ? 'border-action-danger bg-action-danger-subtle text-action-danger focus:border-action-danger focus:ring-2 focus:ring-action-danger/20'
                : 'border-line bg-white text-ink focus:border-action-primary focus:ring-2 focus:ring-action-primary/20',
          )}
        />
      ))}
    </div>
  )
}

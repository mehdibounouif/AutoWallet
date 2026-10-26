import { Check, Copy } from 'lucide-react'
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard'

/** Copyable code sample used by the developer settings. */
export function CodeBlock({ label, code }: { label: string; code: string }) {
  const { copied, copy } = useCopyToClipboard()
  return (
    <div className="mt-4 overflow-hidden rounded-[10px] border border-line bg-canvas">
      <header className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2.5 text-2xs text-muted">
        <span>{label}</span>
        <button type="button" onClick={() => void copy(code)} className="flex min-h-7 items-center gap-1.5">
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </header>
      <pre className="overflow-x-auto px-3.5 py-4 text-2xs leading-relaxed"><code>{code}</code></pre>
    </div>
  )
}

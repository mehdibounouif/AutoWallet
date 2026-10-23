import type { ComponentPropsWithRef } from 'react'

export function AuthPanel({ className = '', ...props }: ComponentPropsWithRef<'div'>) {
  return <div className={`w-full max-w-[440px] rounded-2xl border border-border-subtle bg-white p-6 shadow-[0_8px_24px_-4px_rgba(27,36,50,0.08),0_2px_6px_-1px_rgba(27,36,50,0.04)] sm:p-9 ${className}`} {...props} />
}

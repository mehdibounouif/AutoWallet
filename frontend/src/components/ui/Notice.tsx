import type { ComponentPropsWithRef } from 'react'

type NoticeProps = ComponentPropsWithRef<'div'> & {
  as?: 'div' | 'p'
  tone?: 'info' | 'success' | 'error'
}

const tones = {
  info: 'bg-[#E8F1FC] text-[#2164B1]',
  success: 'bg-[#E4F4E9] text-[#176B39]',
  error: 'bg-[#FFEFED] text-[#AD3C3C]',
}

export function Notice({ as: Element = 'div', tone = 'info', className = '', ...props }: NoticeProps) {
  return <Element className={`my-5 flex items-center gap-2.5 rounded-[10px] px-4 py-[13px] text-[13px] leading-[1.6] max-md:items-start max-md:p-3 max-md:text-xs [&>svg]:shrink-0 [&_button]:ml-auto [&_button]:font-[650] [&_button]:underline ${tones[tone]} ${className}`} {...props} />
}

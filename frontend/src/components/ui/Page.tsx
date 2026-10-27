import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/cn'

const widths = {
  wide: 'max-w-[1220px]',
  focus: 'max-w-[800px]',
  reading: 'max-w-[760px]',
} as const

interface PageProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'main' | 'article'
  width?: keyof typeof widths
  children: ReactNode
}

/** Shared page column: one place for max-width and horizontal centering. */
export function Page({ as: Tag = 'div', width = 'wide', className, children, ...rest }: PageProps) {
  return (
    <Tag className={cn('mx-auto w-full min-w-0', widths[width], className)} {...rest}>
      {children}
    </Tag>
  )
}

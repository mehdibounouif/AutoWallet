import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'aside'
  children: ReactNode
}

/** The single surface treatment used by every page. Padding is explicit per use. */
export function Card({ as: Tag = 'div', className, children, ...rest }: CardProps) {
  return (
    <Tag className={cn('min-w-0 rounded-card border border-line bg-surface', className)} {...rest}>
      {children}
    </Tag>
  )
}

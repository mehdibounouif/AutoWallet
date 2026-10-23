import type { ComponentPropsWithRef } from 'react'
import { cardStyles } from './styles'

type CardProps = ComponentPropsWithRef<'div'> & { as?: 'div' | 'section' | 'article' }

export function Card({ as: Element = 'div', className = '', ...props }: CardProps) {
  return <Element className={`${cardStyles} ${className}`} {...props} />
}

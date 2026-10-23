import type { ComponentPropsWithRef } from 'react'
import { buttonStyles } from './styles'
import type { ButtonVariant, ButtonAppearance } from './styles'

type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: ButtonVariant
  appearance?: ButtonAppearance
}

export function Button({ type = 'button', variant, appearance, className, ...props }: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, appearance, className })} {...props} />
}

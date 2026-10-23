import type { ComponentPropsWithRef } from 'react'
import { inputStyles } from './styles'
import type { ControlAppearance } from './styles'

type TextInputProps = ComponentPropsWithRef<'input'> & { appearance?: ControlAppearance }

export function TextInput({ appearance, className, ...props }: TextInputProps) {
  return <input className={inputStyles({ appearance, className })} {...props} />
}

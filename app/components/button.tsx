import ßReact from 'react'
import { Button as ButtonPrimitive } from '@radix-ui/themes'

interface ButtonProps {
  children?: React.ReactNode
}

export const Button = ({
  children
}: ButtonProps) => {
  return <ButtonPrimitive variant='classic'>
    { children}
  </ButtonPrimitive>
}

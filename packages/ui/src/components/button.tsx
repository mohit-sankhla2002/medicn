import * as React from "react"
import { cn } from "../lib/cn"

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive"
type ButtonSize = "sm" | "md" | "lg"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  iconOnly?: boolean
}

const baseClasses =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap " +
  "transition-colors select-none outline-none " +
  "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  "aria-disabled:pointer-events-none aria-disabled:opacity-50"

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 active:bg-neutral-700",
  secondary:
    "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300",
  outline:
    "border border-neutral-300 bg-white text-neutral-900 shadow-sm hover:bg-neutral-50 active:bg-neutral-100",
  ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200",
  destructive:
    "bg-status-critical text-white shadow-sm hover:brightness-110 active:brightness-90",
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
}

const iconOnlyClasses: Record<ButtonSize, string> = {
  sm: "size-8 p-0",
  md: "size-10 p-0",
  lg: "size-12 p-0",
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  iconOnly = false,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        iconOnly && iconOnlyClasses[size],
        className,
      )}
      {...props}
    />
  )
}

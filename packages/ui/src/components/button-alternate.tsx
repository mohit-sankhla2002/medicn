import * as React from "react";
import { cn } from "../lib/cn";

type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLBUttonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
}

const baseClasses =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap " +
  "transition-colors select-none outline-none " +
  "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600 " +
  "disable:pointer-events-none disable:opacity-50 " +
  "aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 active:bg-neutral-700",
  secondary:
    "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300",
  outline:
    "border border-neutral-300 bg-white text-neutral-900 shadow-sm hover:bg-neutral-50 active:bg-neutral-100",
  ghost:
    "bg-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200",
  destructive

}

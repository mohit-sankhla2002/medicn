import * as React from "react"

import { cn } from "@/lib/utils"

/** The medicn mark: a teal-to-blue "M" with a medical cross. */
export function Logo({ className }: { className?: string }) {
  const id = React.useId()
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-7", className)}>
      <defs>
        <linearGradient id={`${id}-l`} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#4fdcc8" />
          <stop offset="1" stopColor="#1fa7ad" />
        </linearGradient>
        <linearGradient id={`${id}-r`} x1="1" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#3aa6f7" />
          <stop offset="1" stopColor="#1d5bd0" />
        </linearGradient>
      </defs>
      <path
        d="M6.5 25V7L16 19.5"
        fill="none"
        stroke={`url(#${id}-l)`}
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 19.5L25.5 7V25"
        fill="none"
        stroke={`url(#${id}-r)`}
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.4 9.1h3.2a.5.5 0 0 1 .5.5v2.9h2.9a.5.5 0 0 1 .5.5v3.2a.5.5 0 0 1-.5.5h-2.9v2.9a.5.5 0 0 1-.5.5h-3.2a.5.5 0 0 1-.5-.5v-2.9H11a.5.5 0 0 1-.5-.5v-3.2a.5.5 0 0 1 .5-.5h2.9V9.6a.5.5 0 0 1 .5-.5z"
        fill="#fff"
      />
    </svg>
  )
}

/** "Medicn" wordmark with the brand-blue final letter. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold tracking-tight", className)}>
      Medic<span className="text-[#2b8de3] dark:text-[#4aa8f2]">n</span>
    </span>
  )
}

"use client"

import * as React from "react"
import { Angry, Annoyed, Frown, Laugh, Meh, Smile } from "lucide-react"

import { cn } from "@/lib/utils"

export interface PainLevel {
  min: number
  max: number
  label: string
  icon: React.ComponentType<{ className?: string }>
}

/** Descriptors follow the common 0–10 Numeric Rating Scale (NRS) bands. */
export const PAIN_LEVELS: PainLevel[] = [
  { min: 0, max: 0, label: "No pain", icon: Laugh },
  { min: 1, max: 3, label: "Mild", icon: Smile },
  { min: 4, max: 5, label: "Moderate", icon: Meh },
  { min: 6, max: 7, label: "Severe", icon: Annoyed },
  { min: 8, max: 9, label: "Very severe", icon: Frown },
  { min: 10, max: 10, label: "Worst possible", icon: Angry },
]

export function getPainLevel(value: number): PainLevel {
  return PAIN_LEVELS.find((level) => value >= level.min && value <= level.max) ?? PAIN_LEVELS[0]
}

// One colour per score, blended across the clinical tokens:
// normal (0) -> watch (4) -> abnormal (7) -> critical (10).
const PAIN_STOPS: [number, string][] = [
  [0, "normal"],
  [4, "watch"],
  [7, "abnormal"],
  [10, "critical"],
]

function painColor(score: number, suffix = "") {
  const upper = PAIN_STOPS.findIndex(([at]) => at >= score)
  const [toAt, to] = PAIN_STOPS[upper]
  if (toAt === score || upper === 0) return `var(--clinical-${to}${suffix})`
  const [fromAt, from] = PAIN_STOPS[upper - 1]
  const amount = Math.round(((score - fromAt) / (toAt - fromAt)) * 100)
  return `color-mix(in oklch, var(--clinical-${to}${suffix}) ${amount}%, var(--clinical-${from}${suffix}))`
}

function painStyle(score: number) {
  return {
    "--pain": painColor(score),
    "--pain-foreground": painColor(score, "-foreground"),
  } as React.CSSProperties
}

export interface PainScaleProps extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
  value?: number | null
  defaultValue?: number | null
  onValueChange?: (value: number) => void
  /** Show the face icon and descriptor for the selected score. */
  showDescriptor?: boolean
  /** Show the anchor labels under 0, 5 and 10. */
  showAnchors?: boolean
  size?: "sm" | "default" | "lg"
  disabled?: boolean
  /** Accessible name for the radio group. */
  label?: string
}

const sizeClasses = {
  sm: "h-7 text-xs",
  default: "h-9 text-sm",
  lg: "h-11 text-base",
}

export function PainScale({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  showDescriptor = true,
  showAnchors = true,
  size = "default",
  disabled = false,
  label = "Pain intensity from 0 to 10",
  className,
  ...props
}: PainScaleProps) {
  const [uncontrolled, setUncontrolled] = React.useState<number | null>(defaultValue)
  const value = valueProp !== undefined ? valueProp : uncontrolled
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])

  const select = (next: number) => {
    if (disabled) return
    if (valueProp === undefined) setUncontrolled(next)
    onValueChange?.(next)
  }

  const onKeyDown = (event: React.KeyboardEvent, score: number) => {
    let next: number | null = null
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.min(10, score + 1)
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.max(0, score - 1)
    if (event.key === "Home") next = 0
    if (event.key === "End") next = 10
    if (next === null) return
    event.preventDefault()
    select(next)
    refs.current[next]?.focus()
  }

  const level = value != null ? getPainLevel(value) : null
  const Icon = level?.icon
  // Roving tabindex: the selected score (or 0) is the single tab stop.
  const tabStop = value ?? 0

  return (
    <div data-slot="pain-scale" className={cn("flex w-full flex-col gap-3", className)} {...props}>
      <div
        role="radiogroup"
        aria-label={label}
        aria-disabled={disabled || undefined}
        className="grid grid-cols-11 gap-1"
      >
        {Array.from({ length: 11 }, (_, score) => {
          const selected = value === score
          return (
            <button
              key={score}
              ref={(node) => {
                refs.current[score] = node
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${score} – ${getPainLevel(score).label}`}
              tabIndex={score === tabStop ? 0 : -1}
              disabled={disabled}
              onClick={() => select(score)}
              onKeyDown={(event) => onKeyDown(event, score)}
              style={painStyle(score)}
              className={cn(
                "relative flex items-center justify-center rounded-md border font-medium tabular-nums transition-all outline-none",
                "focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                sizeClasses[size],
                selected
                  ? cn("border-(--pain) bg-(--pain)", "scale-105 text-white shadow-sm motion-reduce:scale-100")
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              {score}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-1 -bottom-px h-0.5 rounded-full opacity-70",
                  "bg-(--pain)",
                  selected && "opacity-0"
                )}
              />
            </button>
          )
        })}
      </div>
      {showAnchors && (
        <div className="grid grid-cols-3 text-xs text-muted-foreground" aria-hidden>
          <span>No pain</span>
          <span className="text-center">Moderate</span>
          <span className="text-right">Worst possible</span>
        </div>
      )}
      {showDescriptor && (
        <div
          aria-live="polite"
          className="flex min-h-10 items-center gap-3 rounded-lg border border-dashed px-3 py-2 text-sm"
        >
          {level && Icon && value != null ? (
            <>
              <span className="flex text-(--pain-foreground)" style={painStyle(value)}>
                <Icon className="size-6 shrink-0" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="font-medium">
                  {value}/10 · {level.label}
                </span>
                <span className="text-xs text-muted-foreground">Patient-reported pain intensity</span>
              </div>
            </>
          ) : (
            <span className="text-muted-foreground">Select a score from 0 (no pain) to 10 (worst possible).</span>
          )}
        </div>
      )}
    </div>
  )
}

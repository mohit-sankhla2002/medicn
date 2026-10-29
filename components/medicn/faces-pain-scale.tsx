"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/** Scores on the faces scale: 0–10 in steps of 2 (six faces). */
export const FACES_PAIN_SCORES = [0, 2, 4, 6, 8, 10] as const

export type FacesPainScore = (typeof FACES_PAIN_SCORES)[number]

/** Default child-friendly descriptors, one per face. Pass `labels` to localise or replace them. */
export const FACES_PAIN_LABELS: readonly string[] = [
  "Doesn't hurt",
  "Hurts a tiny bit",
  "Hurts some",
  "Hurts quite a lot",
  "Hurts really badly",
  "Worst hurt ever",
]

// Same colour ramp as PainScale, blended across the clinical tokens:
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

/** Mouth curvature per score: positive smiles, negative frowns. */
const MOUTH_CURVE: Record<number, number> = { 0: 16, 2: 9, 4: 2, 6: -6, 8: -11 }

export interface PainFaceProps extends React.ComponentProps<"svg"> {
  /** Score 0–10 (even numbers map to the six faces). */
  score: number
}

/**
 * Original, simple face drawing (not derived from any published faces scale artwork).
 * Brows lift at the inner ends, the mouth bends from a smile to a frown, and tears appear at 8+.
 */
export function PainFace({ score, className, style, ...props }: PainFaceProps) {
  const s = Math.max(0, Math.min(10, Math.round(score / 2) * 2))
  const browLift = s >= 4 ? (s - 2) * 0.9 : 0
  const curve = MOUTH_CURVE[s]
  const mouthY = curve !== undefined && curve < 0 ? 45 : 40

  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden
      focusable="false"
      className={cn("size-14", className)}
      style={{ ...painStyle(s), ...style }}
      {...props}
    >
      <circle
        cx={32}
        cy={32}
        r={29}
        fill="color-mix(in oklch, var(--pain) 18%, var(--background))"
        stroke="var(--pain)"
        strokeWidth={2.5}
      />
      <g
        fill="none"
        stroke="var(--pain-foreground)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Brows */}
        {browLift > 0 && (
          <>
            <path d={`M17 ${20 + browLift / 2} L27 ${20 - browLift / 2}`} />
            <path d={`M47 ${20 + browLift / 2} L37 ${20 - browLift / 2}`} />
          </>
        )}
        {/* Eyes */}
        {s === 0 && (
          <>
            <path d="M19 28 Q23 23 27 28" />
            <path d="M37 28 Q41 23 45 28" />
          </>
        )}
        {s === 10 && (
          <>
            <path d="M19 24 L26 27.5 L19 31" />
            <path d="M45 24 L38 27.5 L45 31" />
          </>
        )}
        {/* Mouth */}
        {curve !== undefined ? (
          <path d={`M21 ${mouthY} Q32 ${mouthY + curve} 43 ${mouthY}`} />
        ) : (
          <path d="M22 48 Q32 35 42 48 Q32 51 22 48 Z" fill="var(--pain-foreground)" />
        )}
      </g>
      {s > 0 && s < 10 && (
        <g fill="var(--pain-foreground)">
          <ellipse cx={23} cy={27.5} rx={2.6} ry={s === 8 ? 2 : 3.2} />
          <ellipse cx={41} cy={27.5} rx={2.6} ry={s === 8 ? 2 : 3.2} />
        </g>
      )}
      {s >= 8 && (
        <g fill="var(--clinical-info)">
          <path d="M22 33 Q18.5 39 22 41 Q25.5 39 22 33 Z" />
          {s === 10 && <path d="M42 33 Q38.5 39 42 41 Q45.5 39 42 33 Z" />}
        </g>
      )}
    </svg>
  )
}

export interface FacesPainScaleProps extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
  value?: number | null
  defaultValue?: number | null
  onValueChange?: (value: number) => void
  /** Six descriptors, for scores 0, 2, 4, 6, 8, 10. */
  labels?: readonly string[]
  /** Show the score under each face. */
  showNumbers?: boolean
  size?: "sm" | "default" | "lg"
  /** Show the selection but do not allow changes (e.g. reviewing a recorded score). */
  readOnly?: boolean
  disabled?: boolean
  /** Replace the built-in faces with your own (e.g. licensed FPS-R or Wong-Baker artwork). */
  renderFace?: (value: number, selected: boolean) => React.ReactNode
  /** Accessible name for the radio group. */
  label?: string
}

const faceSize = {
  sm: "size-9",
  default: "size-12 sm:size-14",
  lg: "size-16 sm:size-20",
}

const textSize = {
  sm: "text-[10px]",
  default: "text-[11px] sm:text-xs",
  lg: "text-xs sm:text-sm",
}

export function FacesPainScale({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  labels = FACES_PAIN_LABELS,
  showNumbers = true,
  size = "default",
  readOnly = false,
  disabled = false,
  renderFace,
  label = "How much does it hurt? Faces scale from 0 to 10",
  className,
  ...props
}: FacesPainScaleProps) {
  const [uncontrolled, setUncontrolled] = React.useState<number | null>(defaultValue)
  const value = valueProp !== undefined ? valueProp : uncontrolled
  const refs = React.useRef<(HTMLButtonElement | null)[]>([])

  const select = (next: number) => {
    if (disabled || readOnly) return
    if (valueProp === undefined) setUncontrolled(next)
    onValueChange?.(next)
  }

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const last = FACES_PAIN_SCORES.length - 1
    let next: number | null = null
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.min(last, index + 1)
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.max(0, index - 1)
    if (event.key === "Home") next = 0
    if (event.key === "End") next = last
    if (next === null) return
    event.preventDefault()
    refs.current[next]?.focus()
    // Read-only groups still let keyboard users move focus to review each face.
    select(FACES_PAIN_SCORES[next])
  }

  const selectedIndex = FACES_PAIN_SCORES.findIndex((score) => score === value)
  // Roving tabindex: the selected face (or the first) is the single tab stop.
  const tabStop = selectedIndex === -1 ? 0 : selectedIndex

  return (
    <div
      data-slot="faces-pain-scale"
      role="radiogroup"
      aria-label={label}
      aria-readonly={readOnly || undefined}
      aria-disabled={disabled || undefined}
      className={cn("grid w-full grid-cols-6 gap-1 sm:gap-2", className)}
      {...props}
    >
      {FACES_PAIN_SCORES.map((score, index) => {
        const selected = value === score
        const text = labels[index] ?? ""
        return (
          <button
            key={score}
            ref={(node) => {
              refs.current[index] = node
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${score} – ${text}`}
            tabIndex={index === tabStop ? 0 : -1}
            disabled={disabled}
            onClick={() => select(score)}
            onKeyDown={(event) => onKeyDown(event, index)}
            style={painStyle(score)}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-lg border px-0.5 py-2 text-center transition-all outline-none",
              "focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
              readOnly && "cursor-default",
              selected
                ? "border-(--pain) bg-(--pain)/10 shadow-sm"
                : cn("border-transparent", !readOnly && "hover:bg-muted"),
              readOnly && !selected && value != null && "opacity-50"
            )}
          >
            <span
              className={cn(
                "flex transition-transform motion-reduce:transition-none",
                selected && "scale-110 motion-reduce:scale-100"
              )}
            >
              {renderFace ? renderFace(score, selected) : <PainFace score={score} className={faceSize[size]} />}
            </span>
            {showNumbers && (
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  selected ? "text-(--pain-foreground)" : "text-foreground"
                )}
              >
                {score}
              </span>
            )}
            <span
              className={cn(
                "leading-tight text-balance",
                textSize[size],
                selected ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {text}
            </span>
          </button>
        )
      })}
    </div>
  )
}

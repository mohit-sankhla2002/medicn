"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"

// ───────────────────────────── Scoring ─────────────────────────────
// Source: Teasdale G. "Glasgow Coma Scale: Do it this way" assessment aid (2015),
// glasgowcomascale.org. GCS-P: Brennan, Murray & Teasdale, J Neurosurg 2018;128:1612–1620.

/** A component score, `"NT"` (not testable) or `null` (not yet assessed). */
export type GcsComponentValue = number | "NT" | null

export type GcsComponent = "eye" | "verbal" | "motor"

/** Number of pupils that react to light. Pupil Reactivity Score = 0 / 1 / 2. */
export type GcsPupils = "both" | "one" | "none"

export interface GcsValue {
  eye: GcsComponentValue
  verbal: GcsComponentValue
  motor: GcsComponentValue
  pupils?: GcsPupils | null
}

export interface GcsOption {
  score: number | "NT"
  rating: string
  criterion: string
}

export const GCS_OPTIONS: Record<GcsComponent, GcsOption[]> = {
  eye: [
    { score: 4, rating: "Spontaneous", criterion: "Open before stimulus" },
    { score: 3, rating: "To sound", criterion: "After spoken or shouted request" },
    { score: 2, rating: "To pressure", criterion: "After finger tip stimulus" },
    { score: 1, rating: "None", criterion: "No opening at any time, no interfering factor" },
    { score: "NT", rating: "Not testable", criterion: "Closed by local factor" },
  ],
  verbal: [
    { score: 5, rating: "Orientated", criterion: "Correctly gives name, place and date" },
    { score: 4, rating: "Confused", criterion: "Not orientated but communicating coherently" },
    { score: 3, rating: "Words", criterion: "Intelligible single words" },
    { score: 2, rating: "Sounds", criterion: "Only moans / groans" },
    { score: 1, rating: "None", criterion: "No audible response, no interfering factor" },
    { score: "NT", rating: "Not testable", criterion: "Factor interfering with communication (e.g. intubated)" },
  ],
  motor: [
    { score: 6, rating: "Obeys commands", criterion: "Obeys 2-part request" },
    { score: 5, rating: "Localising", criterion: "Brings hand above clavicle to stimulus on head or neck" },
    { score: 4, rating: "Normal flexion", criterion: "Bends arm at elbow rapidly but features not predominantly abnormal" },
    { score: 3, rating: "Abnormal flexion", criterion: "Bends arm at elbow, features clearly predominantly abnormal" },
    { score: 2, rating: "Extension", criterion: "Extends arm at elbow" },
    { score: 1, rating: "None", criterion: "No movement in arms / legs, no interfering factor" },
    { score: "NT", rating: "Not testable", criterion: "Paralysed or other limiting factor" },
  ],
}

export const GCS_COMPONENT_LABELS: Record<GcsComponent, string> = {
  eye: "Eye opening",
  verbal: "Verbal response",
  motor: "Best motor response",
}

const LETTER: Record<GcsComponent, string> = { eye: "E", verbal: "V", motor: "M" }
const RANGE: Record<GcsComponent, [number, number]> = { eye: [1, 4], verbal: [1, 5], motor: [1, 6] }

export const PUPIL_REACTIVITY_SCORE: Record<GcsPupils, number> = { both: 0, one: 1, none: 2 }

export type GcsSeverity = "mild" | "moderate" | "severe"

export const GCS_SEVERITY_LABELS: Record<GcsSeverity, string> = {
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
}

export interface GcsResult {
  /** Sum of E + V + M (3–15), or `null` when any component is NT or not assessed. */
  total: number | null
  /** At least one component is not testable. */
  notTestable: GcsComponent[]
  /** Components not yet assessed. */
  missing: GcsComponent[]
  complete: boolean
  severity: GcsSeverity | null
  /** e.g. "E3 V4 M6" or "E3 VT M5". */
  notation: string
  /** Pupil Reactivity Score (0–2) when pupils are recorded. */
  pupilReactivityScore: number | null
  /** GCS-P = GCS − PRS (1–15), only when the total and pupils are both available. */
  gcsP: number | null
}

const valid = (component: GcsComponent, value: GcsComponentValue): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= RANGE[component][0] &&
  value <= RANGE[component][1]

export function gcsSeverity(total: number): GcsSeverity {
  if (total >= 13) return "mild"
  if (total >= 9) return "moderate"
  return "severe"
}

export function scoreGcs(value: Partial<GcsValue>): GcsResult {
  const components: GcsComponent[] = ["eye", "verbal", "motor"]
  const notTestable = components.filter((c) => value[c] === "NT")
  const missing = components.filter((c) => value[c] !== "NT" && !valid(c, value[c] ?? null))
  const complete = notTestable.length === 0 && missing.length === 0
  const total = complete ? components.reduce((sum, c) => sum + (value[c] as number), 0) : null
  const notation = components
    .map((c) => {
      const v = value[c]
      if (v === "NT") return `${LETTER[c]}T`
      return valid(c, v ?? null) ? `${LETTER[c]}${v}` : `${LETTER[c]}–`
    })
    .join(" ")
  const pupilReactivityScore = value.pupils ? PUPIL_REACTIVITY_SCORE[value.pupils] : null
  return {
    total,
    notTestable,
    missing,
    complete,
    severity: total === null ? null : gcsSeverity(total),
    notation,
    pupilReactivityScore,
    gcsP: total !== null && pupilReactivityScore !== null ? total - pupilReactivityScore : null,
  }
}

/** "GCS 13 (E3 V4 M6)", or "GCS E3 VT M5" when a component is not testable or missing. */
export function formatGcs(value: Partial<GcsValue>): string {
  const result = scoreGcs(value)
  return result.total === null ? `GCS ${result.notation}` : `GCS ${result.total} (${result.notation})`
}

// ───────────────────────────── Component ─────────────────────────────

const SEVERITY_STATUS: Record<GcsSeverity, ClinicalStatus> = {
  mild: "watch",
  moderate: "abnormal",
  severe: "critical",
}

const PUPIL_OPTIONS: { value: GcsPupils; label: string; description: string }[] = [
  { value: "both", label: "Both reactive", description: "PRS 0" },
  { value: "one", label: "One reactive", description: "One pupil unreactive · PRS 1" },
  { value: "none", label: "Neither reactive", description: "Both pupils unreactive · PRS 2" },
]

const EMPTY: GcsValue = { eye: null, verbal: null, motor: null, pupils: null }

export interface GlasgowComaScaleProps extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
  value?: GcsValue
  defaultValue?: Partial<GcsValue>
  onValueChange?: (value: GcsValue) => void
  /** Show the pupil reactivity question and the GCS-P. */
  showPupils?: boolean
  /** Show the criterion text under each rating. */
  showCriteria?: boolean
  disabled?: boolean
}

export function GlasgowComaScale({
  value: valueProp,
  defaultValue,
  onValueChange,
  showPupils = false,
  showCriteria = true,
  disabled = false,
  className,
  ...props
}: GlasgowComaScaleProps) {
  const id = React.useId()
  const [uncontrolled, setUncontrolled] = React.useState<GcsValue>({ ...EMPTY, ...defaultValue })
  const value = valueProp ?? uncontrolled
  const result = scoreGcs(value)

  const set = (patch: Partial<GcsValue>) => {
    const next = { ...value, ...patch }
    if (valueProp === undefined) setUncontrolled(next)
    onValueChange?.(next)
  }

  const status: ClinicalStatus =
    result.total === 15 ? "normal" : result.severity ? SEVERITY_STATUS[result.severity] : "unknown"

  return (
    <div data-slot="glasgow-coma-scale" className={cn("flex w-full flex-col gap-5", className)} {...props}>
      <div className="grid gap-5 md:grid-cols-3">
        {(Object.keys(GCS_OPTIONS) as GcsComponent[]).map((component) => (
          <FieldSet key={component} disabled={disabled}>
            <FieldLegend variant="label" className="flex w-full items-center justify-between">
              {GCS_COMPONENT_LABELS[component]}
              <span className="font-mono text-xs text-muted-foreground">
                {value[component] === "NT"
                  ? `${LETTER[component]}T`
                  : value[component] != null
                    ? `${LETTER[component]}${value[component]}`
                    : `${LETTER[component]}–`}
              </span>
            </FieldLegend>
            <RadioGroup
              value={value[component] == null ? "" : String(value[component])}
              onValueChange={(next) => set({ [component]: next === "NT" ? "NT" : Number(next) })}
              disabled={disabled}
              aria-label={GCS_COMPONENT_LABELS[component]}
              className="gap-1.5"
            >
              {GCS_OPTIONS[component].map((option) => {
                const optionId = `${id}-${component}-${option.score}`
                return (
                  <FieldLabel key={option.score} htmlFor={optionId}>
                    <Field orientation="horizontal" className="gap-3">
                      <RadioGroupItem value={String(option.score)} id={optionId} />
                      <FieldContent className="gap-0.5">
                        <FieldTitle>
                          <span className="w-5 font-mono text-xs text-muted-foreground tabular-nums">
                            {option.score}
                          </span>
                          {option.rating}
                        </FieldTitle>
                        {showCriteria && (
                          <FieldDescription className="text-xs">{option.criterion}</FieldDescription>
                        )}
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                )
              })}
            </RadioGroup>
          </FieldSet>
        ))}
      </div>

      {showPupils && (
        <FieldSet disabled={disabled}>
          <FieldLegend variant="label">Pupil reactivity to light</FieldLegend>
          <RadioGroup
            value={value.pupils ?? ""}
            onValueChange={(next) => set({ pupils: next as GcsPupils })}
            disabled={disabled}
            aria-label="Pupil reactivity to light"
            className="grid-cols-1 gap-1.5 sm:grid-cols-3"
          >
            {PUPIL_OPTIONS.map((option) => {
              const optionId = `${id}-pupils-${option.value}`
              return (
                <FieldLabel key={option.value} htmlFor={optionId}>
                  <Field orientation="horizontal" className="gap-3">
                    <RadioGroupItem value={option.value} id={optionId} />
                    <FieldContent className="gap-0.5">
                      <FieldTitle>{option.label}</FieldTitle>
                      <FieldDescription className="text-xs">{option.description}</FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldLabel>
              )
            })}
          </RadioGroup>
        </FieldSet>
      )}

      <div
        aria-live="polite"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/60 px-4 py-3"
      >
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Glasgow Coma Scale</span>
          <span className="text-lg font-semibold tabular-nums">
            {result.total ?? "—"}
            <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">{result.notation}</span>
          </span>
          {result.notTestable.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Total not computable: {result.notTestable.map((c) => GCS_COMPONENT_LABELS[c].toLowerCase()).join(", ")}{" "}
              not testable. Report the components.
            </span>
          )}
          {showPupils && result.gcsP !== null && (
            <span className="text-xs text-muted-foreground tabular-nums">
              GCS-P {result.gcsP} (GCS {result.total} − PRS {result.pupilReactivityScore})
            </span>
          )}
        </div>
        {result.severity ? (
          <ClinicalStatusBadge status={status}>{GCS_SEVERITY_LABELS[result.severity]}</ClinicalStatusBadge>
        ) : (
          <ClinicalStatusBadge status="unknown">{result.notTestable.length ? "Not computable" : "Incomplete"}</ClinicalStatusBadge>
        )}
      </div>
    </div>
  )
}

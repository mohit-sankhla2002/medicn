"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"

// ───────────────────────────── Scoring ─────────────────────────────
// Source: Morse JM, Morse RM, Tylko SJ. Development of a scale to identify the fall-prone
// patient. Can J Aging 1989;8(4):366–377. Item names follow the LOINC Morse Fall Scale panel (59453-1).

export type MorseItem =
  | "historyOfFalling"
  | "secondaryDiagnosis"
  | "ambulatoryAid"
  | "ivTherapy"
  | "gait"
  | "mentalStatus"

export interface MorseOption {
  value: string
  label: string
  points: number
}

export interface MorseItemDefinition {
  item: MorseItem
  label: string
  description: string
  options: MorseOption[]
}

export const MORSE_ITEMS: MorseItemDefinition[] = [
  {
    item: "historyOfFalling",
    label: "History of falling",
    description: "Fell immediately before or during this admission, or within the last 3 months",
    options: [
      { value: "no", label: "No", points: 0 },
      { value: "yes", label: "Yes", points: 25 },
    ],
  },
  {
    item: "secondaryDiagnosis",
    label: "Secondary diagnosis",
    description: "More than one medical diagnosis",
    options: [
      { value: "no", label: "No", points: 0 },
      { value: "yes", label: "Yes", points: 15 },
    ],
  },
  {
    item: "ambulatoryAid",
    label: "Ambulatory aid",
    description: "What the patient uses to walk",
    options: [
      { value: "none", label: "None / bed rest / nurse assist", points: 0 },
      { value: "aid", label: "Crutches / cane / walker", points: 15 },
      { value: "furniture", label: "Furniture", points: 30 },
    ],
  },
  {
    item: "ivTherapy",
    label: "IV therapy / heparin lock",
    description: "Intravenous apparatus or saline/heparin lock in place",
    options: [
      { value: "no", label: "No", points: 0 },
      { value: "yes", label: "Yes", points: 20 },
    ],
  },
  {
    item: "gait",
    label: "Gait",
    description: "Observed walking or transferring",
    options: [
      { value: "normal", label: "Normal / bed rest / wheelchair", points: 0 },
      { value: "weak", label: "Weak", points: 10 },
      { value: "impaired", label: "Impaired", points: 20 },
    ],
  },
  {
    item: "mentalStatus",
    label: "Mental status",
    description: "Patient's own assessment of their ability to walk, compared with nursing orders",
    options: [
      { value: "oriented", label: "Oriented to own ability", points: 0 },
      { value: "overestimates", label: "Overestimates / forgets limitations", points: 15 },
    ],
  },
]

export type MorseAnswers = Partial<Record<MorseItem, string | null>>

export type MorseRisk = "low" | "moderate" | "high"

/** Lowest total for each risk level. Defaults: low 0–24, moderate 25–44, high ≥45. */
export interface MorseThresholds {
  moderate: number
  high: number
}

export const DEFAULT_MORSE_THRESHOLDS: MorseThresholds = { moderate: 25, high: 45 }

export const MORSE_RISK_LABELS: Record<MorseRisk, string> = {
  low: "Low risk",
  moderate: "Moderate risk",
  high: "High risk",
}

export const MORSE_RISK_STATUS: Record<MorseRisk, ClinicalStatus> = {
  low: "normal",
  moderate: "watch",
  high: "abnormal",
}

export interface MorseResult {
  items: { item: MorseItem; points: number | null }[]
  /** 0–125, or `null` until every item is answered. */
  total: number | null
  partialTotal: number
  missing: MorseItem[]
  complete: boolean
  risk: MorseRisk | null
}

export function morseRisk(total: number, thresholds: MorseThresholds = DEFAULT_MORSE_THRESHOLDS): MorseRisk {
  if (total >= thresholds.high) return "high"
  if (total >= thresholds.moderate) return "moderate"
  return "low"
}

export function scoreMorse(answers: MorseAnswers, thresholds: MorseThresholds = DEFAULT_MORSE_THRESHOLDS): MorseResult {
  const items = MORSE_ITEMS.map((def) => ({
    item: def.item,
    points: def.options.find((o) => o.value === answers[def.item])?.points ?? null,
  }))
  const missing = items.filter((i) => i.points === null).map((i) => i.item)
  const partialTotal = items.reduce((sum, i) => sum + (i.points ?? 0), 0)
  const complete = missing.length === 0
  const total = complete ? partialTotal : null
  return { items, total, partialTotal, missing, complete, risk: total === null ? null : morseRisk(total, thresholds) }
}

// ───────────────────────────── Component ─────────────────────────────

export interface FallRiskScoreProps extends Omit<React.ComponentProps<"div">, "defaultValue" | "onChange"> {
  value?: MorseAnswers
  defaultValue?: MorseAnswers
  onValueChange?: (value: MorseAnswers) => void
  /** Local cut-offs. Institutions calibrate these; defaults are 25 (moderate) and 45 (high). */
  thresholds?: MorseThresholds
  /** Interventions to show as a checklist for the current risk level. */
  interventions?: Partial<Record<MorseRisk, string[]>>
  /** Controlled list of completed interventions. */
  completedInterventions?: string[]
  onCompletedInterventionsChange?: (completed: string[]) => void
  disabled?: boolean
}

export function FallRiskScore({
  value: valueProp,
  defaultValue = {},
  onValueChange,
  thresholds = DEFAULT_MORSE_THRESHOLDS,
  interventions,
  completedInterventions,
  onCompletedInterventionsChange,
  disabled = false,
  className,
  ...props
}: FallRiskScoreProps) {
  const id = React.useId()
  const [uncontrolled, setUncontrolled] = React.useState<MorseAnswers>(defaultValue)
  const [uncontrolledDone, setUncontrolledDone] = React.useState<string[]>([])
  const value = valueProp ?? uncontrolled
  const done = completedInterventions ?? uncontrolledDone
  const result = scoreMorse(value, thresholds)
  const checklist = result.risk ? (interventions?.[result.risk] ?? []) : []

  const set = (item: MorseItem, answer: string) => {
    const next = { ...value, [item]: answer }
    if (valueProp === undefined) setUncontrolled(next)
    onValueChange?.(next)
  }

  const toggle = (intervention: string, checked: boolean) => {
    const next = checked ? [...done, intervention] : done.filter((d) => d !== intervention)
    if (completedInterventions === undefined) setUncontrolledDone(next)
    onCompletedInterventionsChange?.(next)
  }

  return (
    <div data-slot="fall-risk-score" className={cn("flex w-full flex-col gap-5", className)} {...props}>
      <div className="grid gap-5 sm:grid-cols-2">
        {MORSE_ITEMS.map((def, index) => {
          const points = result.items[index].points
          return (
            <FieldSet key={def.item} disabled={disabled}>
              <FieldLegend variant="label" className="flex w-full items-baseline justify-between gap-2">
                <span>
                  {def.label}
                  <span className="block text-xs font-normal text-muted-foreground">{def.description}</span>
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">{points ?? "–"} pts</span>
              </FieldLegend>
              <RadioGroup
                value={value[def.item] ?? ""}
                onValueChange={(next) => set(def.item, next)}
                disabled={disabled}
                aria-label={def.label}
                className="gap-1.5"
              >
                {def.options.map((option) => {
                  const optionId = `${id}-${def.item}-${option.value}`
                  return (
                    <FieldLabel key={option.value} htmlFor={optionId}>
                      <Field orientation="horizontal" className="gap-3">
                        <RadioGroupItem value={option.value} id={optionId} />
                        <FieldContent>
                          <FieldTitle className="w-full justify-between">
                            {option.label}
                            <span className="text-xs font-normal text-muted-foreground tabular-nums">
                              {option.points}
                            </span>
                          </FieldTitle>
                        </FieldContent>
                      </Field>
                    </FieldLabel>
                  )
                })}
              </RadioGroup>
            </FieldSet>
          )
        })}
      </div>

      <div
        aria-live="polite"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/60 px-4 py-3"
      >
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Morse Fall Scale</span>
          <span className="text-lg font-semibold tabular-nums">
            {result.total ?? "—"}
            <span className="ml-1 text-xs font-normal text-muted-foreground">/ 125</span>
          </span>
          {!result.complete && (
            <span className="text-xs text-muted-foreground">
              {result.missing.length} of 6 items unanswered
              {result.partialTotal > 0 && ` · ${result.partialTotal} so far`}
            </span>
          )}
        </div>
        {result.risk ? (
          <ClinicalStatusBadge status={MORSE_RISK_STATUS[result.risk]}>{MORSE_RISK_LABELS[result.risk]}</ClinicalStatusBadge>
        ) : (
          <ClinicalStatusBadge status="unknown">Incomplete</ClinicalStatusBadge>
        )}
      </div>

      {result.risk && checklist.length > 0 && (
        <FieldSet>
          <FieldLegend variant="label">Interventions · {MORSE_RISK_LABELS[result.risk].toLowerCase()}</FieldLegend>
          <div className="flex flex-col gap-2">
            {checklist.map((intervention, index) => {
              const checkboxId = `${id}-intervention-${index}`
              return (
                <Field key={intervention} orientation="horizontal">
                  <Checkbox
                    id={checkboxId}
                    checked={done.includes(intervention)}
                    onCheckedChange={(checked) => toggle(intervention, checked === true)}
                  />
                  <FieldLabel htmlFor={checkboxId} className="font-normal">
                    {intervention}
                  </FieldLabel>
                </Field>
              )
            })}
          </div>
        </FieldSet>
      )}
    </div>
  )
}

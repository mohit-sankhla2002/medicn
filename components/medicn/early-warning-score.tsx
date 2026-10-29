"use client"

import * as React from "react"
import { TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"
import type { VitalsFormValues } from "@/components/medicn/vitals-form"

// ───────────────────────────── Scoring ─────────────────────────────
// Source: Royal College of Physicians. National Early Warning Score (NEWS) 2, 2017.
// Chart 1 (scoring), Chart 2 (thresholds and triggers), Chart 4 (clinical response).

/** ACVPU: Alert, new Confusion, responds to Voice, responds to Pain, Unresponsive. */
export type Consciousness = "A" | "C" | "V" | "P" | "U"

export const CONSCIOUSNESS_LABELS: Record<Consciousness, string> = {
  A: "Alert",
  C: "New confusion",
  V: "Responds to voice",
  P: "Responds to pain",
  U: "Unresponsive",
}

export interface News2Input {
  /** Breaths per minute. */
  respiratoryRate: number
  /** Peripheral oxygen saturation, %. */
  spo2: number
  /**
   * SpO₂ scale. Use Scale 2 only for patients with confirmed hypercapnic respiratory failure
   * and a prescribed target range of 88–92%, as decided and documented by a competent clinician.
   */
  spo2Scale: 1 | 2
  /** On supplemental oxygen (any device) at the time of the observation. */
  supplementalOxygen: boolean
  /** Systolic blood pressure, mmHg. */
  systolic: number
  /** Pulse, beats per minute. */
  pulse: number
  consciousness: Consciousness
  /** Temperature in °C. */
  temperature: number
}

export type News2Parameter =
  | "respiratoryRate"
  | "spo2"
  | "supplementalOxygen"
  | "systolic"
  | "pulse"
  | "consciousness"
  | "temperature"

export type News2Risk = "low" | "low-medium" | "medium" | "high"

export interface News2ParameterResult {
  parameter: News2Parameter
  label: string
  /** Human-readable observation, e.g. "22 /min". `undefined` when missing. */
  display?: string
  /** 0–3, or `null` when the parameter is missing. */
  score: number | null
}

export interface News2Response {
  /** Minimum monitoring frequency from RCP Chart 4. */
  frequency: string
  /** Response wording from RCP Chart 2. */
  response: string
  /** Clinical response bullets from RCP Chart 4. */
  actions: string[]
}

export interface News2Result {
  parameters: News2ParameterResult[]
  /** Aggregate score (0–20), or `null` when any parameter is missing. */
  total: number | null
  /** Sum of the parameters that are present. */
  partialTotal: number
  /** True when any single parameter scores 3 (a "red score"). */
  redScore: boolean
  redParameters: News2Parameter[]
  /** Clinical risk, or `null` when incomplete. */
  risk: News2Risk | null
  response: News2Response | null
  missing: News2Parameter[]
  complete: boolean
  spo2Scale: 1 | 2
}

export const NEWS2_PARAMETER_LABELS: Record<News2Parameter, string> = {
  respiratoryRate: "Respiration rate",
  spo2: "SpO₂",
  supplementalOxygen: "Air or oxygen",
  systolic: "Systolic blood pressure",
  pulse: "Pulse",
  consciousness: "Consciousness",
  temperature: "Temperature",
}

export const NEWS2_RISK_LABELS: Record<News2Risk, string> = {
  low: "Low",
  "low-medium": "Low–medium",
  medium: "Medium",
  high: "High",
}

export const NEWS2_RISK_STATUS: Record<News2Risk, ClinicalStatus> = {
  low: "normal",
  "low-medium": "watch",
  medium: "abnormal",
  high: "critical",
}

const isNum = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value)

/**
 * Banded lookup. `bands` are `[upperInclusive, score]` pairs in ascending order;
 * values above the last band get `above`. Upper bounds use the chart's printed limits so
 * that decimals between bands (e.g. 36.05 °C) fall into the next band up, as on paper.
 */
function band(value: number, bands: [number, number][], above: number) {
  for (const [upper, score] of bands) if (value <= upper) return score
  return above
}

export const scoreRespiratoryRate = (rr: number) =>
  band(rr, [[8, 3], [11, 1], [20, 0], [24, 2]], 3)

export function scoreSpo2(spo2: number, scale: 1 | 2, supplementalOxygen?: boolean): number | null {
  if (scale === 1) return band(spo2, [[91, 3], [93, 2], [95, 1]], 0)
  // Scale 2: ≤83 → 3, 84–85 → 2, 86–87 → 1, 88–92 → 0.
  if (spo2 <= 92) return band(spo2, [[83, 3], [85, 2], [87, 1]], 0)
  // ≥93: scores 0 on air; on oxygen 93–94 → 1, 95–96 → 2, ≥97 → 3.
  if (supplementalOxygen === undefined) return null
  if (!supplementalOxygen) return 0
  return band(spo2, [[94, 1], [96, 2]], 3)
}

export const scoreSupplementalOxygen = (onOxygen: boolean) => (onOxygen ? 2 : 0)

export const scoreSystolic = (sbp: number) => band(sbp, [[90, 3], [100, 2], [110, 1], [219, 0]], 3)

export const scorePulse = (pulse: number) => band(pulse, [[40, 3], [50, 1], [90, 0], [110, 1], [130, 2]], 3)

export const scoreConsciousness = (acvpu: Consciousness) => (acvpu === "A" ? 0 : 3)

export const scoreTemperature = (celsius: number) => band(celsius, [[35.0, 3], [36.0, 1], [38.0, 0], [39.0, 1]], 2)

const RESPONSES: Record<"zero" | "low" | "red" | "medium" | "high", News2Response> = {
  zero: {
    frequency: "Minimum 12-hourly",
    response: "Ward-based response",
    actions: ["Continue routine NEWS monitoring."],
  },
  low: {
    frequency: "Minimum 4–6-hourly",
    response: "Ward-based response",
    actions: [
      "Inform registered nurse, who must assess the patient.",
      "Registered nurse decides whether increased frequency of monitoring and/or escalation of care is required.",
    ],
  },
  red: {
    frequency: "Minimum 1-hourly",
    response: "Urgent ward-based response",
    actions: [
      "Registered nurse to inform the medical team caring for the patient, who will review and decide whether escalation of care is necessary.",
    ],
  },
  medium: {
    frequency: "Minimum 1-hourly",
    response: "Key threshold for urgent response",
    actions: [
      "Registered nurse to immediately inform the medical team caring for the patient.",
      "Registered nurse to request urgent assessment by a clinician or team with core competencies in the care of acutely ill patients.",
      "Provide clinical care in an environment with monitoring facilities.",
    ],
  },
  high: {
    frequency: "Continuous monitoring of vital signs",
    response: "Urgent or emergency response",
    actions: [
      "Registered nurse to immediately inform the medical team caring for the patient – this should be at least at specialist registrar level.",
      "Emergency assessment by a team with critical care competencies, including practitioner(s) with advanced airway management skills.",
      "Consider transfer of care to a level 2 or 3 clinical care facility, ie higher-dependency unit or ICU.",
      "Clinical care in an environment with monitoring facilities.",
    ],
  },
}

const fmt = (value: number, digits = 0) =>
  value.toLocaleString("en-GB", { maximumFractionDigits: digits, minimumFractionDigits: 0 })

/**
 * Calculates NEWS2. Every field is optional so partially-entered observations can be scored;
 * the aggregate, risk and response are only returned when all seven parameters are present.
 */
export function calculateNews2(input: Partial<News2Input>): News2Result {
  const scale: 1 | 2 = input.spo2Scale === 2 ? 2 : 1
  const o2 = typeof input.supplementalOxygen === "boolean" ? input.supplementalOxygen : undefined

  const parameters: News2ParameterResult[] = [
    {
      parameter: "respiratoryRate",
      label: NEWS2_PARAMETER_LABELS.respiratoryRate,
      display: isNum(input.respiratoryRate) ? `${fmt(input.respiratoryRate)} /min` : undefined,
      score: isNum(input.respiratoryRate) ? scoreRespiratoryRate(input.respiratoryRate) : null,
    },
    {
      parameter: "spo2",
      label: `${NEWS2_PARAMETER_LABELS.spo2} (Scale ${scale})`,
      display: isNum(input.spo2) ? `${fmt(input.spo2)}%` : undefined,
      score: isNum(input.spo2) ? scoreSpo2(input.spo2, scale, o2) : null,
    },
    {
      parameter: "supplementalOxygen",
      label: NEWS2_PARAMETER_LABELS.supplementalOxygen,
      display: o2 === undefined ? undefined : o2 ? "Oxygen" : "Air",
      score: o2 === undefined ? null : scoreSupplementalOxygen(o2),
    },
    {
      parameter: "systolic",
      label: NEWS2_PARAMETER_LABELS.systolic,
      display: isNum(input.systolic) ? `${fmt(input.systolic)} mmHg` : undefined,
      score: isNum(input.systolic) ? scoreSystolic(input.systolic) : null,
    },
    {
      parameter: "pulse",
      label: NEWS2_PARAMETER_LABELS.pulse,
      display: isNum(input.pulse) ? `${fmt(input.pulse)} /min` : undefined,
      score: isNum(input.pulse) ? scorePulse(input.pulse) : null,
    },
    {
      parameter: "consciousness",
      label: NEWS2_PARAMETER_LABELS.consciousness,
      display: input.consciousness ? `${input.consciousness} · ${CONSCIOUSNESS_LABELS[input.consciousness]}` : undefined,
      score: input.consciousness ? scoreConsciousness(input.consciousness) : null,
    },
    {
      parameter: "temperature",
      label: NEWS2_PARAMETER_LABELS.temperature,
      display: isNum(input.temperature) ? `${fmt(input.temperature, 1)} °C` : undefined,
      score: isNum(input.temperature) ? scoreTemperature(input.temperature) : null,
    },
  ]

  const missing = parameters.filter((p) => p.score === null).map((p) => p.parameter)
  const partialTotal = parameters.reduce((sum, p) => sum + (p.score ?? 0), 0)
  const redParameters = parameters.filter((p) => p.score === 3).map((p) => p.parameter)
  const redScore = redParameters.length > 0
  const complete = missing.length === 0
  const total = complete ? partialTotal : null

  let risk: News2Risk | null = null
  let response: News2Response | null = null
  if (total !== null) {
    if (total >= 7) {
      risk = "high"
      response = RESPONSES.high
    } else if (total >= 5) {
      risk = "medium"
      response = RESPONSES.medium
    } else if (redScore) {
      risk = "low-medium"
      response = RESPONSES.red
    } else {
      risk = "low"
      response = total === 0 ? RESPONSES.zero : RESPONSES.low
    }
  }

  return { parameters, total, partialTotal, redScore, redParameters, risk, response, missing, complete, spo2Scale: scale }
}

/** Assessment fields that the vitals form does not capture. */
export interface News2Extra {
  spo2Scale?: 1 | 2
  supplementalOxygen?: boolean
  consciousness?: Consciousness
}

/** Maps `VitalsFormValues` (metric, °C) onto NEWS2 input. `heartRate` becomes `pulse`. */
export function toNews2Input(vitals: VitalsFormValues, extra: News2Extra = {}): Partial<News2Input> {
  const clean = (value?: number) => (isNum(value) ? value : undefined)
  return {
    respiratoryRate: clean(vitals.respiratoryRate),
    spo2: clean(vitals.spo2),
    systolic: clean(vitals.systolic),
    pulse: clean(vitals.heartRate),
    temperature: clean(vitals.temperature),
    spo2Scale: extra.spo2Scale ?? 1,
    supplementalOxygen: extra.supplementalOxygen,
    consciousness: extra.consciousness,
  }
}

// ───────────────────────────── Component ─────────────────────────────

const subScoreClasses: Record<number, string> = {
  0: "border-border bg-background text-muted-foreground",
  1: "border-clinical-watch/40 bg-clinical-watch/15 text-clinical-watch-foreground",
  2: "border-clinical-abnormal/40 bg-clinical-abnormal/15 text-clinical-abnormal-foreground",
  3: "border-clinical-critical/50 bg-clinical-critical/15 text-clinical-critical-foreground",
}

const totalClasses: Record<News2Risk | "incomplete", string> = {
  low: "border-clinical-normal/30 bg-clinical-normal/10 text-clinical-normal-foreground",
  "low-medium": "border-clinical-watch/40 bg-clinical-watch/10 text-clinical-watch-foreground",
  medium: "border-clinical-abnormal/40 bg-clinical-abnormal/10 text-clinical-abnormal-foreground",
  high: "border-clinical-critical/50 bg-clinical-critical/10 text-clinical-critical-foreground",
  incomplete: "border-dashed border-border bg-muted/40 text-muted-foreground",
}

export interface EarlyWarningScoreProps extends Omit<React.ComponentProps<"div">, "children" | "title"> {
  /** NEWS2 input. Takes precedence over `vitals` for any field it sets. */
  values?: Partial<News2Input>
  /** Vitals from `VitalsForm` (metric). Combined with the assessment fields below. */
  vitals?: VitalsFormValues
  /** Render controls for SpO₂ scale, air/oxygen and ACVPU. */
  editable?: boolean
  /** Initial assessment fields used when `editable` (falls back to `values`). */
  defaultExtra?: News2Extra
  /** Called when an editable control changes. */
  onExtraChange?: (extra: News2Extra) => void
  title?: React.ReactNode
  /** Hide the per-parameter breakdown table. */
  hideBreakdown?: boolean
}

export function EarlyWarningScore({
  values,
  vitals,
  editable = false,
  defaultExtra,
  onExtraChange,
  title = "NEWS2",
  hideBreakdown = false,
  className,
  ...props
}: EarlyWarningScoreProps) {
  const id = React.useId()
  const [extra, setExtra] = React.useState<News2Extra>(() => ({
    spo2Scale: defaultExtra?.spo2Scale ?? values?.spo2Scale ?? 1,
    supplementalOxygen: defaultExtra?.supplementalOxygen ?? values?.supplementalOxygen,
    consciousness: defaultExtra?.consciousness ?? values?.consciousness,
  }))

  const update = (patch: News2Extra) => {
    const next = { ...extra, ...patch }
    setExtra(next)
    onExtraChange?.(next)
  }

  const input = React.useMemo<Partial<News2Input>>(() => {
    const base = vitals ? toNews2Input(vitals) : {}
    const defined = Object.fromEntries(
      Object.entries(values ?? {}).filter(([, v]) => v !== undefined)
    ) as Partial<News2Input>
    const merged = { ...base, ...defined }
    return editable ? { ...merged, ...extra } : merged
  }, [vitals, values, editable, extra])

  const result = React.useMemo(() => calculateNews2(input), [input])
  const tone = result.risk ?? "incomplete"

  return (
    <Card data-slot="early-warning-score" className={cn("w-full", className)} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>National Early Warning Score 2 · adults (16+)</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div
          aria-live="polite"
          className={cn("flex flex-wrap items-center gap-4 rounded-lg border px-4 py-3", totalClasses[tone])}
        >
          <div className="flex flex-col">
            <span className="text-xs font-medium opacity-80">Aggregate score</span>
            <span className="text-3xl leading-none font-semibold tabular-nums">
              {result.total ?? "—"}
              {result.total === null && result.partialTotal > 0 && (
                <span className="ml-2 text-sm font-normal">({result.partialTotal} so far)</span>
              )}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {result.risk ? (
              <ClinicalStatusBadge status={NEWS2_RISK_STATUS[result.risk]}>
                {NEWS2_RISK_LABELS[result.risk]} clinical risk
              </ClinicalStatusBadge>
            ) : (
              <ClinicalStatusBadge status="unknown">Incomplete</ClinicalStatusBadge>
            )}
            <span className="text-sm text-foreground">
              {result.response
                ? `${result.response.response} · ${result.response.frequency}`
                : `Missing: ${result.missing.map((p) => NEWS2_PARAMETER_LABELS[p]).join(", ")}`}
            </span>
          </div>
        </div>

        {result.redScore && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-clinical-critical/40 bg-clinical-critical/10 px-3 py-2 text-sm text-clinical-critical-foreground"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Red score: {result.redParameters.map((p) => NEWS2_PARAMETER_LABELS[p]).join(", ")} scored 3. A score of 3
              in any single parameter needs an urgent ward-based response.
            </span>
          </div>
        )}

        {editable && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel id={`${id}-scale`}>SpO₂ scale</FieldLabel>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={String(extra.spo2Scale ?? 1)}
                onValueChange={(value) => value && update({ spo2Scale: value === "2" ? 2 : 1 })}
                aria-labelledby={`${id}-scale`}
              >
                <ToggleGroupItem value="1" className="flex-1">
                  Scale 1
                </ToggleGroupItem>
                <ToggleGroupItem value="2" className="flex-1">
                  Scale 2
                </ToggleGroupItem>
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-o2`}>On supplemental oxygen</FieldLabel>
              <div className="flex h-8 items-center gap-2 text-sm">
                <Switch
                  id={`${id}-o2`}
                  checked={extra.supplementalOxygen === true}
                  onCheckedChange={(checked) => update({ supplementalOxygen: checked })}
                />
                <span className="text-muted-foreground">
                  {extra.supplementalOxygen === undefined ? "Not recorded" : extra.supplementalOxygen ? "Oxygen" : "Air"}
                </span>
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-acvpu`}>Consciousness (ACVPU)</FieldLabel>
              <Select
                value={extra.consciousness ?? ""}
                onValueChange={(value) => update({ consciousness: value as Consciousness })}
              >
                <SelectTrigger id={`${id}-acvpu`} className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CONSCIOUSNESS_LABELS) as Consciousness[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {key} · {CONSCIOUSNESS_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {extra.spo2Scale === 2 && (
              <p className="text-xs text-muted-foreground sm:col-span-3">
                Scale 2 is only for confirmed hypercapnic respiratory failure with a prescribed target of 88–92%, as
                decided and documented by a competent clinician.
              </p>
            )}
          </div>
        )}

        {!hideBreakdown && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parameter</TableHead>
                <TableHead>Observation</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.parameters.map((p) => (
                <TableRow key={p.parameter}>
                  <TableCell className="font-medium whitespace-normal">{p.label}</TableCell>
                  <TableCell className="whitespace-normal tabular-nums">
                    {p.display ?? <span className="text-muted-foreground">Not recorded</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.score === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex size-6 items-center justify-center rounded-md border text-xs font-semibold tabular-nums",
                          subScoreClasses[p.score]
                        )}
                      >
                        {p.score}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {result.response ? (
          <div className="flex flex-col gap-2 rounded-lg bg-muted/60 px-4 py-3 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium">{result.response.response}</span>
              <span className="text-xs text-muted-foreground">Monitoring: {result.response.frequency}</span>
            </div>
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
              {result.response.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">Follow your local escalation policy where it differs.</p>
          </div>
        ) : (
          <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
            Record all seven parameters to calculate the aggregate score and clinical response.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

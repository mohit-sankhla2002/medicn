"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"
import { classifyBloodPressure, classifyVital } from "@/components/medicn/vital-signs"

/** All values are normalized to metric units (°C, kg, cm). */
export interface VitalsFormValues {
  systolic?: number
  diastolic?: number
  heartRate?: number
  respiratoryRate?: number
  temperature?: number
  spo2?: number
  weight?: number
  height?: number
  bmi?: number
}

type UnitSystem = "metric" | "imperial"
type FieldKey = "systolic" | "diastolic" | "heartRate" | "respiratoryRate" | "temperature" | "spo2" | "weight" | "height"

// Physiologically plausible input limits (metric). Values outside are treated as entry errors.
const LIMITS: Record<FieldKey, [number, number]> = {
  systolic: [40, 300],
  diastolic: [20, 200],
  heartRate: [20, 250],
  respiratoryRate: [4, 70],
  temperature: [30, 45],
  spo2: [50, 100],
  weight: [0.5, 400],
  height: [30, 250],
}

const toMetric = {
  temperature: (f: number) => ((f - 32) * 5) / 9,
  weight: (lb: number) => lb * 0.45359237,
  height: (inch: number) => inch * 2.54,
}

const round = (value: number, digits = 1) => Math.round(value * 10 ** digits) / 10 ** digits

export function calculateBmi(weightKg?: number, heightCm?: number) {
  if (!weightKg || !heightCm) return undefined
  return round(weightKg / (heightCm / 100) ** 2)
}

export interface VitalsFormProps extends Omit<React.ComponentProps<"form">, "onSubmit" | "onChange"> {
  defaultUnits?: UnitSystem
  onSubmit?: (values: VitalsFormValues) => void
  onValuesChange?: (values: VitalsFormValues) => void
  submitLabel?: string
  /** Render without the submit button (e.g. when embedded in a larger form). */
  hideSubmit?: boolean
}

export function VitalsForm({
  defaultUnits = "metric",
  onSubmit,
  onValuesChange,
  submitLabel = "Save vitals",
  hideSubmit = false,
  className,
  ...props
}: VitalsFormProps) {
  const id = React.useId()
  const [units, setUnits] = React.useState<UnitSystem>(defaultUnits)
  const [raw, setRaw] = React.useState<Partial<Record<FieldKey, string>>>({})
  const [touched, setTouched] = React.useState<Partial<Record<FieldKey, boolean>>>({})

  const metric = React.useMemo(() => {
    const parse = (key: FieldKey) => {
      const text = raw[key]
      if (text == null || text.trim() === "") return undefined
      const n = Number(text)
      if (Number.isNaN(n)) return NaN
      if (units === "imperial" && (key === "temperature" || key === "weight" || key === "height")) {
        return round(toMetric[key](n))
      }
      return n
    }
    const values = Object.fromEntries(
      (Object.keys(LIMITS) as FieldKey[]).map((key) => [key, parse(key)])
    ) as Record<FieldKey, number | undefined>
    return { ...values, bmi: calculateBmi(values.weight, values.height) } as VitalsFormValues
  }, [raw, units])

  const errors = React.useMemo(() => {
    const result: Partial<Record<FieldKey, string>> = {}
    for (const key of Object.keys(LIMITS) as FieldKey[]) {
      const value = metric[key]
      if (value === undefined) continue
      const [min, max] = LIMITS[key]
      if (Number.isNaN(value) || value < min || value > max) result[key] = "Check this value"
    }
    if (metric.systolic && metric.diastolic && metric.diastolic >= metric.systolic) {
      result.diastolic = "Diastolic must be lower than systolic"
    }
    return result
  }, [metric])

  React.useEffect(() => {
    onValuesChange?.(metric)
  }, [metric, onValuesChange])

  const update = (key: FieldKey) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setRaw((prev) => ({ ...prev, [key]: event.target.value }))
  const blur = (key: FieldKey) => () => setTouched((prev) => ({ ...prev, [key]: true }))

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouched(Object.fromEntries(Object.keys(LIMITS).map((k) => [k, true])))
    if (Object.keys(errors).length > 0) return
    onSubmit?.(metric)
  }

  const statusFor = (key: FieldKey | "bp" | "bmi"): ClinicalStatus => {
    if (key === "bp") return classifyBloodPressure(metric.systolic, metric.diastolic)
    if (key === "bmi") return classifyVital("bmi", metric.bmi)
    if (key === "systolic" || key === "diastolic" || key === "weight" || key === "height") return "unknown"
    return classifyVital(key, metric[key])
  }

  const input = (key: FieldKey, unit: string, extra?: React.ComponentProps<"input">) => {
    const invalid = Boolean(touched[key] && errors[key])
    return (
      <div className="relative">
        <Input
          id={`${id}-${key}`}
          inputMode="decimal"
          autoComplete="off"
          value={raw[key] ?? ""}
          onChange={update(key)}
          onBlur={blur(key)}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${id}-${key}-error` : undefined}
          className="pr-14 tabular-nums"
          {...extra}
        />
        <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted-foreground">
          {unit}
        </span>
      </div>
    )
  }

  const error = (key: FieldKey) =>
    touched[key] && errors[key] ? <FieldError id={`${id}-${key}-error`}>{errors[key]}</FieldError> : null

  const header = (key: FieldKey | "bp" | "bmi", label: string, htmlFor?: string) => {
    const status = statusFor(key)
    return (
      <div className="flex min-h-5 items-center justify-between gap-2">
        <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
        {status !== "unknown" && <ClinicalStatusBadge status={status} />}
      </div>
    )
  }

  const imperial = units === "imperial"

  return (
    <form
      data-slot="vitals-form"
      noValidate
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Status updates as you type using adult reference ranges.</p>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={units}
          onValueChange={(value) => value && setUnits(value as UnitSystem)}
          aria-label="Unit system"
        >
          <ToggleGroupItem value="metric">Metric</ToggleGroupItem>
          <ToggleGroupItem value="imperial">Imperial</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          {header("bp", "Blood pressure", `${id}-systolic`)}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            {input("systolic", "sys", { placeholder: "120", "aria-label": "Systolic" })}
            <span className="text-muted-foreground" aria-hidden>
              /
            </span>
            {input("diastolic", "dia", { placeholder: "80", "aria-label": "Diastolic" })}
          </div>
          <FieldDescription>mmHg · seated, after 5 minutes rest</FieldDescription>
          {error("systolic") ?? error("diastolic")}
        </Field>

        <Field>
          {header("heartRate", "Heart rate", `${id}-heartRate`)}
          {input("heartRate", "bpm", { placeholder: "72" })}
          {error("heartRate")}
        </Field>
        <Field>
          {header("respiratoryRate", "Respiratory rate", `${id}-respiratoryRate`)}
          {input("respiratoryRate", "/min", { placeholder: "16" })}
          {error("respiratoryRate")}
        </Field>
        <Field>
          {header("temperature", "Temperature", `${id}-temperature`)}
          {input("temperature", imperial ? "°F" : "°C", { placeholder: imperial ? "98.6" : "37.0" })}
          {error("temperature")}
        </Field>
        <Field>
          {header("spo2", "SpO₂", `${id}-spo2`)}
          {input("spo2", "%", { placeholder: "98" })}
          {error("spo2")}
        </Field>
        <Field>
          {header("weight", "Weight", `${id}-weight`)}
          {input("weight", imperial ? "lb" : "kg", { placeholder: imperial ? "154" : "70" })}
          {error("weight")}
        </Field>
        <Field>
          {header("height", "Height", `${id}-height`)}
          {input("height", imperial ? "in" : "cm", { placeholder: imperial ? "68" : "172" })}
          {error("height")}
        </Field>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-4 py-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Calculated BMI</span>
          <span className="text-lg font-semibold tabular-nums">
            {metric.bmi ?? "—"} <span className="text-xs font-normal text-muted-foreground">kg/m²</span>
          </span>
        </div>
        {metric.bmi !== undefined && <ClinicalStatusBadge status={statusFor("bmi")} />}
      </div>

      {!hideSubmit && (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setRaw({})
              setTouched({})
            }}
          >
            Clear
          </Button>
          <Button type="submit">{submitLabel}</Button>
        </div>
      )}
    </form>
  )
}

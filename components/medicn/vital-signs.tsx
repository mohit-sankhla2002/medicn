import * as React from "react"
import { Activity, Droplets, Gauge, HeartPulse, Scale, Thermometer, Wind } from "lucide-react"

import { cn } from "@/lib/utils"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"

export type VitalType =
  | "bloodPressure"
  | "heartRate"
  | "respiratoryRate"
  | "temperature"
  | "spo2"
  | "bmi"
  | "glucose"

type Band = { status: ClinicalStatus; test: (value: number) => boolean }

export interface VitalDefinition {
  label: string
  shortLabel: string
  unit: string
  icon: React.ComponentType<{ className?: string }>
  /** Human-readable adult reference range. */
  range: string
  /** Ordered from most to least severe; first match wins. */
  bands: Band[]
}

/**
 * Default adult reference ranges for screening display.
 * These are generic defaults, not clinical decision support — override via `classify` for your protocol.
 */
export const VITAL_DEFINITIONS: Record<VitalType, VitalDefinition> = {
  bloodPressure: {
    label: "Blood pressure",
    shortLabel: "BP",
    unit: "mmHg",
    icon: Gauge,
    range: "90–119 / <80",
    bands: [], // classified by classifyBloodPressure
  },
  heartRate: {
    label: "Heart rate",
    shortLabel: "HR",
    unit: "bpm",
    icon: HeartPulse,
    range: "60–100",
    bands: [
      { status: "critical", test: (v) => v < 40 || v > 130 },
      { status: "abnormal", test: (v) => v < 50 || v > 110 },
      { status: "watch", test: (v) => v < 60 || v > 100 },
      { status: "normal", test: () => true },
    ],
  },
  respiratoryRate: {
    label: "Respiratory rate",
    shortLabel: "RR",
    unit: "/min",
    icon: Wind,
    range: "12–20",
    bands: [
      { status: "critical", test: (v) => v < 8 || v > 30 },
      { status: "abnormal", test: (v) => v < 10 || v > 24 },
      { status: "watch", test: (v) => v < 12 || v > 20 },
      { status: "normal", test: () => true },
    ],
  },
  temperature: {
    label: "Temperature",
    shortLabel: "Temp",
    unit: "°C",
    icon: Thermometer,
    range: "36.0–37.4",
    bands: [
      { status: "critical", test: (v) => v < 35 || v >= 40 },
      { status: "abnormal", test: (v) => v < 36 || v > 38 },
      { status: "watch", test: (v) => v >= 37.5 },
      { status: "normal", test: () => true },
    ],
  },
  spo2: {
    label: "Oxygen saturation",
    shortLabel: "SpO₂",
    unit: "%",
    icon: Droplets,
    range: "≥95",
    bands: [
      { status: "critical", test: (v) => v < 88 },
      { status: "abnormal", test: (v) => v < 92 },
      { status: "watch", test: (v) => v < 95 },
      { status: "normal", test: () => true },
    ],
  },
  bmi: {
    label: "Body mass index",
    shortLabel: "BMI",
    unit: "kg/m²",
    icon: Scale,
    range: "18.5–24.9",
    bands: [
      { status: "critical", test: (v) => v < 16 || v >= 40 },
      { status: "abnormal", test: (v) => v < 18.5 || v >= 30 },
      { status: "watch", test: (v) => v >= 25 },
      { status: "normal", test: () => true },
    ],
  },
  glucose: {
    label: "Blood glucose",
    shortLabel: "Glucose",
    unit: "mg/dL",
    icon: Activity,
    range: "70–99 fasting",
    bands: [
      { status: "critical", test: (v) => v < 54 || v > 400 },
      { status: "abnormal", test: (v) => v < 70 || v > 180 },
      { status: "watch", test: (v) => v >= 100 },
      { status: "normal", test: () => true },
    ],
  },
}

const severity: ClinicalStatus[] = ["unknown", "info", "normal", "watch", "abnormal", "critical"]

export function worstStatus(...statuses: ClinicalStatus[]): ClinicalStatus {
  return statuses.reduce((worst, s) => (severity.indexOf(s) > severity.indexOf(worst) ? s : worst), "unknown")
}

export function classifyBloodPressure(systolic?: number, diastolic?: number): ClinicalStatus {
  const sys: ClinicalStatus =
    systolic == null || Number.isNaN(systolic)
      ? "unknown"
      : systolic >= 180 || systolic < 80
        ? "critical"
        : systolic >= 140 || systolic < 90
          ? "abnormal"
          : systolic >= 120
            ? "watch"
            : "normal"
  const dia: ClinicalStatus =
    diastolic == null || Number.isNaN(diastolic)
      ? "unknown"
      : diastolic >= 120
        ? "critical"
        : diastolic >= 90 || diastolic < 50
          ? "abnormal"
          : diastolic >= 80
            ? "watch"
            : "normal"
  return worstStatus(sys, dia)
}

/** Classify a single numeric vital against the default adult bands. */
export function classifyVital(type: Exclude<VitalType, "bloodPressure">, value?: number | null): ClinicalStatus {
  if (value == null || Number.isNaN(value)) return "unknown"
  return VITAL_DEFINITIONS[type].bands.find((band) => band.test(value))?.status ?? "unknown"
}

export interface VitalReading {
  type: VitalType
  /** Numeric value. For blood pressure, use `systolic` / `diastolic` instead. */
  value?: number
  systolic?: number
  diastolic?: number
  /** Older → newer values for the sparkline. For blood pressure, systolic values. */
  history?: number[]
  /** Pre-formatted timestamp, e.g. "Today, 09:42". */
  recordedAt?: string
  /** Override the computed status. */
  status?: ClinicalStatus
}

export function getVitalStatus(reading: VitalReading): ClinicalStatus {
  if (reading.status) return reading.status
  if (reading.type === "bloodPressure") return classifyBloodPressure(reading.systolic, reading.diastolic)
  return classifyVital(reading.type, reading.value)
}

const sparkStroke: Record<ClinicalStatus, string> = {
  normal: "stroke-clinical-normal",
  watch: "stroke-clinical-watch",
  abnormal: "stroke-clinical-abnormal",
  critical: "stroke-clinical-critical",
  info: "stroke-clinical-info",
  unknown: "stroke-muted-foreground",
}

export function Sparkline({
  values,
  status = "unknown",
  className,
}: {
  values: number[]
  status?: ClinicalStatus
  className?: string
}) {
  if (values.length < 2) return null
  const width = 100
  const height = 28
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values.map((v, i) => [
    (i / (values.length - 1)) * width,
    height - 3 - ((v - min) / span) * (height - 6),
  ])
  const d = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")
  const [lastX, lastY] = points[points.length - 1]
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
      className={cn("h-7 w-full overflow-visible", className)}
    >
      <path
        d={d}
        fill="none"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className={sparkStroke[status]}
      />
      <circle cx={lastX} cy={lastY} r={2.5} className={cn("fill-background", sparkStroke[status])} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function formatValue(reading: VitalReading) {
  if (reading.type === "bloodPressure") {
    return `${reading.systolic ?? "—"}/${reading.diastolic ?? "—"}`
  }
  return reading.value ?? "—"
}

export interface VitalSignCardProps extends React.ComponentProps<"div"> {
  reading: VitalReading
  /** Hide the reference range line. */
  hideRange?: boolean
}

export function VitalSignCard({ reading, hideRange = false, className, ...props }: VitalSignCardProps) {
  const def = VITAL_DEFINITIONS[reading.type]
  const status = getVitalStatus(reading)
  const Icon = def.icon
  return (
    <div
      data-slot="vital-sign-card"
      data-status={status}
      className={cn(
        "relative flex flex-col gap-3 overflow-hidden rounded-xl border bg-card p-4 text-card-foreground",
        status === "critical" && "border-clinical-critical/40 ring-1 ring-clinical-critical/20",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="size-4" />
          <span>{def.label}</span>
        </div>
        <ClinicalStatusBadge status={status} />
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-semibold tracking-tight tabular-nums">{formatValue(reading)}</span>
          <span className="text-sm text-muted-foreground">{def.unit}</span>
        </div>
        {reading.history && reading.history.length > 1 && (
          <Sparkline values={reading.history} status={status} className="max-w-24" />
        )}
      </div>
      {(!hideRange || reading.recordedAt) && (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          {!hideRange && (
            <span>
              Ref {def.range} {def.unit}
            </span>
          )}
          {reading.recordedAt && <span className="ml-auto">{reading.recordedAt}</span>}
        </div>
      )}
    </div>
  )
}

export interface VitalSignsPanelProps extends React.ComponentProps<"div"> {
  readings: VitalReading[]
  hideRange?: boolean
}

export function VitalSignsPanel({ readings, hideRange, className, ...props }: VitalSignsPanelProps) {
  return (
    <div
      data-slot="vital-signs-panel"
      className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}
      {...props}
    >
      {readings.map((reading) => (
        <VitalSignCard key={reading.type} reading={reading} hideRange={hideRange} />
      ))}
    </div>
  )
}

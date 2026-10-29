"use client"

import * as React from "react"
import { format, isValid, parseISO } from "date-fns"
import { Table2 } from "lucide-react"
import { CartesianGrid, Line, LineChart, ReferenceArea, XAxis, YAxis } from "recharts"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"
import { VITAL_DEFINITIONS, classifyBloodPressure, classifyVital, type VitalType } from "@/components/medicn/vital-signs"

export type VitalsChartType =
  | "bloodPressure"
  | "heartRate"
  | "respiratoryRate"
  | "temperature"
  | "oxygenSaturation"
  | "weight"
  | "custom"

export interface VitalsChartPoint {
  /** ISO date-time (formatted with `timeFormat`) or a ready-made label. */
  time: string
  /** Value. For blood pressure, the systolic value. */
  value: number
  /** Diastolic value for blood pressure. */
  value2?: number
}

export interface VitalsChartRange {
  low: number
  high: number
}

export interface VitalsChartSeries {
  type: VitalsChartType
  /** Unique key, needed only when two series share a `type` (e.g. two custom series). Defaults to `type`. */
  id?: string
  label?: string
  unit?: string
  points: VitalsChartPoint[]
  /** Normal band. For blood pressure, the systolic band. Defaults are derived from `VITAL_DEFINITIONS`. */
  range?: VitalsChartRange
  /** Diastolic normal band for blood pressure. */
  range2?: VitalsChartRange
  /** Override per-point status. Defaults to the vital-signs classifiers, or in/out of `range` for weight & custom. */
  classify?: (point: VitalsChartPoint) => ClinicalStatus
}

const vitalTypeMap: Partial<Record<VitalsChartType, VitalType>> = {
  bloodPressure: "bloodPressure",
  heartRate: "heartRate",
  respiratoryRate: "respiratoryRate",
  temperature: "temperature",
  oxygenSaturation: "spo2",
}

/** Scan a value grid for the contiguous span the classifier calls "normal". */
function deriveBand(test: (v: number) => ClinicalStatus, min: number, max: number, step: number) {
  let low: number | undefined
  let high: number | undefined
  for (let i = Math.round(min / step); i <= Math.round(max / step); i++) {
    const v = Number((i * step).toFixed(2))
    if (test(v) === "normal") {
      low ??= v
      high = v
    }
  }
  return low != null && high != null ? { low, high } : undefined
}

/**
 * Default normal bands, derived at module load from the vital-signs classifiers so they never drift.
 * Generic adult screening defaults, not clinical decision support — pass `range` to match your protocol.
 */
export const VITALS_CHART_DEFAULT_RANGES: Partial<Record<VitalsChartType, { range?: VitalsChartRange; range2?: VitalsChartRange }>> = {
  bloodPressure: {
    range: deriveBand((v) => classifyBloodPressure(v), 40, 250, 1),
    range2: deriveBand((v) => classifyBloodPressure(undefined, v), 20, 150, 1),
  },
  heartRate: { range: deriveBand((v) => classifyVital("heartRate", v), 20, 220, 1) },
  respiratoryRate: { range: deriveBand((v) => classifyVital("respiratoryRate", v), 0, 60, 1) },
  temperature: { range: deriveBand((v) => classifyVital("temperature", v), 32, 43, 0.1) },
  oxygenSaturation: { range: deriveBand((v) => classifyVital("spo2", v), 50, 100, 1) },
}

const fallbackMeta: Record<"weight" | "custom", { label: string; unit: string }> = {
  weight: { label: "Weight", unit: "kg" },
  custom: { label: "Value", unit: "" },
}

export function getVitalsSeriesMeta(series: VitalsChartSeries) {
  const vital = vitalTypeMap[series.type]
  const def = vital ? VITAL_DEFINITIONS[vital] : undefined
  const fallback = def ? undefined : fallbackMeta[series.type as "weight" | "custom"]
  const defaults = VITALS_CHART_DEFAULT_RANGES[series.type]
  return {
    key: series.id ?? series.type,
    label: series.label ?? def?.label ?? fallback?.label ?? series.type,
    shortLabel: series.label ?? def?.shortLabel ?? fallback?.label ?? series.type,
    unit: series.unit ?? def?.unit ?? fallback?.unit ?? "",
    range: series.range ?? defaults?.range,
    range2: series.range2 ?? defaults?.range2,
  }
}

/** Status of a single point using the series' classifier, the vital-signs defaults, or the series range. */
export function getVitalsPointStatus(series: VitalsChartSeries, point: VitalsChartPoint): ClinicalStatus {
  if (series.classify) return series.classify(point)
  const vital = vitalTypeMap[series.type]
  if (vital === "bloodPressure") return classifyBloodPressure(point.value, point.value2)
  if (vital) return classifyVital(vital, point.value)
  if (!series.range) return "unknown"
  return point.value < series.range.low || point.value > series.range.high ? "abnormal" : "normal"
}

const toneFill: Record<ClinicalStatus, string> = {
  normal: "var(--clinical-normal)",
  watch: "var(--clinical-watch)",
  abnormal: "var(--clinical-abnormal)",
  critical: "var(--clinical-critical)",
  info: "var(--clinical-info)",
  unknown: "var(--muted-foreground)",
}

function formatTime(time: string, pattern: string) {
  const date = parseISO(time)
  return isValid(date) ? format(date, pattern) : time
}

function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true
  )
}

type Row = { index: number; time: string; label: string; value: number; value2?: number; status: ClinicalStatus }

function formatReading(row: Pick<Row, "value" | "value2">, isBP: boolean) {
  return isBP ? `${row.value}/${row.value2 ?? "—"}` : String(row.value)
}

function StatusDot(props: { cx?: number; cy?: number; index?: number; payload?: Row }) {
  if (props.cx == null || props.cy == null) return <g key={props.index} />
  const status = props.payload?.status ?? "unknown"
  return (
    <circle
      key={props.index}
      cx={props.cx}
      cy={props.cy}
      r={status === "normal" ? 3.5 : 4.5}
      fill={toneFill[status]}
      stroke="var(--background)"
      strokeWidth={1.5}
    />
  )
}

export interface VitalsChartProps extends React.ComponentProps<"div"> {
  series: VitalsChartSeries[]
  /** Controlled selected series key (`id ?? type`). */
  value?: string
  /** Initially selected series key when uncontrolled. Defaults to the first series. */
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Chart height in px. */
  height?: number
  /** Shade the normal band. */
  showRange?: boolean
  /** date-fns pattern for x-axis ticks when `time` is ISO. */
  timeFormat?: string
  /** date-fns pattern for the tooltip and data table. */
  tooltipTimeFormat?: string
  /** Show the data table initially. It is always available to screen readers. */
  defaultShowTable?: boolean
}

export function VitalsChart({
  series,
  value: valueProp,
  defaultValue,
  onValueChange,
  height = 240,
  showRange = true,
  timeFormat = "HH:mm",
  tooltipTimeFormat = "MMM d, HH:mm",
  defaultShowTable = false,
  className,
  ...props
}: VitalsChartProps) {
  const tableId = React.useId()
  const reducedMotion = usePrefersReducedMotion()
  const [valueState, setValueState] = React.useState(defaultValue)
  const [showTable, setShowTable] = React.useState(defaultShowTable)

  const metas = series.map(getVitalsSeriesMeta)
  const requested = valueProp ?? valueState
  const index = Math.max(
    0,
    metas.findIndex((m) => m.key === requested)
  )
  const active = series[index]
  const meta = metas[index]

  const select = (next: string) => {
    if (!next) return
    if (valueProp === undefined) setValueState(next)
    onValueChange?.(next)
  }

  if (!active) {
    return (
      <div
        data-slot="vitals-chart"
        className={cn("rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground", className)}
        {...props}
      >
        No observations recorded.
      </div>
    )
  }

  const isBP = active.type === "bloodPressure"
  const rows: Row[] = active.points.map((p, i) => ({
    index: i,
    time: p.time,
    label: formatTime(p.time, timeFormat),
    value: p.value,
    value2: p.value2,
    status: getVitalsPointStatus(active, p),
  }))
  const latest = rows[rows.length - 1]

  const values = rows.flatMap((r) => (r.value2 != null ? [r.value, r.value2] : [r.value]))
  const bands = showRange ? [meta.range, isBP ? meta.range2 : undefined].filter((b): b is VitalsChartRange => !!b) : []
  const lo = Math.min(...values, ...bands.map((b) => b.low))
  const hi = Math.max(...values, ...bands.map((b) => b.high))
  const pad = (hi - lo || Math.abs(hi) || 1) * 0.12
  const step = hi - lo > 20 ? 5 : hi - lo > 4 ? 1 : 0.1
  const domain: [number, number] = [
    Number((Math.floor((lo - pad) / step) * step).toFixed(1)),
    Number((Math.ceil((hi + pad) / step) * step).toFixed(1)),
  ]

  const config = {
    value: { label: isBP ? "Systolic" : meta.label, color: "var(--primary)" },
    value2: { label: "Diastolic", color: "var(--muted-foreground)" },
  } satisfies ChartConfig

  return (
    <div data-slot="vitals-chart" className={cn("flex flex-col gap-3", className)} {...props}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium">
            {meta.label}
            {meta.unit && <span className="font-normal text-muted-foreground"> ({meta.unit})</span>}
          </span>
          {latest && (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              Latest{" "}
              <span className="text-base font-semibold text-foreground tabular-nums">{formatReading(latest, isBP)}</span>
              <ClinicalStatusBadge status={latest.status} />
            </span>
          )}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {series.length > 1 && (
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              value={meta.key}
              onValueChange={select}
              aria-label="Vital sign"
            >
              {metas.map((m) => (
                <ToggleGroupItem key={m.key} value={m.key} aria-label={m.label}>
                  {m.shortLabel}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-expanded={showTable}
            aria-controls={tableId}
            onClick={() => setShowTable((s) => !s)}
          >
            <Table2 aria-hidden />
            {showTable ? "Hide table" : "Show table"}
          </Button>
        </div>
      </div>

      <ChartContainer config={config} className="aspect-auto w-full" style={{ height }} aria-hidden>
        <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          {bands.map((band, i) => (
            <ReferenceArea
              key={i}
              y1={band.low}
              y2={band.high}
              fill="var(--clinical-normal)"
              fillOpacity={0.1}
              stroke="none"
              ifOverflow="hidden"
            />
          ))}
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
          <YAxis
            domain={domain}
            tickLine={false}
            axisLine={false}
            width={40}
            tickMargin={4}
            tickFormatter={(value: number) => String(Number(value.toPrecision(3)))}
          />
          <ChartTooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active: tooltipActive, payload }) => {
              const row = tooltipActive ? (payload?.[0]?.payload as Row | undefined) : undefined
              if (!row) return null
              return (
                <div className="grid gap-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
                  <span className="font-medium">{formatTime(row.time, tooltipTimeFormat)}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums">
                      {formatReading(row, isBP)} {meta.unit}
                    </span>
                    <ClinicalStatusBadge status={row.status} />
                  </span>
                </div>
              )
            }}
          />
          <Line
            dataKey="value"
            type="monotone"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={StatusDot}
            activeDot={{ r: 5 }}
            isAnimationActive={!reducedMotion}
          />
          {isBP && (
            <Line
              dataKey="value2"
              type="monotone"
              stroke="var(--color-value2)"
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={StatusDot}
              activeDot={{ r: 5 }}
              isAnimationActive={!reducedMotion}
            />
          )}
        </LineChart>
      </ChartContainer>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-hidden>
        {isBP && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-chart-1" /> Systolic
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-4 border-t-2 border-dashed border-chart-2" /> Diastolic
            </span>
          </>
        )}
        {bands.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm border border-clinical-normal/30 bg-clinical-normal/10" /> Normal range{" "}
            {bands.map((b) => `${b.low}–${b.high}`).join(" / ")} {meta.unit}
          </span>
        )}
      </div>

      <div id={tableId} className={cn(!showTable && "sr-only")}>
        <Table>
          <caption className="sr-only">
            {meta.label} observations{meta.unit ? ` in ${meta.unit}` : ""}
          </caption>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>{isBP ? "Systolic/Diastolic" : meta.shortLabel}</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.index}>
                <TableCell>{formatTime(row.time, tooltipTimeFormat)}</TableCell>
                <TableCell className="tabular-nums">
                  {formatReading(row, isBP)} {meta.unit}
                </TableCell>
                <TableCell>
                  <ClinicalStatusBadge status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

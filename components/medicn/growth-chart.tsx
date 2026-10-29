"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { cn } from "@/lib/utils"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"
import {
  WHO_LENGTH_FOR_AGE_BOYS,
  WHO_LENGTH_FOR_AGE_GIRLS,
  WHO_WEIGHT_FOR_AGE_BOYS,
  WHO_WEIGHT_FOR_AGE_GIRLS,
  type LmsRow,
} from "@/components/medicn/growth-chart-data"

export type { LmsRow } from "@/components/medicn/growth-chart-data"

export type GrowthSex = "male" | "female"
export type GrowthMeasure = "weight" | "length"

export interface Lms {
  L: number
  M: number
  S: number
}

// ───────────────────────────── Pure helpers ─────────────────────────────

/** z-score of `value` for the given LMS parameters (Cole's LMS method). */
export function lmsZScore(value: number, { L, M, S }: Lms): number {
  if (L === 0) return Math.log(value / M) / S
  return (Math.pow(value / M, L) - 1) / (L * S)
}

/** Measurement value at z-score `z` for the given LMS parameters. */
export function lmsValueAtZ(z: number, { L, M, S }: Lms): number {
  if (L === 0) return M * Math.exp(S * z)
  return M * Math.pow(1 + L * S * z, 1 / L)
}

/**
 * WHO "restricted" z-score: beyond ±3 SD the LMS curve is replaced by a straight line using the
 * distance between the 2 and 3 SD values (WHO Child Growth Standards, 2006, ch. 7). WHO applies this
 * to weight-based indicators; for length (L = 1) it gives the same result as `lmsZScore`.
 */
export function lmsZScoreRestricted(value: number, lms: Lms): number {
  const z = lmsZScore(value, lms)
  if (z > 3) {
    const sd3 = lmsValueAtZ(3, lms)
    return 3 + (value - sd3) / (sd3 - lmsValueAtZ(2, lms))
  }
  if (z < -3) {
    const sd3 = lmsValueAtZ(-3, lms)
    return -3 + (value - sd3) / (lmsValueAtZ(-2, lms) - sd3)
  }
  return z
}

/** Standard normal CDF as a percentile (0–100). Abramowitz & Stegun 26.2.17, |error| < 7.5e-8. */
export function zToPercentile(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const poly = t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  const tail = (Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI)) * poly
  return (z >= 0 ? 1 - tail : tail) * 100
}

/** Inverse standard normal CDF for a percentile (0–100). Acklam's rational approximation. */
export function percentileToZ(percentile: number): number {
  const p = Math.min(Math.max(percentile / 100, 1e-12), 1 - 1e-12)
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239]
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572]
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416]
  const low = 0.02425
  if (p < low) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p > 1 - low) {
    const q = Math.sqrt(-2 * Math.log(1 - p))
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  const q = p - 0.5
  const r = q * q
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}

/** LMS at `ageMonths`, linearly interpolated between table rows. `null` outside the table's age range. */
export function interpolateLms(table: readonly LmsRow[], ageMonths: number): Lms | null {
  if (!table.length || !Number.isFinite(ageMonths)) return null
  if (ageMonths < table[0][0] || ageMonths > table[table.length - 1][0]) return null
  const i = table.findIndex((row) => row[0] >= ageMonths)
  if (table[i][0] === ageMonths) return { L: table[i][1], M: table[i][2], S: table[i][3] }
  const [a0, L0, M0, S0] = table[i - 1]
  const [a1, L1, M1, S1] = table[i]
  const f = (ageMonths - a0) / (a1 - a0)
  return { L: L0 + (L1 - L0) * f, M: M0 + (M1 - M0) * f, S: S0 + (S1 - S0) * f }
}

/** Built-in WHO Child Growth Standards table (0–24 months). */
export function getWhoReference(sex: GrowthSex, measure: GrowthMeasure): readonly LmsRow[] {
  if (measure === "weight") return sex === "male" ? WHO_WEIGHT_FOR_AGE_BOYS : WHO_WEIGHT_FOR_AGE_GIRLS
  return sex === "male" ? WHO_LENGTH_FOR_AGE_BOYS : WHO_LENGTH_FOR_AGE_GIRLS
}

export interface GrowthPercentileResult {
  z: number
  percentile: number
  lms: Lms
}

/**
 * z-score and percentile of a measurement. Uses the WHO 0–24 month standards unless `reference` is
 * given. WHO's restricted z-score beyond ±3 SD is applied to built-in weight-for-age.
 * Returns `null` when the age is outside the reference table or the value is not positive.
 */
export function getGrowthPercentile({
  sex,
  measure,
  ageMonths,
  value,
  reference,
}: {
  sex: GrowthSex
  measure: GrowthMeasure
  ageMonths: number
  value: number
  reference?: readonly LmsRow[]
}): GrowthPercentileResult | null {
  const lms = interpolateLms(reference ?? getWhoReference(sex, measure), ageMonths)
  if (!lms || !(value > 0)) return null
  const z = !reference && measure === "weight" ? lmsZScoreRestricted(value, lms) : lmsZScore(value, lms)
  return { z, percentile: zToPercentile(z), lms }
}

// ───────────────────────────── Formatting ─────────────────────────────

function ordinal(n: string) {
  const whole = Math.floor(Number(n))
  const mod100 = whole % 100
  const suffix = mod100 >= 11 && mod100 <= 13 ? "th" : ["th", "st", "nd", "rd"][whole % 10] ?? "th"
  return `${n}${suffix}`
}

/** "50th", "0.4th", "<0.1st", ">99.9th". */
export function formatPercentile(percentile: number) {
  if (percentile < 0.1) return "<0.1st"
  if (percentile > 99.9) return ">99.9th"
  if (percentile < 1 || percentile > 99) return ordinal(percentile.toFixed(1).replace(/\.0$/, ""))
  return ordinal(String(Math.round(percentile)))
}

/** "9 mo", "1 y 3 mo", "2.5 mo" (fractional ages keep one decimal). */
export function formatAgeMonths(ageMonths: number) {
  const rounded = Math.round(ageMonths * 10) / 10
  if (rounded < 24) return `${rounded} mo`
  const years = Math.floor(rounded / 12)
  const months = Math.round((rounded - years * 12) * 10) / 10
  return months ? `${years} y ${months} mo` : `${years} y`
}

function formatZ(z: number) {
  return `${z >= 0 ? "+" : "−"}${Math.abs(z).toFixed(2)}`
}

function niceStep(span: number) {
  if (span > 80) return 20
  if (span > 40) return 10
  if (span > 20) return 5
  if (span > 8) return 2
  return 1
}

// ───────────────────────────── Component ─────────────────────────────

export interface GrowthMeasurement {
  ageMonths: number
  /** In the reference unit (kg for weight, cm for length with the built-in WHO data). */
  value: number
  label?: string
}

const defaultUnits: Record<GrowthMeasure, string> = { weight: "kg", length: "cm" }
const defaultTitles: Record<GrowthMeasure, string> = { weight: "Weight-for-age", length: "Length-for-age" }

type Row = {
  age: number
  value?: number
  label?: string
  z?: number
  percentile?: number
  status?: ClinicalStatus
} & Record<`p${number}`, number>

type Flagged = GrowthMeasurement & { z: number; percentile: number; status: ClinicalStatus; direction: "low" | "high" | null }

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

function PatientDot(props: { cx?: number; cy?: number; index?: number; payload?: Row }) {
  if (props.cx == null || props.cy == null || props.payload?.value == null) return <g key={props.index} />
  const flagged = props.payload.status !== "normal"
  return (
    <circle
      key={props.index}
      cx={props.cx}
      cy={props.cy}
      r={flagged ? 5 : 4}
      fill={flagged ? "var(--clinical-abnormal)" : "var(--primary)"}
      stroke="var(--background)"
      strokeWidth={1.5}
    />
  )
}

export interface GrowthChartProps extends React.ComponentProps<"div"> {
  sex: GrowthSex
  measure: GrowthMeasure
  measurements: GrowthMeasurement[]
  /** Percentile curves to draw. WHO's own charts use 3, 15, 50, 85, 97. */
  percentiles?: number[]
  /** Unit label. Defaults to kg / cm. Measurements must be in the reference table's unit. */
  unit?: string
  /** Chart title. Defaults to "Weight-for-age" / "Length-for-age". */
  title?: string
  /** Chart height in px. */
  height?: number
  /** Custom LMS table `[ageMonths, L, M, S][]` (e.g. CDC 2000 for 2–20 years). Replaces the WHO data. */
  reference?: readonly LmsRow[]
  /** Name of the reference shown under the chart. */
  referenceLabel?: string
  /** Visible age range in months. Defaults to the reference table's range. */
  ageRange?: [number, number]
  /** Flag measurements below this percentile. */
  lowPercentile?: number
  /** Flag measurements above this percentile. */
  highPercentile?: number
}

export function GrowthChart({
  sex,
  measure,
  measurements,
  percentiles = [3, 15, 50, 85, 97],
  unit = defaultUnits[measure],
  title = defaultTitles[measure],
  height = 320,
  reference,
  referenceLabel,
  ageRange,
  lowPercentile = 3,
  highPercentile = 97,
  className,
  ...props
}: GrowthChartProps) {
  const reducedMotion = usePrefersReducedMotion()
  const table = reference ?? getWhoReference(sex, measure)
  const [minAge, maxAge] = ageRange ?? [table[0]?.[0] ?? 0, table[table.length - 1]?.[0] ?? 24]
  const curves = [...percentiles].sort((a, b) => a - b)
  const curveZ = curves.map(percentileToZ)

  const assessed: Flagged[] = measurements
    .map((m) => {
      const result = getGrowthPercentile({ sex, measure, ageMonths: m.ageMonths, value: m.value, reference })
      if (!result) return null
      const direction: Flagged["direction"] =
        result.percentile < lowPercentile ? "low" : result.percentile > highPercentile ? "high" : null
      return { ...m, z: result.z, percentile: result.percentile, direction, status: direction ? "abnormal" : "normal" }
    })
    .filter((m): m is Flagged => m !== null)
    .sort((a, b) => a.ageMonths - b.ageMonths)
  const outOfRange = measurements.length - assessed.length

  const ages = Array.from(
    new Set([
      ...table.map((row) => row[0]).filter((age) => age >= minAge && age <= maxAge),
      ...assessed.map((m) => m.ageMonths).filter((age) => age >= minAge && age <= maxAge),
    ])
  ).sort((a, b) => a - b)

  const rows: Row[] = ages.map((age) => {
    const lms = interpolateLms(table, age)
    const row = { age } as Row
    if (lms) curves.forEach((p, i) => (row[`p${p}`] = lmsValueAtZ(curveZ[i], lms)))
    const point = assessed.find((m) => m.ageMonths === age)
    if (point) Object.assign(row, { value: point.value, label: point.label, z: point.z, percentile: point.percentile, status: point.status })
    return row
  })

  const allValues = rows.flatMap((r) => [...curves.map((p) => r[`p${p}`]), r.value]).filter((v): v is number => v != null)
  const lo = Math.min(...allValues)
  const hi = Math.max(...allValues)
  const step = niceStep(hi - lo)
  const yDomain: [number, number] = [Math.max(0, Math.floor(lo / step) * step), Math.ceil(hi / step) * step]
  const ageSpan = maxAge - minAge
  const ageStep = ageSpan <= 24 ? 3 : ageSpan <= 60 ? 6 : 12
  const xTicks: number[] = []
  for (let t = Math.ceil(minAge / ageStep) * ageStep; t <= maxAge; t += ageStep) xTicks.push(t)
  const ageTick = (age: number) => (ageSpan > 36 ? `${Math.round((age / 12) * 10) / 10}` : String(age))

  const median = curves.reduce((best, p) => (Math.abs(p - 50) < Math.abs(best - 50) ? p : best), curves[0])
  const lastIndex = rows.length - 1
  const latest = assessed[assessed.length - 1]
  const flagged = assessed.filter((m) => m.direction)

  const config = { value: { label: title, color: "var(--primary)" } } satisfies ChartConfig

  const edgeLabel = (p: number) =>
    function EdgeLabel(labelProps: { x?: number | string; y?: number | string; index?: number }) {
      if (labelProps.index !== lastIndex || labelProps.x == null || labelProps.y == null) return <g />
      return (
        <text
          x={Number(labelProps.x) + 6}
          y={Number(labelProps.y)}
          dy="0.32em"
          fontSize={10}
          fill="var(--muted-foreground)"
          fontWeight={p === median ? 600 : 400}
        >
          {p}
        </text>
      )
    }

  const sexLabel = sex === "male" ? "Boys" : "Girls"
  const sourceLabel = referenceLabel ?? (reference ? "Custom reference" : "WHO Child Growth Standards")

  return (
    <div data-slot="growth-chart" className={cn("flex flex-col gap-3", className)} {...props}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {title} <span className="font-normal text-muted-foreground">· {sexLabel} ({unit})</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {sourceLabel} · percentiles {curves.join(", ")}
          </span>
        </div>
        {latest && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Latest
            <span className="text-base font-semibold text-foreground tabular-nums">
              {latest.value} {unit}
            </span>
            <span className="tabular-nums">
              {formatPercentile(latest.percentile)} · z {formatZ(latest.z)}
            </span>
          </div>
        )}
      </div>

      <ChartContainer config={config} className="aspect-auto w-full" style={{ height }} aria-hidden>
        <LineChart data={rows} margin={{ top: 8, right: 28, bottom: 16, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="age"
            type="number"
            domain={[minAge, maxAge]}
            ticks={xTicks}
            tickFormatter={ageTick}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            label={{
              value: ageSpan > 36 ? "Age (years)" : "Age (months)",
              position: "insideBottom",
              offset: -12,
              fontSize: 11,
              fill: "var(--muted-foreground)",
            }}
          />
          <YAxis
            domain={yDomain}
            tickCount={Math.round((yDomain[1] - yDomain[0]) / step) + 1}
            allowDecimals={step < 1}
            tickLine={false}
            axisLine={false}
            width={36}
            tickMargin={4}
          />
          <ChartTooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              const row = active ? (payload?.[0]?.payload as Row | undefined) : undefined
              if (!row || row.value == null || row.percentile == null || row.z == null) return null
              return (
                <div className="grid gap-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
                  <span className="font-medium">
                    {row.label ?? formatAgeMonths(row.age)}
                    {row.label && <span className="font-normal text-muted-foreground"> · {formatAgeMonths(row.age)}</span>}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {row.value} {unit}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatPercentile(row.percentile)} percentile · z {formatZ(row.z)}
                  </span>
                </div>
              )
            }}
          />
          {curves.map((p) => {
            const isMedian = p === median
            const isExtreme = p <= lowPercentile || p >= highPercentile
            return (
              <Line
                key={p}
                dataKey={`p${p}`}
                type="monotone"
                stroke={isMedian ? "var(--foreground)" : "var(--muted-foreground)"}
                strokeOpacity={isMedian ? 0.7 : 0.45}
                strokeWidth={isMedian ? 2 : 1.25}
                strokeDasharray={isExtreme ? "4 3" : undefined}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                label={edgeLabel(p)}
              />
            )
          })}
          <Line
            dataKey="value"
            type="linear"
            connectNulls
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={PatientDot}
            activeDot={{ r: 5 }}
            isAnimationActive={!reducedMotion}
          />
        </LineChart>
      </ChartContainer>

      <div className="flex flex-col gap-2 text-sm" aria-live="polite">
        {flagged.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {flagged.map((m, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2">
                <ClinicalStatusBadge status="abnormal">
                  {m.direction === "low" ? `Below ${ordinal(String(lowPercentile))}` : `Above ${ordinal(String(highPercentile))}`}
                </ClinicalStatusBadge>
                <span className="tabular-nums">
                  {m.label ? `${m.label} (${formatAgeMonths(m.ageMonths)})` : formatAgeMonths(m.ageMonths)}: {m.value} {unit} ·{" "}
                  {formatPercentile(m.percentile)} percentile · z {formatZ(m.z)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          assessed.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <ClinicalStatusBadge status="normal">Within range</ClinicalStatusBadge>
              All measurements between the {ordinal(String(lowPercentile))} and {ordinal(String(highPercentile))} percentiles.
            </div>
          )
        )}
        {outOfRange > 0 && (
          <p className="text-xs text-muted-foreground">
            {outOfRange} measurement{outOfRange > 1 ? "s are" : " is"} outside the reference age range and not plotted.
          </p>
        )}
      </div>

      <div className="sr-only">
      <Table>
        <caption>
          {title}, {sexLabel.toLowerCase()}, {sourceLabel}
        </caption>
        <TableHeader>
          <TableRow>
            <TableHead>Age</TableHead>
            <TableHead>Value ({unit})</TableHead>
            <TableHead>Percentile</TableHead>
            <TableHead>z-score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assessed.map((m, i) => (
            <TableRow key={i}>
              <TableCell>{m.label ? `${m.label}, ${formatAgeMonths(m.ageMonths)}` : formatAgeMonths(m.ageMonths)}</TableCell>
              <TableCell>{m.value}</TableCell>
              <TableCell>{formatPercentile(m.percentile)}</TableCell>
              <TableCell>{formatZ(m.z)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  )
}

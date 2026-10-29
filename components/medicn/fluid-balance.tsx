"use client"

import * as React from "react"
import { addHours, addMinutes, format, isValid, parseISO } from "date-fns"
import { Droplets, Plus, TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ClinicalStatusBadge } from "@/components/medicn/clinical-status-badge"

// ───────────────────────────── Types ─────────────────────────────

export type FluidKind = "intake" | "output"

export interface FluidCategory {
  /** Stable id stored on each entry, e.g. "urine". */
  id: string
  label: string
  kind: FluidKind
  /** LOINC code for the measured volume, used when mapping to a FHIR Observation. */
  loinc?: string
}

export interface FluidEntry {
  id: string
  /** ISO date-time the volume was measured or the infusion period ended. */
  time: string
  kind: FluidKind
  /** A `FluidCategory.id`. Unknown ids get their own row. */
  category: string
  /** Volume in mL (positive integer). */
  volumeMl: number
  note?: string
}

export type NewFluidEntry = Omit<FluidEntry, "id">

export interface FluidShift {
  /** e.g. "Day". */
  label: string
  /** Length in hours. Shifts run back to back from the period start. */
  hours: number
}

export type FluidBalanceTone = "normal" | "watch"

/**
 * LOINC codes verified against the NLM Clinical Tables LOINC index. Leave `loinc` unset where no
 * single measured-volume code fits (drains, blood products, "other").
 */
export const DEFAULT_FLUID_CATEGORIES: FluidCategory[] = [
  { id: "oral", label: "Oral", kind: "intake", loinc: "9000-1" },
  { id: "iv", label: "IV fluids", kind: "intake", loinc: "8975-5" },
  { id: "enteral", label: "Enteral / NG feed", kind: "intake" },
  { id: "blood", label: "Blood products", kind: "intake" },
  { id: "intake-other", label: "Other intake", kind: "intake" },
  { id: "urine", label: "Urine", kind: "output", loinc: "9187-6" },
  { id: "drain", label: "Drain", kind: "output" },
  { id: "emesis", label: "Emesis", kind: "output", loinc: "9137-1" },
  { id: "stool", label: "Stool", kind: "output" },
  { id: "ng-aspirate", label: "NG aspirate", kind: "output", loinc: "73704-9" },
  { id: "output-other", label: "Other output", kind: "output" },
]

export const DEFAULT_FLUID_SHIFTS: FluidShift[] = [
  { label: "Day", hours: 8 },
  { label: "Evening", hours: 8 },
  { label: "Night", hours: 8 },
]

/** KDIGO 2012 AKI guideline, rec. 2.1.1: urine volume < 0.5 mL/kg/h for 6 hours. */
export const KDIGO_OLIGURIA_ML_KG_H = 0.5
export const KDIGO_OLIGURIA_HOURS = 6

const PERIOD_HOURS = 24
const HOUR_MS = 3_600_000

// ───────────────────────────── Summary ─────────────────────────────

export interface SummarizeFluidBalanceOptions {
  /** ISO start of the 24 h period. A date only ("2026-10-28") starts at `dayStartHour`. */
  periodStart: string
  /** Hour the charting day starts when `periodStart` has no time. */
  dayStartHour?: number
  categories?: FluidCategory[]
  shifts?: FluidShift[]
  /** Enables the urine output rate check. */
  weightKg?: number
  /** Urine rate below this (mL/kg/h) flags the hour. */
  oliguriaThreshold?: number
  /** Running balance beyond ± this many mL gets the watch tone. */
  balanceWatchMl?: number
  /** Hours ending after `now` are treated as not yet charted (no oliguria flag, no running balance). */
  now?: string | Date
}

export interface FluidCategoryRow extends FluidCategory {
  /** Volume per hour; null when nothing was charted in that hour. */
  hourly: (number | null)[]
  /** Notes of entries in each hour. */
  notes: string[][]
  total: number | null
}

export interface FluidShiftSummary extends FluidShift {
  startIndex: number
  endIndex: number
  start: Date
  intake: number
  output: number
  net: number
  byCategory: Record<string, number | null>
}

export interface UrineRateSummary {
  weightKg: number
  threshold: number
  hourlyMl: number[]
  /**
   * mL/kg/h for each hour. Each urine measurement is spread over the time since the previous one
   * (or the period start), so hourly catheter readings and intermittent voids both work. Null for
   * hours after the last measurement or not yet complete.
   */
  rate: (number | null)[]
  oliguric: boolean[]
  longestOliguricRun: number
  /** True when a run of ≥ 6 consecutive oliguric hours exists (KDIGO urine output criterion). */
  meetsKdigoCriterion: boolean
}

export interface FluidBalanceSummary {
  start: Date
  end: Date
  hours: Date[]
  /** Hour index is complete (ends at or before `now`, or no `now` given). */
  complete: boolean[]
  intakeRows: FluidCategoryRow[]
  outputRows: FluidCategoryRow[]
  hourlyIntake: number[]
  hourlyOutput: number[]
  hourlyNet: number[]
  /** Cumulative intake − output at the end of each hour; null for incomplete hours. */
  runningBalance: (number | null)[]
  runningTone: FluidBalanceTone[]
  shifts: FluidShiftSummary[]
  totals: { intake: number; output: number; net: number }
  balanceTone: FluidBalanceTone
  balanceWatchMl: number
  urine?: UrineRateSummary
  /** Entries inside the period, sorted by time. */
  entries: FluidEntry[]
}

/** Parse `periodStart`; date-only strings start at `dayStartHour` (default 07:00). */
export function resolvePeriodStart(periodStart: string, dayStartHour = 7) {
  const parsed = parseISO(periodStart)
  if (!isValid(parsed)) throw new Error(`Invalid periodStart: ${periodStart}`)
  if (/^\d{4}-\d{2}-\d{2}$/.test(periodStart.trim())) parsed.setHours(dayStartHour, 0, 0, 0)
  return parsed
}

function normalizeShifts(shifts: FluidShift[]) {
  const result: FluidShift[] = []
  let used = 0
  for (const shift of shifts) {
    if (used >= PERIOD_HOURS) break
    const hours = Math.min(Math.max(1, Math.round(shift.hours)), PERIOD_HOURS - used)
    result.push({ ...shift, hours })
    used += hours
  }
  if (used < PERIOD_HOURS) result.push({ label: "Other", hours: PERIOD_HOURS - used })
  return result
}

const sum = (values: (number | null)[]) => values.reduce<number>((acc, v) => acc + (v ?? 0), 0)
const sumOrNull = (values: (number | null)[]) => (values.some((v) => v !== null) ? sum(values) : null)

/**
 * Bin entries into the hourly I&O grid and compute shift subtotals, 24 h totals, the running
 * balance and (with `weightKg`) the urine output rate check. Pure; safe on the server.
 */
export function summarizeFluidBalance(entries: FluidEntry[], options: SummarizeFluidBalanceOptions): FluidBalanceSummary {
  const {
    categories = DEFAULT_FLUID_CATEGORIES,
    shifts: shiftOptions = DEFAULT_FLUID_SHIFTS,
    weightKg,
    oliguriaThreshold = KDIGO_OLIGURIA_ML_KG_H,
    balanceWatchMl = 1000,
  } = options
  const start = resolvePeriodStart(options.periodStart, options.dayStartHour)
  const end = addHours(start, PERIOD_HOURS)
  const hours = Array.from({ length: PERIOD_HOURS }, (_, i) => addHours(start, i))
  const now = options.now === undefined ? undefined : typeof options.now === "string" ? parseISO(options.now) : options.now
  const complete = hours.map((h) => !now || addHours(h, 1).getTime() <= now.getTime())

  const rows = new Map<string, FluidCategoryRow>()
  const key = (kind: FluidKind, id: string) => `${kind}:${id}`
  const makeRow = (category: FluidCategory): FluidCategoryRow => ({
    ...category,
    hourly: Array.from({ length: PERIOD_HOURS }, () => null),
    notes: Array.from({ length: PERIOD_HOURS }, () => []),
    total: null,
  })
  for (const category of categories) rows.set(key(category.kind, category.id), makeRow(category))

  const inPeriod: FluidEntry[] = []
  for (const entry of entries) {
    const time = parseISO(entry.time)
    if (!isValid(time) || !Number.isFinite(entry.volumeMl)) continue
    const index = Math.floor((time.getTime() - start.getTime()) / HOUR_MS)
    if (index < 0 || index >= PERIOD_HOURS) continue
    inPeriod.push(entry)
    let row = rows.get(key(entry.kind, entry.category))
    if (!row) {
      row = makeRow({ id: entry.category, label: entry.category, kind: entry.kind })
      rows.set(key(entry.kind, entry.category), row)
    }
    row.hourly[index] = (row.hourly[index] ?? 0) + entry.volumeMl
    if (entry.note) row.notes[index].push(entry.note)
  }
  inPeriod.sort((a, b) => parseISO(a.time).getTime() - parseISO(b.time).getTime())

  const allRows = [...rows.values()]
  for (const row of allRows) row.total = sumOrNull(row.hourly)
  const intakeRows = allRows.filter((r) => r.kind === "intake")
  const outputRows = allRows.filter((r) => r.kind === "output")

  const hourlyFor = (list: FluidCategoryRow[]) =>
    hours.map((_, i) => list.reduce((acc, row) => acc + (row.hourly[i] ?? 0), 0))
  const hourlyIntake = hourlyFor(intakeRows)
  const hourlyOutput = hourlyFor(outputRows)
  const hourlyNet = hourlyIntake.map((v, i) => v - hourlyOutput[i])

  const runningBalance: (number | null)[] = []
  let running = 0
  hourlyNet.forEach((net, i) => {
    running += net
    runningBalance.push(complete[i] ? running : null)
  })
  const toneFor = (value: number | null): FluidBalanceTone =>
    value !== null && Math.abs(value) > balanceWatchMl ? "watch" : "normal"
  const runningTone = runningBalance.map(toneFor)

  let cursor = 0
  const shifts: FluidShiftSummary[] = normalizeShifts(shiftOptions).map((shift) => {
    const startIndex = cursor
    const endIndex = cursor + shift.hours
    cursor = endIndex
    const slice = (values: number[]) => values.slice(startIndex, endIndex).reduce((a, b) => a + b, 0)
    const intake = slice(hourlyIntake)
    const output = slice(hourlyOutput)
    return {
      ...shift,
      startIndex,
      endIndex,
      start: hours[startIndex],
      intake,
      output,
      net: intake - output,
      byCategory: Object.fromEntries(
        allRows.map((row) => [key(row.kind, row.id), sumOrNull(row.hourly.slice(startIndex, endIndex))])
      ),
    }
  })

  const totals = {
    intake: sum(hourlyIntake),
    output: sum(hourlyOutput),
    net: sum(hourlyIntake) - sum(hourlyOutput),
  }

  let urine: UrineRateSummary | undefined
  if (weightKg && weightKg > 0) {
    const urineRow = rows.get(key("output", "urine"))
    const hourlyMl = hours.map((_, i) => urineRow?.hourly[i] ?? 0)
    // Intervals between consecutive urine measurements, each with its mean rate.
    const measurements = inPeriod
      .filter((e) => e.kind === "output" && e.category === "urine")
      .map((e) => ({ t: parseISO(e.time).getTime(), ml: e.volumeMl }))
    const intervals: { from: number; to: number; rate: number }[] = []
    let previous = start.getTime()
    for (const m of measurements) {
      if (m.t > previous) {
        intervals.push({ from: previous, to: m.t, rate: m.ml / ((m.t - previous) / HOUR_MS) / weightKg })
        previous = m.t
      } else if (intervals.length) {
        // Same timestamp as the previous measurement: add its volume to that interval.
        const last = intervals[intervals.length - 1]
        last.rate += m.ml / ((last.to - last.from) / HOUR_MS) / weightKg
      }
    }
    const rate = hours.map((h, i) => {
      if (!complete[i]) return null
      const mid = h.getTime() + HOUR_MS / 2
      return intervals.find((iv) => mid > iv.from && mid <= iv.to)?.rate ?? null
    })
    const oliguric = rate.map((r) => r !== null && r < oliguriaThreshold)
    let longest = 0
    let run = 0
    for (const flag of oliguric) {
      run = flag ? run + 1 : 0
      longest = Math.max(longest, run)
    }
    urine = {
      weightKg,
      threshold: oliguriaThreshold,
      hourlyMl,
      rate,
      oliguric,
      longestOliguricRun: longest,
      meetsKdigoCriterion: longest >= KDIGO_OLIGURIA_HOURS,
    }
  }

  return {
    start,
    end,
    hours,
    complete,
    intakeRows,
    outputRows,
    hourlyIntake,
    hourlyOutput,
    hourlyNet,
    runningBalance,
    runningTone,
    shifts,
    totals,
    balanceTone: toneFor(totals.net),
    balanceWatchMl,
    urine,
    entries: inPeriod,
  }
}

// ───────────────────────────── Formatting ─────────────────────────────

/** "1,250" — integer mL with thousands separators. */
export function formatMl(value: number) {
  return Math.round(value).toLocaleString("en-US")
}

/** "+1,250" / "−300" / "0" (true minus sign). */
export function formatSignedMl(value: number) {
  if (value === 0) return "0"
  return `${value > 0 ? "+" : "−"}${formatMl(Math.abs(value))}`
}

const formatRate = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 2, minimumIntegerDigits: 1 })

// ───────────────────────────── FluidBalance ─────────────────────────────

export interface FluidBalanceProps extends Omit<React.ComponentProps<"div">, "children" | "title"> {
  entries: FluidEntry[]
  /** ISO start of the 24 h period, e.g. "2026-10-28T07:00". A date alone starts at `dayStartHour`. */
  periodStart: string
  dayStartHour?: number
  categories?: FluidCategory[]
  shifts?: FluidShift[]
  /** Dosing weight in kg. Enables the urine mL/kg/h row and oliguria flags. */
  weightKg?: number
  oliguriaThreshold?: number
  balanceWatchMl?: number
  /** Current time. Later hours are shaded and excluded from checks. */
  now?: string | Date
  title?: React.ReactNode
  /** Shows an "Add entry" button with a `FluidEntryForm` dialog. */
  onAddEntry?: (entry: NewFluidEntry) => void
  /** Hide category rows with no entries in the period. */
  hideEmptyCategories?: boolean
}

type Column =
  | { type: "hour"; index: number }
  | { type: "shift"; shift: FluidShiftSummary }
  | { type: "total" }

const toneClasses: Record<FluidBalanceTone, string> = {
  normal: "",
  watch: "bg-clinical-watch/10 text-clinical-watch-foreground font-semibold",
}

export function FluidBalance({
  entries,
  periodStart,
  dayStartHour,
  categories,
  shifts,
  weightKg,
  oliguriaThreshold,
  balanceWatchMl,
  now,
  title = "Intake & output",
  onAddEntry,
  hideEmptyCategories = false,
  className,
  ...props
}: FluidBalanceProps) {
  const summary = React.useMemo(
    () =>
      summarizeFluidBalance(entries, {
        periodStart,
        dayStartHour,
        categories,
        shifts,
        weightKg,
        oliguriaThreshold,
        balanceWatchMl,
        now,
      }),
    [entries, periodStart, dayStartHour, categories, shifts, weightKg, oliguriaThreshold, balanceWatchMl, now]
  )
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const columns: Column[] = []
  for (const shift of summary.shifts) {
    for (let i = shift.startIndex; i < shift.endIndex; i++) columns.push({ type: "hour", index: i })
    columns.push({ type: "shift", shift })
  }
  columns.push({ type: "total" })

  const hourLabel = (i: number) => format(summary.hours[i], "HH")
  const shiftRange = (shift: FluidShiftSummary) =>
    `${format(shift.start, "HH:mm")}–${format(addHours(shift.start, shift.hours), "HH:mm")}`

  const filterRows = (rows: FluidCategoryRow[]) => (hideEmptyCategories ? rows.filter((r) => r.total !== null) : rows)
  const intakeRows = filterRows(summary.intakeRows)
  const outputRows = filterRows(summary.outputRows)
  const urine = summary.urine
  const threshold = urine?.threshold ?? KDIGO_OLIGURIA_ML_KG_H

  const widthRem = 11 + columns.reduce((acc, c) => acc + (c.type === "hour" ? 3.5 : c.type === "shift" ? 5 : 5.5), 0)

  const stickyHead = "sticky left-0 z-10 bg-card border-r"
  const cellBase = "px-1.5 text-right tabular-nums"
  const subtotalCell = "bg-muted/60 font-medium"

  const futureClass = (i: number) => (!summary.complete[i] ? "bg-muted/30 text-muted-foreground" : "")

  const renderVolume = (value: number | null, notes?: string[]) => {
    if (value === null) return null
    const text = formatMl(value)
    if (!notes || notes.length === 0) return text
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="cursor-help underline decoration-dotted underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {text}
            <span className="sr-only">, note: {notes.join("; ")}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>{notes.join(" · ")}</TooltipContent>
      </Tooltip>
    )
  }

  const categoryRow = (row: FluidCategoryRow) => {
    const isUrine = row.kind === "output" && row.id === "urine"
    return (
      <TableRow key={`${row.kind}:${row.id}`} className="hover:bg-transparent">
        <TableHead scope="row" className={cn(stickyHead, "pl-6 font-normal")}>
          {row.label}
        </TableHead>
        {columns.map((col, c) => {
          if (col.type === "hour") {
            const flagged = isUrine && urine?.oliguric[col.index]
            return (
              <TableCell
                key={c}
                className={cn(cellBase, futureClass(col.index), flagged && toneClasses.watch)}
              >
                {renderVolume(row.hourly[col.index], row.notes[col.index])}
              </TableCell>
            )
          }
          if (col.type === "shift") {
            const value = col.shift.byCategory[`${row.kind}:${row.id}`]
            return (
              <TableCell key={c} className={cn(cellBase, subtotalCell)}>
                {value === null ? null : formatMl(value)}
              </TableCell>
            )
          }
          return (
            <TableCell key={c} className={cn(cellBase, subtotalCell, "font-semibold")}>
              {row.total === null ? null : formatMl(row.total)}
            </TableCell>
          )
        })}
      </TableRow>
    )
  }

  const groupHeader = (label: string) => (
    <TableRow className="bg-muted/40 hover:bg-muted/40">
      <TableHead scope="rowgroup" className={cn(stickyHead, "bg-muted text-xs tracking-wide text-muted-foreground uppercase")}>
        {label}
      </TableHead>
      <TableCell colSpan={columns.length} className="bg-muted/40" />
    </TableRow>
  )

  const totalRow = (label: string, hourly: number[], pick: (s: FluidShiftSummary) => number, total: number) => (
    <TableRow className="border-b-2 font-medium hover:bg-transparent">
      <TableHead scope="row" className={stickyHead}>
        {label}
      </TableHead>
      {columns.map((col, c) => {
        if (col.type === "hour")
          return (
            <TableCell key={c} className={cn(cellBase, futureClass(col.index))}>
              {hourly[col.index] ? formatMl(hourly[col.index]) : null}
            </TableCell>
          )
        if (col.type === "shift")
          return (
            <TableCell key={c} className={cn(cellBase, subtotalCell)}>
              {formatMl(pick(col.shift))}
            </TableCell>
          )
        return (
          <TableCell key={c} className={cn(cellBase, subtotalCell, "font-semibold")}>
            {formatMl(total)}
          </TableCell>
        )
      })}
    </TableRow>
  )

  const watchIcon = (label: string) => (
    <>
      <TriangleAlert aria-hidden className="mr-0.5 inline size-3 align-[-1px]" />
      <span className="sr-only">{label} </span>
    </>
  )

  const shiftTone = (net: number): FluidBalanceTone => (Math.abs(net) > summary.balanceWatchMl ? "watch" : "normal")

  return (
    <TooltipProvider>
      <div
        data-slot="fluid-balance"
        className={cn("flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground", className)}
        {...props}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="flex items-center gap-2 font-semibold">
              <Droplets className="size-4 text-muted-foreground" aria-hidden />
              {title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {format(summary.start, "MMM d, HH:mm")} – {format(summary.end, "MMM d, HH:mm")}
              {urine && ` · Weight ${urine.weightKg.toLocaleString("en-US")} kg`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <dl className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <div className="flex gap-1.5">
                <dt className="text-muted-foreground">Intake</dt>
                <dd className="font-medium tabular-nums">{formatMl(summary.totals.intake)} mL</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-muted-foreground">Output</dt>
                <dd className="font-medium tabular-nums">{formatMl(summary.totals.output)} mL</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <dt className="text-muted-foreground">Balance</dt>
                <dd>
                  <ClinicalStatusBadge status={summary.balanceTone} className="tabular-nums">
                    {formatSignedMl(summary.totals.net)} mL
                  </ClinicalStatusBadge>
                </dd>
              </div>
            </dl>
            {urine?.meetsKdigoCriterion ? (
              <ClinicalStatusBadge status="abnormal">
                Urine &lt; {formatRate(threshold)} mL/kg/h for {urine.longestOliguricRun} h
              </ClinicalStatusBadge>
            ) : urine && urine.oliguric.some(Boolean) ? (
              <ClinicalStatusBadge status="watch">
                {urine.oliguric.filter(Boolean).length} h urine &lt; {formatRate(threshold)} mL/kg/h
              </ClinicalStatusBadge>
            ) : null}
            {onAddEntry && (
              <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
                <Plus /> Add entry
              </Button>
            )}
          </div>
        </div>

        <Table className="table-fixed border-separate border-spacing-0 [&_td]:border-b [&_th]:border-b" style={{ width: `${widthRem}rem`, minWidth: "100%" }}>
          <caption className="sr-only">
            Hourly fluid intake and output in mL from {format(summary.start, "MMM d HH:mm")}, with shift subtotals, 24 hour
            totals and running balance.
          </caption>
          <colgroup>
            <col style={{ width: "11rem" }} />
            {columns.map((col, c) => (
              <col key={c} style={{ width: col.type === "hour" ? "3.5rem" : col.type === "shift" ? "5rem" : "5.5rem" }} />
            ))}
          </colgroup>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className={cn(stickyHead, "z-20")}>
                mL
              </TableHead>
              {columns.map((col, c) =>
                col.type === "hour" ? (
                  <TableHead key={c} scope="col" className={cn("px-1.5 text-right tabular-nums", futureClass(col.index))}>
                    <span aria-hidden>{hourLabel(col.index)}</span>
                    <span className="sr-only">{format(summary.hours[col.index], "HH:mm")}</span>
                  </TableHead>
                ) : col.type === "shift" ? (
                  <TableHead key={c} scope="col" className="h-auto bg-muted px-1.5 py-1 text-right leading-tight whitespace-normal">
                    <span className="block text-xs">{col.shift.label}</span>
                    <span className="block text-[10px] font-normal text-muted-foreground">{shiftRange(col.shift)}</span>
                  </TableHead>
                ) : (
                  <TableHead key={c} scope="col" className="bg-muted px-1.5 text-right">
                    24 h
                  </TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupHeader("Intake")}
            {intakeRows.map(categoryRow)}
            {totalRow("Total intake", summary.hourlyIntake, (s) => s.intake, summary.totals.intake)}
            {groupHeader("Output")}
            {outputRows.map(categoryRow)}
            {totalRow("Total output", summary.hourlyOutput, (s) => s.output, summary.totals.output)}

            <TableRow className="hover:bg-transparent">
              <TableHead scope="row" className={stickyHead}>
                Net (I − O)
              </TableHead>
              {columns.map((col, c) => {
                if (col.type === "hour") {
                  const net = summary.hourlyNet[col.index]
                  const has = summary.hourlyIntake[col.index] > 0 || summary.hourlyOutput[col.index] > 0
                  return (
                    <TableCell key={c} className={cn(cellBase, futureClass(col.index))}>
                      {has ? formatSignedMl(net) : null}
                    </TableCell>
                  )
                }
                const net = col.type === "shift" ? col.shift.net : summary.totals.net
                const tone = shiftTone(net)
                return (
                  <TableCell key={c} className={cn(cellBase, subtotalCell, "font-semibold", toneClasses[tone])}>
                    {tone === "watch" && watchIcon(`Beyond ±${formatMl(summary.balanceWatchMl)} mL`)}
                    {formatSignedMl(net)}
                  </TableCell>
                )
              })}
            </TableRow>

            <TableRow className="hover:bg-transparent">
              <TableHead scope="row" className={stickyHead}>
                Running balance
              </TableHead>
              {columns.map((col, c) => {
                if (col.type === "hour") {
                  const value = summary.runningBalance[col.index]
                  const tone = summary.runningTone[col.index]
                  return (
                    <TableCell key={c} className={cn(cellBase, futureClass(col.index), toneClasses[tone])}>
                      {value === null ? null : (
                        <>
                          {tone === "watch" && watchIcon(`Beyond ±${formatMl(summary.balanceWatchMl)} mL`)}
                          {formatSignedMl(value)}
                        </>
                      )}
                    </TableCell>
                  )
                }
                if (col.type === "shift") {
                  const value = summary.runningBalance[col.shift.endIndex - 1]
                  const tone = summary.runningTone[col.shift.endIndex - 1]
                  return (
                    <TableCell key={c} className={cn(cellBase, subtotalCell, toneClasses[tone])}>
                      {value === null ? null : (
                        <>
                          {tone === "watch" && watchIcon(`Beyond ±${formatMl(summary.balanceWatchMl)} mL`)}
                          {formatSignedMl(value)}
                        </>
                      )}
                    </TableCell>
                  )
                }
                return (
                  <TableCell key={c} className={cn(cellBase, subtotalCell, "font-semibold", toneClasses[summary.balanceTone])}>
                    {summary.balanceTone === "watch" && watchIcon(`Beyond ±${formatMl(summary.balanceWatchMl)} mL`)}
                    {formatSignedMl(summary.totals.net)}
                  </TableCell>
                )
              })}
            </TableRow>

            {urine && (
              <TableRow className="hover:bg-transparent">
                <TableHead scope="row" className={cn(stickyHead, "font-normal")}>
                  Urine mL/kg/h
                </TableHead>
                {columns.map((col, c) => {
                  if (col.type === "hour") {
                    const rate = urine.rate[col.index]
                    const flagged = urine.oliguric[col.index]
                    return (
                      <TableCell key={c} className={cn(cellBase, "text-xs", futureClass(col.index), flagged && toneClasses.watch)}>
                        {rate === null ? null : (
                          <>
                            {flagged && watchIcon(`Below ${formatRate(threshold)} mL/kg/h`)}
                            {formatRate(rate)}
                          </>
                        )}
                      </TableCell>
                    )
                  }
                  const [from, to] = col.type === "shift" ? [col.shift.startIndex, col.shift.endIndex] : [0, PERIOD_HOURS]
                  const done = urine.rate.slice(from, to).filter((r): r is number => r !== null)
                  const mean = done.length ? done.reduce((a, b) => a + b, 0) / done.length : null
                  return (
                    <TableCell key={c} className={cn(cellBase, subtotalCell, "text-xs")}>
                      {mean === null ? null : formatRate(mean)}
                    </TableCell>
                  )
                })}
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2 text-xs text-muted-foreground">
          {urine && (
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="inline-flex size-3 items-center justify-center rounded-sm bg-clinical-watch/20 text-clinical-watch-foreground">
                <TriangleAlert className="size-2.5" />
              </span>
              Urine &lt; {formatRate(threshold)} mL/kg/h (KDIGO: for {KDIGO_OLIGURIA_HOURS} h)
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="inline-flex size-3 items-center justify-center rounded-sm bg-clinical-watch/20 text-clinical-watch-foreground">
              <TriangleAlert className="size-2.5" />
            </span>
            Balance beyond ±{formatMl(summary.balanceWatchMl)} mL
          </span>
          <span>Underlined values have notes. Shaded columns are subtotals.</span>
        </div>

        {onAddEntry && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add I&amp;O entry</DialogTitle>
                <DialogDescription>Record a measured intake or output volume.</DialogDescription>
              </DialogHeader>
              <FluidEntryForm
                categories={categories}
                minTime={toLocalInput(summary.start)}
                maxTime={toLocalInput(addMinutes(summary.end, -1))}
                defaultValue={{ time: toLocalInput(now ? (typeof now === "string" ? parseISO(now) : now) : summary.start) }}
                onCancel={() => setDialogOpen(false)}
                onSubmit={(entry) => {
                  onAddEntry(entry)
                  setDialogOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  )
}

// ───────────────────────────── FluidEntryForm ─────────────────────────────

/** Format a Date for `<input type="datetime-local">`: "2026-10-28T14:00". */
export function toLocalInput(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

export interface FluidEntryFormProps extends Omit<React.ComponentProps<"form">, "onSubmit" | "defaultValue"> {
  categories?: FluidCategory[]
  defaultValue?: Partial<NewFluidEntry>
  onSubmit?: (entry: NewFluidEntry) => void
  onCancel?: () => void
  /** Earliest allowed time ("yyyy-MM-ddTHH:mm"). */
  minTime?: string
  /** Latest allowed time ("yyyy-MM-ddTHH:mm"). */
  maxTime?: string
  /** Largest single entry accepted, as a guard against typos. */
  maxVolumeMl?: number
  submitLabel?: string
  resetOnSubmit?: boolean
}

interface EntryDraft {
  time: string
  kind: FluidKind
  category: string
  volume: string
  note: string
}

type EntryErrorKey = "time" | "category" | "volume"

/** Validate a volume string: a positive whole number of mL up to `max`. */
export function validateFluidVolume(text: string, max = 5000): string | undefined {
  const trimmed = text.trim()
  if (!trimmed) return "Enter a volume"
  if (!/^\d+$/.test(trimmed)) return "Enter a whole number of mL"
  const value = Number(trimmed)
  if (value <= 0) return "Volume must be greater than 0 mL"
  if (value > max) return `Check the volume: more than ${formatMl(max)} mL in one entry`
  return undefined
}

export function FluidEntryForm({
  categories = DEFAULT_FLUID_CATEGORIES,
  defaultValue,
  onSubmit,
  onCancel,
  minTime,
  maxTime,
  maxVolumeMl = 5000,
  submitLabel = "Add entry",
  resetOnSubmit = true,
  className,
  ...props
}: FluidEntryFormProps) {
  const id = React.useId()
  const formRef = React.useRef<HTMLFormElement>(null)
  const initial = React.useMemo<EntryDraft>(() => {
    const kind = defaultValue?.kind ?? "intake"
    const time = defaultValue?.time ? defaultValue.time.slice(0, 16) : ""
    return {
      time,
      kind,
      category: defaultValue?.category ?? categories.find((c) => c.kind === kind)?.id ?? "",
      volume: defaultValue?.volumeMl !== undefined ? String(defaultValue.volumeMl) : "",
      note: defaultValue?.note ?? "",
    }
  }, [defaultValue, categories])
  const [draft, setDraft] = React.useState<EntryDraft>(initial)
  const [submitted, setSubmitted] = React.useState(false)
  const [focusError, setFocusError] = React.useState(0)

  const errors = React.useMemo(() => {
    const result: Partial<Record<EntryErrorKey, string>> = {}
    const time = parseISO(draft.time)
    if (!draft.time || !isValid(time)) result.time = "Enter the date and time"
    else if ((minTime && draft.time < minTime) || (maxTime && draft.time > maxTime))
      result.time = "Time must be within the charting period"
    if (!categories.some((c) => c.kind === draft.kind && c.id === draft.category)) result.category = "Choose a category"
    const volumeError = validateFluidVolume(draft.volume, maxVolumeMl)
    if (volumeError) result.volume = volumeError
    return result
  }, [draft, categories, minTime, maxTime, maxVolumeMl])

  React.useEffect(() => {
    if (!focusError) return
    formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus()
  }, [focusError])

  const set = <K extends keyof EntryDraft>(key: K, value: EntryDraft[K]) => setDraft((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      setFocusError((n) => n + 1)
      return
    }
    onSubmit?.({
      time: draft.time,
      kind: draft.kind,
      category: draft.category,
      volumeMl: Number(draft.volume.trim()),
      note: draft.note.trim() || undefined,
    })
    if (resetOnSubmit) {
      setDraft((prev) => ({ ...prev, volume: "", note: "" }))
      setSubmitted(false)
    }
  }

  const show = (key: EntryErrorKey) => (submitted ? errors[key] : undefined)
  const errorProps = (key: EntryErrorKey) => ({
    "aria-invalid": show(key) ? true : undefined,
    "aria-describedby": show(key) ? `${id}-${key}-error` : undefined,
  })
  const error = (key: EntryErrorKey) =>
    show(key) ? <FieldError id={`${id}-${key}-error`}>{show(key)}</FieldError> : null

  const kindCategories = categories.filter((c) => c.kind === draft.kind)

  return (
    <form
      ref={formRef}
      data-slot="fluid-entry-form"
      noValidate
      onSubmit={handleSubmit}
      className={cn("grid gap-4 sm:grid-cols-2", className)}
      {...props}
    >
      <Field data-invalid={Boolean(show("time")) || undefined} className="sm:col-span-2">
        <FieldLabel htmlFor={`${id}-time`}>Time</FieldLabel>
        <Input
          id={`${id}-time`}
          type="datetime-local"
          value={draft.time}
          min={minTime}
          max={maxTime}
          onChange={(e) => set("time", e.target.value)}
          {...errorProps("time")}
        />
        {error("time")}
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-kind`}>Type</FieldLabel>
        <Select
          value={draft.kind}
          onValueChange={(value) => {
            const kind = value as FluidKind
            setDraft((prev) => ({ ...prev, kind, category: categories.find((c) => c.kind === kind)?.id ?? "" }))
          }}
        >
          <SelectTrigger id={`${id}-kind`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="intake">Intake</SelectItem>
            <SelectItem value="output">Output</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field data-invalid={Boolean(show("category")) || undefined}>
        <FieldLabel htmlFor={`${id}-category`}>Category</FieldLabel>
        <Select value={draft.category} onValueChange={(value) => set("category", value)}>
          <SelectTrigger id={`${id}-category`} className="w-full" {...errorProps("category")}>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {kindCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error("category")}
      </Field>
      <Field data-invalid={Boolean(show("volume")) || undefined}>
        <FieldLabel htmlFor={`${id}-volume`}>Volume</FieldLabel>
        <div className="relative">
          <Input
            id={`${id}-volume`}
            inputMode="numeric"
            autoComplete="off"
            placeholder="250"
            value={draft.volume}
            onChange={(e) => set("volume", e.target.value)}
            className="pr-10 tabular-nums"
            {...errorProps("volume")}
          />
          <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-muted-foreground">
            mL
          </span>
        </div>
        {error("volume")}
      </Field>
      <Field>
        <FieldLabel htmlFor={`${id}-note`}>Note</FieldLabel>
        <Input
          id={`${id}-note`}
          autoComplete="off"
          placeholder="Optional"
          value={draft.note}
          onChange={(e) => set("note", e.target.value)}
        />
      </Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}

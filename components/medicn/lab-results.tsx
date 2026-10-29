"use client"

import * as React from "react"
import { format, isValid, parseISO } from "date-fns"
import { ChevronDown, ChevronRight, FlaskConical, Minus, TrendingDown, TrendingUp } from "lucide-react"
import { CartesianGrid, Line, LineChart, ReferenceArea, XAxis, YAxis } from "recharts"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"

/** HL7 v3 ObservationInterpretation codes used by FHIR `Observation.interpretation`. */
export type LabInterpretation = "N" | "L" | "H" | "LL" | "HH" | "A" | "AA"

/** FHIR `Observation.status` (subset). */
export type LabResultStatus = "final" | "preliminary" | "corrected" | "amended" | "cancelled"

/** FHIR `Observation.referenceRange`. Values are data from the performing lab, not hard-coded truths. */
export interface LabReferenceRange {
  low?: number
  high?: number
  /** Critical (panic) limits. Needed to derive `LL` / `HH`. */
  criticalLow?: number
  criticalHigh?: number
  /** Free-text range, e.g. "Negative" or "<200 desirable". Shown instead of low–high. */
  text?: string
}

export interface LabResult {
  id: string
  /** Display name, e.g. "Hemoglobin". */
  name: string
  /** LOINC code, e.g. "718-7". */
  code?: string
  value: number | string
  unit?: string
  referenceRange?: LabReferenceRange
  /** Lab-supplied interpretation. Derived from value vs. range when absent. */
  interpretation?: LabInterpretation
  status?: LabResultStatus
  /** ISO date-time the specimen was collected / result is effective. */
  effectiveDate: string
  /** Earlier numeric results, most recent first. */
  previous?: { value: number; effectiveDate: string }[]
  note?: string
}

export interface LabPanel {
  id: string
  /** e.g. "Complete blood count" (FHIR DiagnosticReport). */
  name: string
  /** ISO date-time of collection. */
  collectedAt?: string
  status?: LabResultStatus
  results: LabResult[]
}

export const LAB_INTERPRETATION_LABELS: Record<LabInterpretation, string> = {
  N: "Normal",
  L: "Low",
  H: "High",
  LL: "Critical low",
  HH: "Critical high",
  A: "Abnormal",
  AA: "Critical abnormal",
}

export const LAB_RESULT_STATUS_LABELS: Record<LabResultStatus, string> = {
  final: "Final",
  preliminary: "Preliminary",
  corrected: "Corrected",
  amended: "Amended",
  cancelled: "Cancelled",
}

/** Derive an interpretation from a numeric value and reference range. */
export function interpretLabValue(value: number | string, range?: LabReferenceRange): LabInterpretation | undefined {
  if (typeof value !== "number" || Number.isNaN(value) || !range) return undefined
  if (range.criticalLow != null && value < range.criticalLow) return "LL"
  if (range.criticalHigh != null && value > range.criticalHigh) return "HH"
  if (range.low != null && value < range.low) return "L"
  if (range.high != null && value > range.high) return "H"
  if (range.low == null && range.high == null) return undefined
  return "N"
}

/** The result's interpretation: the lab-supplied code, otherwise derived from value vs. reference range. */
export function getLabInterpretation(result: Pick<LabResult, "value" | "referenceRange" | "interpretation">) {
  return result.interpretation ?? interpretLabValue(result.value, result.referenceRange)
}

/** Map an interpretation to a ClinicalStatus tone: N → normal, L/H/A → abnormal, LL/HH/AA → critical. */
export function getLabStatus(interpretation?: LabInterpretation): ClinicalStatus {
  if (!interpretation) return "unknown"
  if (interpretation === "N") return "normal"
  if (interpretation === "LL" || interpretation === "HH" || interpretation === "AA") return "critical"
  return "abnormal"
}

export function isAbnormalLabResult(result: LabResult) {
  const interpretation = getLabInterpretation(result)
  return interpretation != null && interpretation !== "N"
}

export function formatReferenceRange(range?: LabReferenceRange, unit?: string) {
  if (!range) return undefined
  if (range.text) return range.text
  const suffix = unit ? ` ${unit}` : ""
  if (range.low != null && range.high != null) return `${range.low}–${range.high}${suffix}`
  if (range.high != null) return `≤ ${range.high}${suffix}`
  if (range.low != null) return `≥ ${range.low}${suffix}`
  return undefined
}

function formatDate(value: string | undefined, pattern: string) {
  if (!value) return undefined
  const date = parseISO(value)
  return isValid(date) ? format(date, pattern) : value
}

function decimals(n: number) {
  const s = String(n)
  const i = s.indexOf(".")
  return i === -1 ? 0 : s.length - i - 1
}

function formatDelta(current: number, previous: number) {
  const places = Math.max(decimals(current), decimals(previous))
  const delta = Number((current - previous).toFixed(places))
  return { delta, text: `${delta > 0 ? "+" : delta < 0 ? "−" : "±"}${Math.abs(delta).toFixed(places)}` }
}

const flagClasses: Record<ClinicalStatus, string> = {
  normal: "border-clinical-normal/25 bg-clinical-normal/10 text-clinical-normal-foreground",
  watch: "border-clinical-watch/25 bg-clinical-watch/10 text-clinical-watch-foreground",
  abnormal: "border-clinical-abnormal/25 bg-clinical-abnormal/10 text-clinical-abnormal-foreground",
  critical: "border-clinical-critical bg-clinical-critical text-white",
  info: "border-clinical-info/25 bg-clinical-info/10 text-clinical-info-foreground",
  unknown: "border-border bg-muted text-muted-foreground",
}

const valueClasses: Record<ClinicalStatus, string> = {
  normal: "",
  watch: "text-clinical-watch-foreground",
  abnormal: "font-semibold text-clinical-abnormal-foreground",
  critical: "font-semibold text-clinical-critical-foreground",
  info: "",
  unknown: "",
}

/** Compact interpretation flag ("H", "LL"…) with the full meaning for screen readers. */
export function LabFlag({
  interpretation,
  className,
  ...props
}: React.ComponentProps<"span"> & { interpretation?: LabInterpretation }) {
  if (!interpretation || interpretation === "N") return null
  const status = getLabStatus(interpretation)
  return (
    <span
      data-slot="lab-flag"
      data-status={status}
      title={LAB_INTERPRETATION_LABELS[interpretation]}
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 text-[11px] font-bold tracking-wide",
        flagClasses[status],
        className
      )}
      {...props}
    >
      <span aria-hidden>{interpretation}</span>
      <span className="sr-only">{LAB_INTERPRETATION_LABELS[interpretation]}</span>
    </span>
  )
}

function StatusTag({ status }: { status?: LabResultStatus }) {
  if (!status || status === "final") return null
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 text-[11px]",
        status === "preliminary" && "border-clinical-watch/30 text-clinical-watch-foreground",
        (status === "corrected" || status === "amended") && "border-clinical-info/30 text-clinical-info-foreground",
        status === "cancelled" && "text-muted-foreground"
      )}
    >
      {LAB_RESULT_STATUS_LABELS[status]}
    </Badge>
  )
}

const trendConfig = { value: { label: "Result", color: "var(--primary)" } } satisfies ChartConfig

const toneFill: Record<ClinicalStatus, string> = {
  normal: "var(--clinical-normal)",
  watch: "var(--clinical-watch)",
  abnormal: "var(--clinical-abnormal)",
  critical: "var(--clinical-critical)",
  info: "var(--clinical-info)",
  unknown: "var(--muted-foreground)",
}

type TrendRow = { date: string; label: string; value: number; status: ClinicalStatus }

function LabTrend({ result, dateFormat }: { result: LabResult; dateFormat: string }) {
  const range = result.referenceRange
  const data: TrendRow[] = [
    ...[...(result.previous ?? [])].reverse(),
    { value: result.value as number, effectiveDate: result.effectiveDate },
  ].map((p) => ({
    date: p.effectiveDate,
    label: formatDate(p.effectiveDate, "MMM d") ?? p.effectiveDate,
    value: p.value,
    status: getLabStatus(interpretLabValue(p.value, range)),
  }))
  const values = data.map((d) => d.value)
  const lo = Math.min(...values, range?.low ?? Infinity)
  const hi = Math.max(...values, range?.high ?? -Infinity)
  const pad = (hi - lo || Math.abs(hi) || 1) * 0.15
  // Round the axis to a "nice" step (1, 2 or 5 × 10^n) so ticks read like 4, 6, 8 rather than 3.37.
  const magnitude = 10 ** Math.floor(Math.log10(hi - lo + 2 * pad))
  const step = [0.1, 0.2, 0.5, 1, 2, 5].map((m) => m * magnitude).find((s) => (hi - lo + 2 * pad) / s <= 5) ?? magnitude * 10
  const domain: [number, number] = [
    Number((Math.floor((lo - pad) / step) * step).toPrecision(6)),
    Number((Math.ceil((hi + pad) / step) * step).toPrecision(6)),
  ]

  return (
    <div className="flex flex-col gap-2">
      <ChartContainer config={trendConfig} className="aspect-auto h-36 w-full" aria-hidden>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          {range && (range.low != null || range.high != null) && (
            <ReferenceArea
              y1={range.low ?? domain[0]}
              y2={range.high ?? domain[1]}
              fill="var(--clinical-normal)"
              fillOpacity={0.1}
              stroke="none"
              ifOverflow="hidden"
            />
          )}
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} />
          <YAxis
            domain={domain}
            tickLine={false}
            axisLine={false}
            width={40}
            tickMargin={4}
            tickFormatter={(value: number) => String(Number(value.toPrecision(3)))}
          />
          <ChartTooltip
            cursor={false}
            content={({ active, payload }) => {
              const row = active ? (payload?.[0]?.payload as TrendRow | undefined) : undefined
              if (!row) return null
              return (
                <div className="rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
                  <div className="font-medium">{formatDate(row.date, dateFormat)}</div>
                  <div className="tabular-nums">
                    {row.value} {result.unit}
                  </div>
                </div>
              )
            }}
          />
          <Line
            dataKey="value"
            type="monotone"
            stroke="var(--color-value)"
            strokeWidth={2}
            isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; index?: number; payload?: TrendRow }) => (
              <circle
                key={props.index}
                cx={props.cx}
                cy={props.cy}
                r={3.5}
                fill={toneFill[props.payload?.status ?? "unknown"]}
                stroke="var(--background)"
                strokeWidth={1.5}
              />
            )}
          />
        </LineChart>
      </ChartContainer>
      <p className="sr-only">
        Trend for {result.name}:{" "}
        {data.map((d) => `${formatDate(d.date, dateFormat)} ${d.value} ${result.unit ?? ""}`).join("; ")}.
      </p>
      {result.note && <p className="text-xs text-muted-foreground">{result.note}</p>}
    </div>
  )
}

function PreviousCell({ result, dateFormat }: { result: LabResult; dateFormat: string }) {
  const prev = result.previous?.[0]
  if (!prev) return <span className="text-muted-foreground">—</span>
  if (typeof result.value !== "number") {
    return <span className="tabular-nums">{prev.value}</span>
  }
  const { delta, text } = formatDelta(result.value, prev.value)
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus
  const direction = delta > 0 ? "Up" : delta < 0 ? "Down" : "No change"
  const prevDate = formatDate(prev.effectiveDate, dateFormat)
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1.5 tabular-nums">
        <span>{prev.value}</span>
        <span
          role="img"
          aria-label={`${direction}${delta !== 0 ? ` ${Math.abs(delta)}` : ""} from ${prev.value}${result.unit ? ` ${result.unit}` : ""} on ${prevDate}`}
          className="inline-flex items-center gap-0.5 text-xs text-muted-foreground"
        >
          <Icon aria-hidden className="size-3.5" />
          <span aria-hidden>{text}</span>
        </span>
      </span>
      <span className="text-xs text-muted-foreground">{prevDate}</span>
    </div>
  )
}

export interface LabResultsProps extends Omit<React.ComponentProps<"div">, "title"> {
  panels: LabPanel[]
  title?: React.ReactNode
  /** Panel ids open initially. Defaults to all panels. */
  defaultOpenPanels?: string[]
  /** Controlled open panel ids. */
  openPanels?: string[]
  onOpenPanelsChange?: (ids: string[]) => void
  /** Called when a result row is activated (click, Enter or Space). */
  onResultSelect?: (result: LabResult, panel: LabPanel) => void
  /** Show the "Previous" column with delta. */
  showPrevious?: boolean
  /** Controlled "Abnormal only" filter. */
  abnormalOnly?: boolean
  defaultAbnormalOnly?: boolean
  onAbnormalOnlyChange?: (abnormalOnly: boolean) => void
  /** Hide the built-in "Abnormal only" switch. */
  hideFilter?: boolean
  /** date-fns pattern for result dates. */
  dateFormat?: string
  emptyMessage?: React.ReactNode
}

export function LabResults({
  panels,
  title = "Results",
  defaultOpenPanels,
  openPanels: openPanelsProp,
  onOpenPanelsChange,
  onResultSelect,
  showPrevious = true,
  abnormalOnly: abnormalOnlyProp,
  defaultAbnormalOnly = false,
  onAbnormalOnlyChange,
  hideFilter = false,
  dateFormat = "MMM d, yyyy",
  emptyMessage = "No results available.",
  className,
  ...props
}: LabResultsProps) {
  const switchId = React.useId()
  const [abnormalOnlyState, setAbnormalOnlyState] = React.useState(defaultAbnormalOnly)
  const abnormalOnly = abnormalOnlyProp ?? abnormalOnlyState
  const setAbnormalOnly = (next: boolean) => {
    if (abnormalOnlyProp === undefined) setAbnormalOnlyState(next)
    onAbnormalOnlyChange?.(next)
  }

  const [openState, setOpenState] = React.useState<string[]>(() => defaultOpenPanels ?? panels.map((p) => p.id))
  const openPanels = openPanelsProp ?? openState
  const setPanelOpen = (id: string, open: boolean) => {
    const next = open ? [...openPanels.filter((p) => p !== id), id] : openPanels.filter((p) => p !== id)
    if (openPanelsProp === undefined) setOpenState(next)
    onOpenPanelsChange?.(next)
  }

  const [expanded, setExpanded] = React.useState<string[]>([])

  const visible = panels
    .map((panel) => ({ panel, results: abnormalOnly ? panel.results.filter(isAbnormalLabResult) : panel.results }))
    .filter(({ results }) => results.length > 0)
  const total = panels.reduce((n, p) => n + p.results.length, 0)
  const shown = visible.reduce((n, v) => n + v.results.length, 0)
  const columns = showPrevious ? 5 : 4

  return (
    <Card data-slot="lab-results" className={cn("gap-0 py-0", className)} {...props}>
      <CardHeader className="border-b py-4">
        <CardTitle className="flex items-center gap-2">
          <FlaskConical aria-hidden className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
        {!hideFilter && (
          <CardAction className="flex items-center gap-2">
            <Switch id={switchId} checked={abnormalOnly} onCheckedChange={setAbnormalOnly} />
            <Label htmlFor={switchId} className="text-sm font-normal">
              Abnormal only
            </Label>
          </CardAction>
        )}
      </CardHeader>
      <p aria-live="polite" className="sr-only">
        {abnormalOnly ? `Showing ${shown} abnormal of ${total} results` : `Showing ${total} results`}
      </p>
      <CardContent className="px-0">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <FlaskConical aria-hidden className="size-5" />
            {panels.length > 0 && abnormalOnly ? "No abnormal results." : emptyMessage}
          </div>
        ) : (
          <div className="divide-y">
            {visible.map(({ panel, results }) => {
              const open = openPanels.includes(panel.id)
              const statuses = panel.results.map((r) => getLabStatus(getLabInterpretation(r)))
              const critical = statuses.filter((s) => s === "critical").length
              const abnormal = statuses.filter((s) => s === "abnormal").length
              return (
                <Collapsible key={panel.id} open={open} onOpenChange={(o) => setPanelOpen(panel.id, o)}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                    <CollapsibleTrigger className="-mx-1 flex items-center gap-1.5 rounded-md px-1 text-sm font-medium outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                      <ChevronDown
                        aria-hidden
                        className={cn("size-4 text-muted-foreground transition-transform motion-reduce:transition-none", !open && "-rotate-90")}
                      />
                      {panel.name}
                    </CollapsibleTrigger>
                    {panel.collectedAt && (
                      <span className="text-xs text-muted-foreground">
                        Collected {formatDate(panel.collectedAt, `${dateFormat}, HH:mm`)}
                      </span>
                    )}
                    <StatusTag status={panel.status} />
                    <span className="ml-auto flex items-center gap-1.5">
                      {critical > 0 && <ClinicalStatusBadge status="critical">{critical} critical</ClinicalStatusBadge>}
                      {abnormal > 0 && <ClinicalStatusBadge status="abnormal">{abnormal} abnormal</ClinicalStatusBadge>}
                      {critical === 0 && abnormal === 0 && <ClinicalStatusBadge status="normal">All normal</ClinicalStatusBadge>}
                    </span>
                  </div>
                  <CollapsibleContent>
                    <Table className="min-w-[40rem] table-fixed">
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="w-[32%] pl-4">Test</TableHead>
                          <TableHead className="w-[18%]">Result</TableHead>
                          <TableHead className="w-[18%]">Reference range</TableHead>
                          {showPrevious && <TableHead className="w-[17%]">Previous</TableHead>}
                          <TableHead className="w-[15%] pr-4">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((result) => {
                          const interpretation = getLabInterpretation(result)
                          const status = getLabStatus(interpretation)
                          const cancelled = result.status === "cancelled"
                          const hasTrend =
                            typeof result.value === "number" && (result.previous?.length ?? 0) > 0 && !cancelled
                          const expandable = hasTrend || !!result.note
                          const isExpanded = expandable && expanded.includes(result.id)
                          const detailId = `lab-${panel.id}-${result.id}-detail`
                          const toggle = () => {
                            if (expandable) {
                              setExpanded((e) =>
                                e.includes(result.id) ? e.filter((id) => id !== result.id) : [...e, result.id]
                              )
                            }
                            onResultSelect?.(result, panel)
                          }
                          const Chevron = isExpanded ? ChevronDown : ChevronRight
                          return (
                            <React.Fragment key={result.id}>
                              <TableRow
                                data-status={status}
                                data-state={isExpanded ? "selected" : undefined}
                                onClick={toggle}
                                className={cn(
                                  "cursor-pointer",
                                  status === "critical" && "bg-clinical-critical/5",
                                  status === "abnormal" && "bg-clinical-abnormal/5",
                                  isExpanded && "border-b-0"
                                )}
                              >
                                <TableCell className="pl-4">
                                  <button
                                    type="button"
                                    aria-expanded={expandable ? isExpanded : undefined}
                                    aria-controls={isExpanded ? detailId : undefined}
                                    className="flex items-start gap-1.5 rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                                  >
                                    <Chevron
                                      aria-hidden
                                      className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground", !expandable && "invisible")}
                                    />
                                    <span className="flex flex-col">
                                      <span className={cn("font-medium", cancelled && "text-muted-foreground line-through")}>
                                        {result.name}
                                      </span>
                                      {result.code && (
                                        <span className="text-xs text-muted-foreground">LOINC {result.code}</span>
                                      )}
                                    </span>
                                  </button>
                                </TableCell>
                                <TableCell>
                                  <span className="flex flex-wrap items-center gap-1.5">
                                    {cancelled ? (
                                      <span className="text-muted-foreground">—</span>
                                    ) : (
                                      <span className={cn("tabular-nums", valueClasses[status])}>
                                        {result.value}
                                        {result.unit && (
                                          <span className="ml-1 text-xs font-normal text-muted-foreground">{result.unit}</span>
                                        )}
                                      </span>
                                    )}
                                    {!cancelled && <LabFlag interpretation={interpretation} />}
                                    <StatusTag status={result.status} />
                                  </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {formatReferenceRange(result.referenceRange, result.unit) ?? "—"}
                                </TableCell>
                                {showPrevious && (
                                  <TableCell>
                                    <PreviousCell result={result} dateFormat={dateFormat} />
                                  </TableCell>
                                )}
                                <TableCell className="pr-4 text-muted-foreground">
                                  {formatDate(result.effectiveDate, dateFormat)}
                                </TableCell>
                              </TableRow>
                              {isExpanded && (
                                <TableRow id={detailId} className="hover:bg-transparent">
                                  <TableCell colSpan={columns} className="px-4 pt-0 pb-4 whitespace-normal">
                                    {hasTrend ? (
                                      <LabTrend result={result} dateFormat={dateFormat} />
                                    ) : (
                                      <p className="text-xs text-muted-foreground">{result.note}</p>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

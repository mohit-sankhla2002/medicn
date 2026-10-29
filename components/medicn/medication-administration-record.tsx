"use client"

import * as React from "react"
import { addDays, differenceInMinutes, format, isValid, parseISO } from "date-fns"
import {
  AlarmClock,
  Ban,
  CircleCheck,
  CircleDashed,
  CirclePause,
  CircleX,
  Clock,
  Plus,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ClinicalStatusBadge } from "@/components/medicn/clinical-status-badge"
import type { Medication } from "@/components/medicn/medication-list"

// ───────────────────────────── Types ─────────────────────────────

/** A medication order on the MAR. Extends the `Medication` row from medication-list. */
export interface MarOrder extends Medication {
  /** Ordered dose per administration, e.g. "10 units" or "1 g". Pre-filled in the dialog. */
  dose?: string
  /** Scheduled times of day, "HH:mm" (24 h), e.g. ["08:00", "20:00"]. Ignored for PRN orders. */
  scheduleTimes?: string[]
  /** Hospital-defined time-critical medication: 30 minute window (ISMP). */
  timeCritical?: boolean
  /** Override the administration window (minutes before/after the scheduled time) for this order. */
  windowMinutes?: number
  /** ISO date-time the order starts / stops. Slots outside are not shown. */
  orderStart?: string
  orderStop?: string
}

/** Statuses a nurse documents. */
export type RecordedAdministrationStatus = "given" | "held" | "refused" | "missed"

/** Recorded statuses plus the ones derived from the clock. */
export type AdministrationStatus = RecordedAdministrationStatus | "overdue" | "due" | "not-due"

export interface AdministrationRecord {
  id: string
  orderId: string
  /** The scheduled slot this documents, ISO local ("2026-10-29T08:00"). Omit for PRN doses. */
  scheduledTime?: string
  status: RecordedAdministrationStatus
  /** Actual administration (or documentation) time, ISO. */
  time?: string
  /** Dose given, e.g. "8 units". */
  dose?: string
  /** Required for held / refused. */
  reason?: string
  initials?: string
  /** Second clinician for an independent double check (high-alert medications). */
  witnessInitials?: string
}

export type NewAdministrationRecord = Omit<AdministrationRecord, "id">

export interface MarSlot {
  orderId: string
  /** ISO local time of the scheduled slot. Undefined for a PRN dose. */
  scheduledTime?: string
}

export const ADMINISTRATION_STATUS_LABELS: Record<AdministrationStatus, string> = {
  given: "Given",
  held: "Held",
  refused: "Refused",
  missed: "Missed",
  overdue: "Overdue",
  due: "Due",
  "not-due": "Not due",
}

/**
 * FHIR R4 `MedicationAdministration.status` for each documented status. Held, refused and missed
 * doses are `not-done` with a `statusReason`. Due, overdue and not-due are not administrations; they
 * come from the `MedicationRequest` timing and have no resource.
 */
export const ADMINISTRATION_FHIR_STATUS: Record<RecordedAdministrationStatus, "completed" | "not-done"> = {
  given: "completed",
  held: "not-done",
  refused: "not-done",
  missed: "not-done",
}

/**
 * ISMP Acute Care Guidelines for Timely Administration of Scheduled Medications (2011), Table 1:
 * time-critical within 30 min, more often than daily (up to q4h) within 1 h, daily/weekly/monthly
 * within 2 h, before or after the scheduled time.
 */
export const ISMP_TIMELY_WINDOWS = {
  timeCritical: 30,
  moreThanDaily: 60,
  dailyOrLess: 120,
} as const

const statusStyles: Record<AdministrationStatus, { icon: LucideIcon; className: string }> = {
  given: { icon: CircleCheck, className: "bg-clinical-normal/10 text-clinical-normal-foreground border-clinical-normal/25" },
  held: { icon: CirclePause, className: "bg-clinical-watch/10 text-clinical-watch-foreground border-clinical-watch/25" },
  refused: { icon: Ban, className: "bg-clinical-abnormal/10 text-clinical-abnormal-foreground border-clinical-abnormal/25" },
  missed: { icon: CircleX, className: "bg-clinical-critical/10 text-clinical-critical-foreground border-clinical-critical/25" },
  overdue: { icon: AlarmClock, className: "bg-clinical-critical/10 text-clinical-critical-foreground border-clinical-critical/40" },
  due: { icon: Clock, className: "bg-clinical-info/10 text-clinical-info-foreground border-clinical-info/40" },
  "not-due": { icon: CircleDashed, className: "border-transparent text-muted-foreground" },
}

// ───────────────────────────── Pure helpers ─────────────────────────────

const toDate = (value: string | Date) => (typeof value === "string" ? parseISO(value) : value)

/** Window in minutes for an order: explicit override, 30 for time-critical, else `fallback`. */
export function getAdministrationWindow(order: Pick<MarOrder, "timeCritical" | "windowMinutes">, fallback = 60) {
  if (order.windowMinutes !== undefined) return order.windowMinutes
  if (order.timeCritical) return ISMP_TIMELY_WINDOWS.timeCritical
  return fallback
}

export interface AdministrationStatusResult {
  status: AdministrationStatus
  /** Actual − scheduled minutes for a given dose; now − scheduled for an undocumented one. */
  minutesFromScheduled?: number
  /** Given dose outside the window. */
  timing?: "early" | "on-time" | "late"
}

/**
 * Status of one scheduled slot. A documentation record wins; otherwise the slot is `due` from
 * `windowMinutes` before to `windowMinutes` after the scheduled time, `overdue` after that and
 * `not-due` before. Without `now` nothing is derived from the clock.
 */
export function getAdministrationStatus({
  scheduledTime,
  record,
  now,
  windowMinutes = 60,
}: {
  scheduledTime: string | Date
  record?: Pick<AdministrationRecord, "status" | "time">
  now?: string | Date
  windowMinutes?: number
}): AdministrationStatusResult {
  const scheduled = toDate(scheduledTime)
  if (record) {
    if (record.status === "given" && record.time) {
      const actual = toDate(record.time)
      if (isValid(actual) && isValid(scheduled)) {
        const diff = differenceInMinutes(actual, scheduled)
        const timing = diff > windowMinutes ? "late" : diff < -windowMinutes ? "early" : "on-time"
        return { status: "given", minutesFromScheduled: diff, timing }
      }
    }
    return { status: record.status }
  }
  if (now === undefined || !isValid(scheduled)) return { status: "not-due" }
  const diff = differenceInMinutes(toDate(now), scheduled)
  if (diff > windowMinutes) return { status: "overdue", minutesFromScheduled: diff }
  if (diff >= -windowMinutes) return { status: "due", minutesFromScheduled: diff }
  return { status: "not-due", minutesFromScheduled: diff }
}

const sameInstant = (a?: string, b?: string) => {
  if (!a || !b) return false
  const da = parseISO(a)
  const db = parseISO(b)
  return isValid(da) && isValid(db) && da.getTime() === db.getTime()
}

function formatMinutes(minutes: number) {
  const abs = Math.abs(minutes)
  if (abs < 60) return `${abs} min`
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

// ───────────────────────────── Status chip ─────────────────────────────

export function AdministrationStatusLabel({
  status,
  className,
  children,
}: {
  status: AdministrationStatus
  className?: string
  children?: React.ReactNode
}) {
  const { icon: Icon, className: tone } = statusStyles[status]
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", tone, "border-0 bg-transparent", className)}>
      <Icon aria-hidden className="size-3.5 shrink-0" />
      {children ?? ADMINISTRATION_STATUS_LABELS[status]}
    </span>
  )
}

// ───────────────────────────── MAR ─────────────────────────────

export interface MedicationAdministrationRecordProps extends Omit<React.ComponentProps<"div">, "children" | "title"> {
  orders: MarOrder[]
  administrations?: AdministrationRecord[]
  /** First day shown, "yyyy-MM-dd". */
  startDate: string
  /** Number of days, 1–7. */
  days?: number
  /** Current time; drives due / overdue. Pass it explicitly so server and client match. */
  now?: string | Date
  /** Default window (minutes before/after) for orders that are not time-critical. */
  windowMinutes?: number
  /** Called when a due or overdue cell (or a PRN "Record" button) is activated. */
  onRecord?: (slot: MarSlot) => void
  title?: React.ReactNode
  /** Hide the legend under the grid. */
  hideLegend?: boolean
}

export function MedicationAdministrationRecord({
  orders,
  administrations = [],
  startDate,
  days = 3,
  now,
  windowMinutes = 60,
  onRecord,
  title = "Medication administration record",
  hideLegend = false,
  className,
  ...props
}: MedicationAdministrationRecordProps) {
  const dayCount = Math.min(7, Math.max(1, Math.round(days)))
  const start = parseISO(startDate.slice(0, 10))
  const dayDates = Array.from({ length: dayCount }, (_, i) => addDays(start, i))
  const dayKeys = dayDates.map((d) => format(d, "yyyy-MM-dd"))
  const nowDate = now === undefined ? undefined : toDate(now)

  const times = React.useMemo(() => {
    const set = new Set<string>()
    for (const order of orders) if (!order.prn) for (const t of order.scheduleTimes ?? []) set.add(t)
    return [...set].sort()
  }, [orders])
  const slotsPerDay = Math.max(1, times.length)

  const recordsByOrder = React.useMemo(() => {
    const map = new Map<string, AdministrationRecord[]>()
    for (const record of administrations) {
      const list = map.get(record.orderId) ?? []
      list.push(record)
      map.set(record.orderId, list)
    }
    return map
  }, [administrations])

  const inOrderRange = (order: MarOrder, slot: Date) => {
    const from = order.orderStart ? parseISO(order.orderStart) : undefined
    const to = order.orderStop ? parseISO(order.orderStop) : undefined
    if (from && isValid(from) && slot < from) return false
    if (to && isValid(to) && slot >= to) return false
    return true
  }

  // Counts for the header.
  let dueCount = 0
  let overdueCount = 0
  const cellData = orders.map((order) => {
    const records = recordsByOrder.get(order.id) ?? []
    const window = getAdministrationWindow(order, windowMinutes)
    if (order.prn) {
      return dayKeys.map((key) =>
        records
          .filter((r) => !r.scheduledTime && r.time?.startsWith(key))
          .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))
      )
    }
    return dayKeys.map((key) =>
      times.map((time) => {
        if (!order.scheduleTimes?.includes(time)) return null
        const scheduledTime = `${key}T${time}`
        const slotDate = parseISO(scheduledTime)
        if (!inOrderRange(order, slotDate)) return null
        const record = records.find((r) => sameInstant(r.scheduledTime, scheduledTime))
        const result = getAdministrationStatus({ scheduledTime: slotDate, record, now: nowDate, windowMinutes: window })
        if (result.status === "due") dueCount++
        if (result.status === "overdue") overdueCount++
        return { scheduledTime, record, result, window }
      })
    )
  })

  const widthRem = 16 + dayCount * slotsPerDay * 7
  const stickyCol = "sticky left-0 z-10 bg-card border-r"
  const isToday = (d: Date) => nowDate !== undefined && format(d, "yyyy-MM-dd") === format(nowDate, "yyyy-MM-dd")
  const dayBorder = (slotIndex: number) => (slotIndex === 0 ? "border-l" : "")

  const withTooltip = (node: React.ReactElement, text?: string) =>
    text ? (
      <Tooltip>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    ) : (
      node
    )

  return (
    <TooltipProvider>
      <div
        data-slot="medication-administration-record"
        className={cn("flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground", className)}
        {...props}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {format(dayDates[0], "MMM d")} – {format(dayDates[dayDates.length - 1], "MMM d, yyyy")}
              {nowDate && ` · as of ${format(nowDate, "MMM d, HH:mm")}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-live="polite">
            {overdueCount > 0 && <ClinicalStatusBadge status="critical">{overdueCount} overdue</ClinicalStatusBadge>}
            {dueCount > 0 && <ClinicalStatusBadge status="info">{dueCount} due now</ClinicalStatusBadge>}
            {nowDate && overdueCount === 0 && dueCount === 0 && <ClinicalStatusBadge status="normal">Nothing due</ClinicalStatusBadge>}
          </div>
        </div>

        <Table
          className="table-fixed border-separate border-spacing-0 [&_td]:border-b [&_th]:border-b"
          style={{ width: `${widthRem}rem`, minWidth: "100%" }}
        >
          <caption className="sr-only">
            Medication administration record. Rows are medication orders, columns are scheduled times for each day.
          </caption>
          <colgroup>
            <col style={{ width: "16rem" }} />
            {dayKeys.flatMap((key) =>
              Array.from({ length: slotsPerDay }, (_, i) => <col key={`${key}-${i}`} style={{ width: "7rem" }} />)
            )}
          </colgroup>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead rowSpan={2} scope="col" className={cn(stickyCol, "z-20 align-bottom")}>
                Medication
              </TableHead>
              {dayDates.map((d, i) => (
                <TableHead
                  key={dayKeys[i]}
                  colSpan={slotsPerDay}
                  scope="colgroup"
                  className={cn("border-l text-center", isToday(d) && "bg-muted")}
                >
                  {format(d, "EEE MMM d")}
                  {isToday(d) && <span className="ml-1 text-xs font-normal text-muted-foreground">(today)</span>}
                </TableHead>
              ))}
            </TableRow>
            <TableRow className="hover:bg-transparent">
              {dayKeys.flatMap((key, d) =>
                Array.from({ length: slotsPerDay }, (_, i) => (
                  <TableHead
                    key={`${key}-${i}`}
                    scope="col"
                    className={cn("h-8 text-center text-xs tabular-nums text-muted-foreground", dayBorder(i), isToday(dayDates[d]) && "bg-muted/60")}
                  >
                    {times[i] ?? "PRN"}
                  </TableHead>
                ))
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order, o) => (
              <TableRow key={order.id} className="hover:bg-transparent">
                <TableHead scope="row" className={cn(stickyCol, "h-auto py-2 align-top font-normal whitespace-normal")}>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">{order.name}</span>
                      {order.strength && <span className="text-xs text-muted-foreground">{order.strength}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {[order.dose, order.route, order.prn ? "as needed" : order.frequency].filter(Boolean).join(" · ")}
                      {order.prn && order.indication && ` for ${order.indication}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-1">
                      {order.highAlert && (
                        <span className="inline-flex items-center gap-1 rounded border border-clinical-critical/30 bg-clinical-critical/10 px-1 text-[10px] font-semibold tracking-wide text-clinical-critical-foreground uppercase">
                          <TriangleAlert aria-hidden className="size-3" />
                          High alert
                        </span>
                      )}
                      {order.prn && (
                        <span className="rounded border px-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                          PRN
                        </span>
                      )}
                      {order.timeCritical && (
                        <span className="rounded border px-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                          Time-critical
                        </span>
                      )}
                      {order.prn && onRecord && (
                        <Button
                          size="xs"
                          variant="outline"
                          className="ml-auto"
                          onClick={() => onRecord({ orderId: order.id })}
                          aria-label={`Record PRN dose of ${order.name}`}
                        >
                          <Plus /> Record
                        </Button>
                      )}
                    </div>
                  </div>
                </TableHead>

                {order.prn
                  ? (cellData[o] as AdministrationRecord[][]).map((records, d) => (
                      <TableCell
                        key={dayKeys[d]}
                        colSpan={slotsPerDay}
                        className={cn("border-l align-top whitespace-normal", isToday(dayDates[d]) && "bg-muted/30")}
                      >
                        {records.length === 0 ? (
                          <span className="text-xs text-muted-foreground">No PRN doses</span>
                        ) : (
                          <ul className="flex flex-wrap gap-1.5">
                            {records.map((r) => (
                              <li key={r.id}>
                                {withTooltip(
                                  <span
                                    tabIndex={0}
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                      statusStyles[r.status].className
                                    )}
                                  >
                                    <AdministrationStatusLabel status={r.status}>
                                      {r.status === "given" ? "PRN given" : ADMINISTRATION_STATUS_LABELS[r.status]}
                                    </AdministrationStatusLabel>
                                    <span className="tabular-nums">
                                      {r.time && format(parseISO(r.time), "HH:mm")}
                                      {r.initials && ` · ${r.initials}`}
                                    </span>
                                  </span>,
                                  [r.dose, r.reason].filter(Boolean).join(" — ") || undefined
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </TableCell>
                    ))
                  : (cellData[o] as ({ scheduledTime: string; record?: AdministrationRecord; result: AdministrationStatusResult; window: number } | null)[][]).flatMap(
                      (slots, d) =>
                        slots.map((slot, i) => {
                          const today = isToday(dayDates[d]) && "bg-muted/30"
                          if (!slot)
                            return (
                              <TableCell key={`${dayKeys[d]}-${i}`} className={cn(dayBorder(i), today)}>
                                <span className="sr-only">Not scheduled</span>
                              </TableCell>
                            )
                          const { result, record, scheduledTime, window } = slot
                          const status = result.status
                          const timeLabel = format(parseISO(scheduledTime), "MMM d HH:mm")
                          let detail: React.ReactNode = null
                          let tooltip: string | undefined
                          if (status === "given" && record) {
                            detail = [record.time && format(parseISO(record.time), "HH:mm"), record.initials].filter(Boolean).join(" · ")
                            tooltip = [
                              record.dose && `Dose ${record.dose}`,
                              record.witnessInitials && `Double-checked by ${record.witnessInitials}`,
                              result.timing && result.timing !== "on-time" && result.minutesFromScheduled !== undefined
                                ? `${formatMinutes(result.minutesFromScheduled)} ${result.timing} (window ±${window} min)`
                                : undefined,
                              record.reason,
                            ]
                              .filter(Boolean)
                              .join(" · ") || undefined
                          } else if ((status === "held" || status === "refused" || status === "missed") && record) {
                            detail = record.reason
                            tooltip = [record.reason, record.initials && `by ${record.initials}`, record.time && format(parseISO(record.time), "HH:mm")]
                              .filter(Boolean)
                              .join(" · ") || undefined
                          } else if (status === "overdue" && result.minutesFromScheduled !== undefined) {
                            detail = `${formatMinutes(result.minutesFromScheduled)} late`
                          } else if (status === "due") {
                            detail = `window ±${window} min`
                          }

                          const content = (
                            <span className="flex min-w-0 flex-col items-start gap-0.5">
                              <AdministrationStatusLabel status={status}>
                                {ADMINISTRATION_STATUS_LABELS[status]}
                                {result.timing === "late" && " (late)"}
                                {result.timing === "early" && " (early)"}
                              </AdministrationStatusLabel>
                              {detail && <span className="w-full truncate text-[11px] tabular-nums opacity-90">{detail}</span>}
                            </span>
                          )

                          const actionable = Boolean(onRecord) && (status === "due" || status === "overdue")
                          const boxClass = cn(
                            "flex w-full min-h-11 items-center rounded-md border px-1.5 py-1 text-left",
                            statusStyles[status].className
                          )
                          const label = `${order.name} ${timeLabel}: ${ADMINISTRATION_STATUS_LABELS[status]}`

                          return (
                            <TableCell key={`${dayKeys[d]}-${i}`} className={cn("p-1", dayBorder(i), today)}>
                              {actionable ? (
                                <button
                                  type="button"
                                  onClick={() => onRecord?.({ orderId: order.id, scheduledTime })}
                                  aria-label={`${label}. Record administration`}
                                  className={cn(
                                    boxClass,
                                    "cursor-pointer outline-none hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring",
                                    status === "overdue" && "border-dashed"
                                  )}
                                >
                                  {content}
                                </button>
                              ) : (
                                withTooltip(
                                  <div
                                    tabIndex={tooltip ? 0 : undefined}
                                    aria-label={tooltip ? `${label}. ${tooltip}` : undefined}
                                    className={cn(boxClass, tooltip && "outline-none focus-visible:ring-2 focus-visible:ring-ring")}
                                  >
                                    {content}
                                  </div>,
                                  tooltip
                                )
                              )}
                            </TableCell>
                          )
                        })
                    )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!hideLegend && (
          <ul aria-label="Legend" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t px-4 py-2 text-xs text-muted-foreground">
            {(Object.keys(ADMINISTRATION_STATUS_LABELS) as AdministrationStatus[]).map((status) => (
              <li key={status}>
                <AdministrationStatusLabel status={status} />
              </li>
            ))}
            <li className="inline-flex items-center gap-1">
              <TriangleAlert aria-hidden className="size-3.5 text-clinical-critical-foreground" />
              High-alert medication (ISMP)
            </li>
            <li>
              Due = within ±{windowMinutes} min of the scheduled time (±{ISMP_TIMELY_WINDOWS.timeCritical} min if time-critical)
            </li>
          </ul>
        )}
      </div>
    </TooltipProvider>
  )
}

// ───────────────────────────── AdministrationDialog ─────────────────────────────

export interface AdministrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: MarOrder
  /** ISO scheduled slot being documented. Undefined for a PRN dose. */
  scheduledTime?: string
  /** Initial administration time, "yyyy-MM-ddTHH:mm". Pass `now`. */
  defaultTime?: string
  defaultInitials?: string
  onSubmit: (record: NewAdministrationRecord) => void
}

type DialogStatus = "given" | "held" | "refused"
type DialogErrorKey = "time" | "dose" | "reason" | "initials"

export function AdministrationDialog({
  open,
  onOpenChange,
  order,
  scheduledTime,
  defaultTime,
  defaultInitials = "",
  onSubmit,
}: AdministrationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{order ? `Document ${order.name}` : "Document administration"}</DialogTitle>
          <DialogDescription>
            {[order?.strength, order?.dose, order?.route].filter(Boolean).join(" · ")}
            {scheduledTime ? ` — scheduled ${format(parseISO(scheduledTime), "MMM d, HH:mm")}` : order?.prn ? " — PRN dose" : ""}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <AdministrationForm
            key={`${order?.id}-${scheduledTime}`}
            order={order}
            scheduledTime={scheduledTime}
            defaultTime={defaultTime}
            defaultInitials={defaultInitials}
            onCancel={() => onOpenChange(false)}
            onSubmit={(record) => {
              onSubmit(record)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function AdministrationForm({
  order,
  scheduledTime,
  defaultTime,
  defaultInitials,
  onSubmit,
  onCancel,
}: Omit<AdministrationDialogProps, "open" | "onOpenChange"> & { onCancel: () => void }) {
  const id = React.useId()
  const formRef = React.useRef<HTMLFormElement>(null)
  const [status, setStatus] = React.useState<DialogStatus>("given")
  const [time, setTime] = React.useState((defaultTime ?? scheduledTime ?? "").slice(0, 16))
  const [dose, setDose] = React.useState(order?.dose ?? "")
  const [reason, setReason] = React.useState("")
  const [initials, setInitials] = React.useState(defaultInitials ?? "")
  const [witness, setWitness] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)
  const [focusError, setFocusError] = React.useState(0)

  const errors = React.useMemo(() => {
    const result: Partial<Record<DialogErrorKey, string>> = {}
    if (!time || !isValid(parseISO(time))) result.time = "Enter the time"
    if (status === "given" && !dose.trim()) result.dose = "Enter the dose given"
    if (status !== "given" && !reason.trim()) result.reason = `Enter why the dose was ${status}`
    if (!/^[A-Za-z]{2,4}$/.test(initials.trim())) result.initials = "Enter 2–4 letter initials"
    return result
  }, [time, status, dose, reason, initials])

  React.useEffect(() => {
    if (!focusError) return
    formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus()
  }, [focusError])

  const show = (key: DialogErrorKey) => (submitted ? errors[key] : undefined)
  const errorProps = (key: DialogErrorKey) => ({
    "aria-invalid": show(key) ? true : undefined,
    "aria-describedby": show(key) ? `${id}-${key}-error` : undefined,
  })
  const error = (key: DialogErrorKey) => (show(key) ? <FieldError id={`${id}-${key}-error`}>{show(key)}</FieldError> : null)

  const handleSubmit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      setFocusError((n) => n + 1)
      return
    }
    onSubmit({
      orderId: order?.id ?? "",
      scheduledTime,
      status,
      time,
      dose: status === "given" ? dose.trim() : undefined,
      reason: reason.trim() || undefined,
      initials: initials.trim().toUpperCase(),
      witnessInitials: witness.trim() ? witness.trim().toUpperCase() : undefined,
    })
  }

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      {order?.highAlert && (
        <div className="flex gap-2 rounded-lg border border-clinical-critical/30 bg-clinical-critical/10 p-3 text-sm text-clinical-critical-foreground sm:col-span-2">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <p>High-alert medication. Follow your policy for an independent double check before giving.</p>
        </div>
      )}
      <Field>
        <FieldLabel htmlFor={`${id}-status`}>Status</FieldLabel>
        <Select value={status} onValueChange={(value) => setStatus(value as DialogStatus)}>
          <SelectTrigger id={`${id}-status`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["given", "held", "refused"] as const).map((s) => (
              <SelectItem key={s} value={s}>
                <AdministrationStatusLabel status={s} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field data-invalid={Boolean(show("time")) || undefined}>
        <FieldLabel htmlFor={`${id}-time`}>Time</FieldLabel>
        <Input id={`${id}-time`} type="datetime-local" value={time} onChange={(e) => setTime(e.target.value)} {...errorProps("time")} />
        {error("time")}
      </Field>
      {status === "given" ? (
        <Field data-invalid={Boolean(show("dose")) || undefined} className="sm:col-span-2">
          <FieldLabel htmlFor={`${id}-dose`}>Dose given</FieldLabel>
          <Input id={`${id}-dose`} autoComplete="off" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 10 units" {...errorProps("dose")} />
          <FieldDescription>Write &ldquo;units&rdquo; in full; no trailing zeros (ISMP).</FieldDescription>
          {error("dose")}
        </Field>
      ) : (
        <Field data-invalid={Boolean(show("reason")) || undefined} className="sm:col-span-2">
          <FieldLabel htmlFor={`${id}-reason`}>Reason</FieldLabel>
          <Input
            id={`${id}-reason`}
            autoComplete="off"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={status === "held" ? "e.g. BP 88/50, NPO for procedure" : "e.g. Nauseated, declined"}
            {...errorProps("reason")}
          />
          {error("reason")}
        </Field>
      )}
      <Field data-invalid={Boolean(show("initials")) || undefined}>
        <FieldLabel htmlFor={`${id}-initials`}>Initials</FieldLabel>
        <Input
          id={`${id}-initials`}
          autoComplete="off"
          maxLength={4}
          value={initials}
          onChange={(e) => setInitials(e.target.value)}
          className="uppercase"
          {...errorProps("initials")}
        />
        {error("initials")}
      </Field>
      {order?.highAlert && status === "given" && (
        <Field>
          <FieldLabel htmlFor={`${id}-witness`}>Double check by</FieldLabel>
          <Input
            id={`${id}-witness`}
            autoComplete="off"
            maxLength={4}
            value={witness}
            onChange={(e) => setWitness(e.target.value)}
            className="uppercase"
            placeholder="Initials"
          />
        </Field>
      )}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  )
}

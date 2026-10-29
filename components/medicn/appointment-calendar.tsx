"use client"

import * as React from "react"
import {
  addDays,
  addMinutes,
  addMonths,
  addWeeks,
  differenceInMinutes,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWeekend,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon, VideoIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "checked-in"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show"

export interface Appointment {
  id: string
  /** Usually the patient name. */
  title: string
  start: Date
  end: Date
  status?: AppointmentStatus
  /** Visit type, e.g. "Follow-up", "New patient". */
  type?: string
  providerId?: string
  location?: string
  telehealth?: boolean
}

export interface CalendarProvider {
  id: string
  name: string
  specialty?: string
}

export type CalendarView = "day" | "week" | "month"

export interface CalendarSlot {
  start: Date
  end: Date
  providerId?: string
}

export interface AppointmentCalendarProps {
  appointments: Appointment[]
  view?: CalendarView
  defaultView?: CalendarView
  onViewChange?: (view: CalendarView) => void
  date?: Date
  defaultDate?: Date
  onDateChange?: (date: Date) => void
  providers?: CalendarProvider[]
  startHour?: number
  endHour?: number
  slotMinutes?: number
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  hideWeekends?: boolean
  /** Height in px of one hour in day/week views. */
  hourHeight?: number
  /** Max height of the scrollable time grid. */
  maxHeight?: number | string
  onAppointmentClick?: (appointment: Appointment) => void
  onSlotClick?: (slot: CalendarSlot) => void
  renderAppointment?: (appointment: Appointment) => React.ReactNode
  /** Draws a current-time indicator and highlights today. */
  now?: Date
  className?: string
}

/* -------------------------------------------------------------------------- */
/*                                   Status                                   */
/* -------------------------------------------------------------------------- */

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  "checked-in": "Checked in",
  "in-progress": "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No-show",
}

const STATUS_STYLES: Record<
  AppointmentStatus,
  { block: string; dot: string; badge: string }
> = {
  scheduled: {
    block:
      "border-border bg-card text-card-foreground before:bg-primary hover:bg-muted",
    dot: "bg-primary",
    badge: "border-border bg-secondary text-secondary-foreground",
  },
  confirmed: {
    block:
      "border-clinical-info/30 bg-[color-mix(in_oklch,var(--clinical-info)_12%,var(--card))] text-card-foreground before:bg-clinical-info hover:bg-[color-mix(in_oklch,var(--clinical-info)_20%,var(--card))]",
    dot: "bg-clinical-info",
    badge: "border-clinical-info/25 bg-clinical-info/10 text-clinical-info-foreground",
  },
  "checked-in": {
    block:
      "border-primary/30 bg-[color-mix(in_oklch,var(--primary)_12%,var(--card))] text-card-foreground before:bg-primary hover:bg-[color-mix(in_oklch,var(--primary)_20%,var(--card))]",
    dot: "bg-primary",
    badge: "border-primary/25 bg-primary/10 text-primary",
  },
  "in-progress": {
    block:
      "border-clinical-watch/30 bg-[color-mix(in_oklch,var(--clinical-watch)_12%,var(--card))] text-card-foreground before:bg-clinical-watch hover:bg-[color-mix(in_oklch,var(--clinical-watch)_20%,var(--card))]",
    dot: "bg-clinical-watch",
    badge: "border-clinical-watch/25 bg-clinical-watch/10 text-clinical-watch-foreground",
  },
  completed: {
    block:
      "border-clinical-normal/30 bg-[color-mix(in_oklch,var(--clinical-normal)_12%,var(--card))] text-card-foreground before:bg-clinical-normal hover:bg-[color-mix(in_oklch,var(--clinical-normal)_20%,var(--card))]",
    dot: "bg-clinical-normal",
    badge: "border-clinical-normal/25 bg-clinical-normal/10 text-clinical-normal-foreground",
  },
  cancelled: {
    block:
      "border-dashed border-border bg-muted text-muted-foreground before:bg-muted-foreground/40 hover:bg-muted/70",
    dot: "bg-muted-foreground/50",
    badge: "border-border bg-muted text-muted-foreground line-through",
  },
  "no-show": {
    block:
      "border-clinical-critical/30 bg-[color-mix(in_oklch,var(--clinical-critical)_12%,var(--card))] text-card-foreground before:bg-clinical-critical hover:bg-[color-mix(in_oklch,var(--clinical-critical)_20%,var(--card))]",
    dot: "bg-clinical-critical",
    badge: "border-clinical-critical/25 bg-clinical-critical/10 text-clinical-critical-foreground",
  },
}

export interface AppointmentStatusBadgeProps
  extends React.ComponentProps<"span"> {
  status: AppointmentStatus
}

export function AppointmentStatusBadge({
  status,
  className,
  children,
  ...props
}: AppointmentStatusBadgeProps) {
  const styles = STATUS_STYLES[status]
  return (
    <span
      data-slot="appointment-status-badge"
      data-status={status}
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center gap-1.5 rounded-full border px-2 text-xs font-medium whitespace-nowrap",
        styles.badge,
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 rounded-full", styles.dot)}
      />
      {children ?? APPOINTMENT_STATUS_LABELS[status]}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function useControllable<T>(
  value: T | undefined,
  initial: () => T,
  onChange?: (value: T) => void
): [T, (value: T) => void] {
  const [internal, setInternal] = React.useState<T>(() =>
    value !== undefined ? value : initial()
  )
  const current = value !== undefined ? value : internal
  const set = React.useCallback(
    (next: T) => {
      setInternal(next)
      onChange?.(next)
    },
    [onChange]
  )
  return [current, set]
}

const dayKey = (d: Date) => format(d, "yyyy-MM-dd")

function formatTimeRange(start: Date, end: Date) {
  const sameMeridiem = format(start, "a") === format(end, "a")
  return sameMeridiem
    ? `${format(start, "h:mm")} – ${format(end, "h:mm a")}`
    : `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`
}

function formatPeriodTitle(start: Date, end: Date) {
  if (start.getFullYear() !== end.getFullYear())
    return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`
  if (start.getMonth() !== end.getMonth())
    return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
  if (isSameDay(start, end)) return format(start, "EEEE, MMM d, yyyy")
  return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`
}

function initials(name: string) {
  return name
    .replace(/^(dr|mr|mrs|ms)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

function describeAppointment(
  appt: Appointment,
  providerName?: string
): string {
  return [
    appt.title,
    appt.type,
    `${format(appt.start, "EEEE, MMMM d")}, ${formatTimeRange(appt.start, appt.end)}`,
    appt.status ? APPOINTMENT_STATUS_LABELS[appt.status] : undefined,
    providerName ? `with ${providerName}` : undefined,
    appt.telehealth ? "Telehealth" : appt.location,
  ]
    .filter(Boolean)
    .join(", ")
}

interface PositionedAppointment {
  appointment: Appointment
  start: number
  end: number
  column: number
  span: number
  columns: number
}

/**
 * Lays out overlapping appointments side by side. Appointments are grouped
 * into clusters of transitively-overlapping events, greedily packed into the
 * first free column, then expanded to the right into any free columns.
 */
function layoutAppointments(
  appointments: Appointment[],
  rangeStart: Date,
  rangeMinutes: number,
  minDuration: number
): PositionedAppointment[] {
  const items = appointments
    .map((appointment) => {
      const s = differenceInMinutes(appointment.start, rangeStart)
      const e = differenceInMinutes(appointment.end, rangeStart)
      return { appointment, rawStart: s, rawEnd: e }
    })
    .filter((i) => i.rawEnd > 0 && i.rawStart < rangeMinutes)
    .map((i) => {
      const start = Math.max(0, i.rawStart)
      const end = Math.min(
        rangeMinutes,
        Math.max(i.rawEnd, start + minDuration)
      )
      return { appointment: i.appointment, start, end }
    })
    .sort((a, b) => a.start - b.start || b.end - a.end)

  const result: PositionedAppointment[] = []
  let cluster: PositionedAppointment[] = []
  let columnEnds: number[] = []
  let clusterEnd = -1

  const flush = () => {
    const columns = columnEnds.length
    for (const item of cluster) {
      item.columns = columns
      let span = 1
      for (let c = item.column + 1; c < columns; c++) {
        const blocked = cluster.some(
          (o) => o.column === c && o.start < item.end && o.end > item.start
        )
        if (blocked) break
        span++
      }
      item.span = span
      result.push(item)
    }
    cluster = []
    columnEnds = []
    clusterEnd = -1
  }

  for (const item of items) {
    if (item.start >= clusterEnd) flush()
    let column = columnEnds.findIndex((end) => end <= item.start)
    if (column === -1) {
      column = columnEnds.length
      columnEnds.push(item.end)
    } else {
      columnEnds[column] = item.end
    }
    cluster.push({ ...item, column, span: 1, columns: 1 })
    clusterEnd = Math.max(clusterEnd, item.end)
  }
  flush()
  return result
}

/* -------------------------------------------------------------------------- */
/*                                  Component                                 */
/* -------------------------------------------------------------------------- */

interface GridColumn {
  key: string
  date: Date
  providerId?: string
  provider?: CalendarProvider
  unassigned?: boolean
}

const GUTTER_WIDTH = 56

export function AppointmentCalendar({
  appointments,
  view: viewProp,
  defaultView = "week",
  onViewChange,
  date: dateProp,
  defaultDate,
  onDateChange,
  providers,
  startHour = 7,
  endHour = 19,
  slotMinutes = 30,
  weekStartsOn = 1,
  hideWeekends = false,
  hourHeight = 72,
  maxHeight = 640,
  onAppointmentClick,
  onSlotClick,
  renderAppointment,
  now,
  className,
}: AppointmentCalendarProps) {
  const [view, setView] = useControllable<CalendarView>(
    viewProp,
    () => defaultView,
    onViewChange
  )
  const [date, setDate] = useControllable<Date>(
    dateProp,
    () => defaultDate ?? new Date(),
    onDateChange
  )

  const byDay = React.useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const appt of appointments) {
      const key = dayKey(appt.start)
      const list = map.get(key)
      if (list) list.push(appt)
      else map.set(key, [appt])
    }
    for (const list of map.values())
      list.sort((a, b) => a.start.getTime() - b.start.getTime())
    return map
  }, [appointments])

  const providerById = React.useMemo(
    () => new Map((providers ?? []).map((p) => [p.id, p])),
    [providers]
  )

  const weekDays = React.useMemo(() => {
    const start = startOfWeek(date, { weekStartsOn })
    return Array.from({ length: 7 }, (_, i) => addDays(start, i)).filter(
      (d) => !hideWeekends || !isWeekend(d)
    )
  }, [date, weekStartsOn, hideWeekends])

  const title = React.useMemo(() => {
    if (view === "day") return format(date, "EEEE, MMM d, yyyy")
    if (view === "month") return format(date, "MMMM yyyy")
    return formatPeriodTitle(weekDays[0], weekDays[weekDays.length - 1])
  }, [view, date, weekDays])

  const navigate = (direction: -1 | 1) => {
    if (view === "day") {
      let next = addDays(date, direction)
      if (hideWeekends) while (isWeekend(next)) next = addDays(next, direction)
      setDate(next)
    } else if (view === "week") setDate(addWeeks(date, direction))
    else setDate(addMonths(date, direction))
  }

  const openDay = (d: Date) => {
    setDate(d)
    setView("day")
  }

  return (
    <div
      data-slot="appointment-calendar"
      role="region"
      aria-label="Appointment calendar"
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl border bg-background text-foreground",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDate(now ?? new Date())}
          >
            Today
          </Button>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Previous ${view}`}
              onClick={() => navigate(-1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Next ${view}`}
              onClick={() => navigate(1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
          <h2
            aria-live="polite"
            className="truncate text-sm font-semibold sm:text-base"
          >
            {title}
          </h2>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={0}
          value={view}
          onValueChange={(v) => v && setView(v as CalendarView)}
          aria-label="Calendar view"
        >
          <ToggleGroupItem value="day" className="px-3">
            Day
          </ToggleGroupItem>
          <ToggleGroupItem value="week" className="px-3">
            Week
          </ToggleGroupItem>
          <ToggleGroupItem value="month" className="px-3">
            Month
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {view === "month" ? (
        <MonthGrid
          date={date}
          byDay={byDay}
          weekStartsOn={weekStartsOn}
          hideWeekends={hideWeekends}
          now={now}
          providerById={providerById}
          onAppointmentClick={onAppointmentClick}
          onOpenDay={openDay}
        />
      ) : (
        <TimeGrid
          view={view}
          days={view === "day" ? [date] : weekDays}
          byDay={byDay}
          providers={view === "day" ? providers : undefined}
          providerById={providerById}
          startHour={startHour}
          endHour={endHour}
          slotMinutes={slotMinutes}
          hourHeight={hourHeight}
          maxHeight={maxHeight}
          now={now}
          onAppointmentClick={onAppointmentClick}
          onSlotClick={onSlotClick}
          renderAppointment={renderAppointment}
          onOpenDay={openDay}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  Time grid                                 */
/* -------------------------------------------------------------------------- */

interface TimeGridProps {
  view: CalendarView
  days: Date[]
  byDay: Map<string, Appointment[]>
  providers?: CalendarProvider[]
  providerById: Map<string, CalendarProvider>
  startHour: number
  endHour: number
  slotMinutes: number
  hourHeight: number
  maxHeight: number | string
  now?: Date
  onAppointmentClick?: (appointment: Appointment) => void
  onSlotClick?: (slot: CalendarSlot) => void
  renderAppointment?: (appointment: Appointment) => React.ReactNode
  onOpenDay: (date: Date) => void
}

function TimeGrid({
  view,
  days,
  byDay,
  providers,
  providerById,
  startHour,
  endHour,
  slotMinutes,
  hourHeight,
  maxHeight,
  now,
  onAppointmentClick,
  onSlotClick,
  renderAppointment,
  onOpenDay,
}: TimeGridProps) {
  const gridRef = React.useRef<HTMLDivElement>(null)
  const [activeSlot, setActiveSlot] = React.useState("0:0")

  const rangeMinutes = Math.max(1, (endHour - startHour) * 60)
  const pxPerMinute = hourHeight / 60
  const bodyHeight = rangeMinutes * pxPerMinute
  const slotCount = Math.ceil(rangeMinutes / slotMinutes)
  const hours = Array.from({ length: endHour - startHour }, (_, i) => i)
  const resourceView = view === "day" && !!providers?.length

  const columns: GridColumn[] = React.useMemo(() => {
    if (!resourceView || !providers) {
      return days.map((d) => ({ key: dayKey(d), date: d }))
    }
    const d = days[0]
    const cols: GridColumn[] = providers.map((p) => ({
      key: `${dayKey(d)}-${p.id}`,
      date: d,
      providerId: p.id,
      provider: p,
    }))
    const hasUnassigned = (byDay.get(dayKey(d)) ?? []).some(
      (a) => !a.providerId || !providerById.has(a.providerId)
    )
    if (hasUnassigned)
      cols.push({ key: `${dayKey(d)}-unassigned`, date: d, unassigned: true })
    return cols
  }, [resourceView, providers, days, byDay, providerById])

  const minColumnWidth = resourceView ? 150 : view === "week" ? 108 : 0
  const gridTemplateColumns = `${GUTTER_WIDTH}px repeat(${columns.length}, minmax(${minColumnWidth}px, 1fr))`

  // Roving tab stop: fall back to the first slot if the remembered one no
  // longer exists (e.g. after switching from week to day view).
  const [activeCol, activeRow] = activeSlot.split(":").map(Number)
  const tabStop =
    activeCol < columns.length && activeRow < slotCount ? activeSlot : "0:0"

  const appointmentsFor = (col: GridColumn) => {
    const list = byDay.get(dayKey(col.date)) ?? []
    if (col.unassigned)
      return list.filter(
        (a) => !a.providerId || !providerById.has(a.providerId)
      )
    if (col.providerId) return list.filter((a) => a.providerId === col.providerId)
    return list
  }

  const focusSlot = (colIndex: number, row: number) => {
    const c = Math.min(Math.max(colIndex, 0), columns.length - 1)
    const r = Math.min(Math.max(row, 0), slotCount - 1)
    const key = `${c}:${r}`
    setActiveSlot(key)
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-slot-key="${key}"]`)
      ?.focus()
  }

  const handleSlotKeyDown = (
    e: React.KeyboardEvent,
    colIndex: number,
    row: number
  ) => {
    const moves: Record<string, [number, number]> = {
      ArrowUp: [colIndex, row - 1],
      ArrowDown: [colIndex, row + 1],
      ArrowLeft: [colIndex - 1, row],
      ArrowRight: [colIndex + 1, row],
      Home: [colIndex, 0],
      End: [colIndex, slotCount - 1],
    }
    const move = moves[e.key]
    if (!move) return
    e.preventDefault()
    focusSlot(move[0], move[1])
  }

  const isToday = (d: Date) => !!now && isSameDay(d, now)
  const nowOffset = now
    ? differenceInMinutes(now, addMinutes(startOfDay(now), startHour * 60))
    : -1
  const showNow = now && nowOffset >= 0 && nowOffset <= rangeMinutes

  return (
    <div
      ref={gridRef}
      data-slot="appointment-calendar-grid"
      className="relative overflow-auto overscroll-x-contain"
      style={{ maxHeight }}
    >
      <div className="grid min-w-full" style={{ gridTemplateColumns }}>
        {/* Header row */}
        <div className="sticky top-0 left-0 z-40 border-b bg-background" />
        {columns.map((col) => (
          <div
            key={col.key}
            className="sticky top-0 z-30 flex min-w-0 items-center justify-center border-b border-l bg-background px-2 py-2"
          >
            {resourceView ? (
              <ProviderHeader column={col} />
            ) : (
              <button
                type="button"
                onClick={() => onOpenDay(col.date)}
                aria-label={`View ${format(col.date, "EEEE, MMMM d")}`}
                className="group/day flex flex-col items-center gap-0.5 rounded-md px-2 py-0.5 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span
                  className={cn(
                    "text-[11px] font-medium tracking-wide text-muted-foreground uppercase",
                    isToday(col.date) && "text-primary"
                  )}
                >
                  {format(col.date, "EEE")}
                </span>
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-base font-semibold tabular-nums",
                    isToday(col.date) && "bg-primary text-primary-foreground"
                  )}
                >
                  {format(col.date, "d")}
                </span>
              </button>
            )}
          </div>
        ))}

        {/* Hour gutter */}
        <div
          aria-hidden
          className="sticky left-0 z-20 border-r bg-background"
          style={{ height: bodyHeight }}
        >
          {hours.map((h) => (
            <div
              key={h}
              className="absolute right-2 text-[11px] leading-none text-muted-foreground tabular-nums"
              style={{ top: h * hourHeight + 4 }}
            >
              {format(new Date(2000, 0, 1, startHour + h), "h a")}
            </div>
          ))}
        </div>

        {/* Day / provider columns */}
        {columns.map((col, colIndex) => {
          const rangeStart = addMinutes(startOfDay(col.date), startHour * 60)
          const positioned = layoutAppointments(
            appointmentsFor(col),
            rangeStart,
            rangeMinutes,
            15
          )
          const colIsToday = isToday(col.date)
          return (
            <div
              key={col.key}
              className={cn(
                "relative isolate border-l",
                !resourceView && isWeekend(col.date) && "bg-muted/30",
                colIsToday && !resourceView && "bg-primary/[0.025]"
              )}
              style={{ height: bodyHeight }}
            >
              {/* Slots */}
              <div className="absolute inset-0 flex flex-col">
                {Array.from({ length: slotCount }, (_, row) => {
                  const slotStart = addMinutes(rangeStart, row * slotMinutes)
                  const slotEnd = addMinutes(
                    slotStart,
                    Math.min(slotMinutes, rangeMinutes - row * slotMinutes)
                  )
                  const minutesFromTop = (row + 1) * slotMinutes
                  const endsOnHour = minutesFromTop % 60 === 0
                  const height =
                    (slotEnd.getTime() - slotStart.getTime()) / 60000 *
                    pxPerMinute
                  const lineClass = endsOnHour
                    ? "border-b border-border"
                    : "border-b border-dashed border-border/60"
                  if (!onSlotClick) {
                    return (
                      <div
                        key={row}
                        className={cn("shrink-0", lineClass)}
                        style={{ height }}
                      />
                    )
                  }
                  const key = `${colIndex}:${row}`
                  const who = col.provider ? `, ${col.provider.name}` : ""
                  return (
                    <button
                      key={row}
                      type="button"
                      data-slot-key={key}
                      tabIndex={tabStop === key ? 0 : -1}
                      aria-label={`Book ${format(slotStart, "EEEE, MMMM d")}, ${formatTimeRange(slotStart, slotEnd)}${who}`}
                      onFocus={() => setActiveSlot(key)}
                      onKeyDown={(e) => handleSlotKeyDown(e, colIndex, row)}
                      onClick={() =>
                        onSlotClick({
                          start: slotStart,
                          end: slotEnd,
                          providerId: col.providerId,
                        })
                      }
                      className={cn(
                        "group/slot relative shrink-0 cursor-pointer text-left outline-none transition-colors hover:bg-primary/5 focus-visible:z-20 focus-visible:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset",
                        lineClass
                      )}
                      style={{ height }}
                    >
                      <span className="pointer-events-none absolute top-1 left-1.5 text-[10px] font-medium text-primary/70 opacity-0 tabular-nums group-hover/slot:opacity-100 group-focus-visible/slot:opacity-100">
                        {format(slotStart, "h:mm")}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Appointments */}
              {positioned.map((p) => (
                <AppointmentBlock
                  key={p.appointment.id}
                  positioned={p}
                  pxPerMinute={pxPerMinute}
                  providerName={
                    p.appointment.providerId
                      ? providerById.get(p.appointment.providerId)?.name
                      : undefined
                  }
                  onClick={onAppointmentClick}
                  render={renderAppointment}
                />
              ))}

              {/* Now indicator */}
              {showNow && colIsToday && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 z-40 h-0.5 bg-clinical-critical"
                  style={{ top: nowOffset * pxPerMinute - 1 }}
                >
                  {(colIndex === 0 || !resourceView) && (
                    <span className="absolute -top-[3px] -left-1 size-2 rounded-full bg-clinical-critical" />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProviderHeader({ column }: { column: GridColumn }) {
  const name = column.provider?.name ?? "Unassigned"
  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground"
      >
        {column.provider ? initials(name) : "?"}
      </span>
      <span className="flex min-w-0 flex-col text-left">
        <span className="truncate text-sm font-medium">{name}</span>
        {column.provider?.specialty && (
          <span className="truncate text-xs text-muted-foreground">
            {column.provider.specialty}
          </span>
        )}
      </span>
    </div>
  )
}

function AppointmentBlock({
  positioned,
  pxPerMinute,
  providerName,
  onClick,
  render,
}: {
  positioned: PositionedAppointment
  pxPerMinute: number
  providerName?: string
  onClick?: (appointment: Appointment) => void
  render?: (appointment: Appointment) => React.ReactNode
}) {
  const { appointment: appt, start, end, column, span, columns } = positioned
  const status = appt.status ?? "scheduled"
  const top = start * pxPerMinute
  const height = Math.max((end - start) * pxPerMinute, 18)
  const leftPct = (column / columns) * 100
  // Blocks that have neighbours to their right are widened so they overlap
  // them slightly (later columns stack on top), which keeps text readable in
  // narrow columns while every block stays visible and clickable.
  const hasRightNeighbour = column + span < columns
  const widthPct = hasRightNeighbour
    ? Math.min(100 - leftPct, (span / columns) * 100 * 1.6)
    : (span / columns) * 100
  const compact = height < 32
  const roomy = height >= 52
  const cancelled = status === "cancelled"

  return (
    <button
      type="button"
      data-slot="appointment"
      data-status={status}
      aria-label={describeAppointment(appt, providerName)}
      onClick={() => onClick?.(appt)}
      className={cn(
        "absolute flex cursor-pointer flex-col overflow-hidden rounded-md border py-0.5 pr-1.5 pl-2.5 text-left shadow-xs outline-none transition-[background-color,box-shadow] before:absolute before:inset-y-0 before:left-0 before:w-[3px] hover:z-30! hover:shadow-md focus-visible:z-30! focus-visible:ring-3 focus-visible:ring-ring/60",
        columns > 1 && "ring-1 ring-background",
        STATUS_STYLES[status].block
      )}
      style={{
        zIndex: 10 + column,
        top: top + 1,
        height: height - 2,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
      }}
    >
      {render ? (
        render(appt)
      ) : compact ? (
        <span className="flex min-w-0 items-center gap-1 text-xs leading-4">
          <span
            className={cn("truncate font-medium", cancelled && "line-through")}
          >
            {appt.title}
          </span>
          <span className="shrink-0 text-[11px] opacity-70 tabular-nums">
            {format(appt.start, "h:mm")}
          </span>
          {appt.telehealth && (
            <VideoIcon aria-hidden className="ml-auto size-3 shrink-0 opacity-70" />
          )}
        </span>
      ) : (
        <>
          <span className="flex min-w-0 items-center gap-1 text-[11px] leading-[14px] opacity-75 tabular-nums">
            <span className="truncate">
              {formatTimeRange(appt.start, appt.end)}
            </span>
            {appt.telehealth && (
              <VideoIcon aria-hidden className="ml-auto size-3 shrink-0" />
            )}
          </span>
          <span
            className={cn(
              "truncate text-xs leading-4 font-semibold",
              cancelled && "line-through"
            )}
          >
            {appt.title}
          </span>
          {roomy && (appt.type || appt.location) && (
            <span className="truncate text-[11px] leading-[14px] opacity-75">
              {[appt.type, appt.telehealth ? "Telehealth" : appt.location]
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
        </>
      )}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Month grid                                 */
/* -------------------------------------------------------------------------- */

const MAX_MONTH_CHIPS = 3

function MonthGrid({
  date,
  byDay,
  weekStartsOn,
  hideWeekends,
  now,
  providerById,
  onAppointmentClick,
  onOpenDay,
}: {
  date: Date
  byDay: Map<string, Appointment[]>
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6
  hideWeekends: boolean
  now?: Date
  providerById: Map<string, CalendarProvider>
  onAppointmentClick?: (appointment: Appointment) => void
  onOpenDay: (date: Date) => void
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(date), { weekStartsOn }),
    end: endOfWeek(endOfMonth(date), { weekStartsOn }),
  }).filter((d) => !hideWeekends || !isWeekend(d))
  const columnCount = hideWeekends ? 5 : 7
  const weekdayLabels = days.slice(0, columnCount)

  return (
    <div
      data-slot="appointment-calendar-month"
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
      }}
    >
      {weekdayLabels.map((d, i) => (
        <div
          key={i}
          className={cn(
            "border-b py-2 text-center text-[11px] font-medium tracking-wide text-muted-foreground uppercase",
            i > 0 && "border-l"
          )}
        >
          <span className="sm:hidden">{format(d, "EEEEE")}</span>
          <span className="hidden sm:inline">{format(d, "EEE")}</span>
        </div>
      ))}
      {days.map((d, i) => {
        const list = byDay.get(dayKey(d)) ?? []
        const inMonth = isSameMonth(d, date)
        const today = !!now && isSameDay(d, now)
        const overflow = list.length - MAX_MONTH_CHIPS
        return (
          <div
            key={dayKey(d)}
            className={cn(
              "flex min-h-20 min-w-0 flex-col gap-1 border-b p-1 sm:min-h-28 sm:p-1.5",
              i % columnCount !== 0 && "border-l",
              !inMonth && "bg-muted/40"
            )}
          >
            <button
              type="button"
              onClick={() => onOpenDay(d)}
              aria-label={`${format(d, "EEEE, MMMM d")}, ${list.length} appointment${list.length === 1 ? "" : "s"}`}
              className={cn(
                "flex size-6 items-center justify-center self-center rounded-full text-xs font-medium tabular-nums outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 sm:self-start",
                !inMonth && "text-muted-foreground",
                today && "bg-primary text-primary-foreground hover:bg-primary/80"
              )}
            >
              {format(d, "d")}
            </button>

            {/* Mobile: dots */}
            {list.length > 0 && (
              <button
                type="button"
                tabIndex={-1}
                aria-hidden
                onClick={() => onOpenDay(d)}
                className="flex flex-wrap items-center justify-center gap-0.5 sm:hidden"
              >
                {list.slice(0, 4).map((a) => (
                  <span
                    key={a.id}
                    className={cn(
                      "size-1.5 rounded-full",
                      STATUS_STYLES[a.status ?? "scheduled"].dot
                    )}
                  />
                ))}
                {list.length > 4 && (
                  <span className="text-[10px] leading-none text-muted-foreground">
                    +{list.length - 4}
                  </span>
                )}
              </button>
            )}

            {/* Desktop: chips */}
            <div className="hidden min-w-0 flex-col gap-0.5 sm:flex">
              {list.slice(0, MAX_MONTH_CHIPS).map((a) => {
                const status = a.status ?? "scheduled"
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-label={describeAppointment(
                      a,
                      a.providerId
                        ? providerById.get(a.providerId)?.name
                        : undefined
                    )}
                    onClick={() => onAppointmentClick?.(a)}
                    className="flex min-w-0 items-center gap-1.5 rounded-sm px-1 py-0.5 text-left text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        STATUS_STYLES[status].dot
                      )}
                    />
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      {format(a.start, "h:mm")}
                    </span>
                    <span
                      className={cn(
                        "truncate font-medium",
                        status === "cancelled" &&
                          "text-muted-foreground line-through"
                      )}
                    >
                      {a.title}
                    </span>
                    {a.telehealth && (
                      <VideoIcon
                        aria-hidden
                        className="ml-auto size-3 shrink-0 text-muted-foreground"
                      />
                    )}
                  </button>
                )
              })}
              {overflow > 0 && (
                <button
                  type="button"
                  onClick={() => onOpenDay(d)}
                  className="rounded-sm px-1 py-0.5 text-left text-xs font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  +{overflow} more
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

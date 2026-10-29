"use client"

import * as React from "react"
import { format, isSameDay, isSameMonth, startOfDay } from "date-fns"
import { CalendarXIcon, GlobeIcon, MoonIcon, SunIcon, SunriseIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"

export interface TimeSlot {
  start: Date
  end?: Date
  /** Defaults to `true`. */
  available?: boolean
}

export interface AppointmentSlotPickerProps {
  /** All known slots (any dates). Filtered to the selected date. */
  slots?: TimeSlot[]
  /** Alternative to `slots`: return the slots for a given date. */
  getSlots?: (date: Date) => TimeSlot[]
  date?: Date
  defaultDate?: Date
  onDateChange?: (date: Date) => void
  value?: Date | null
  defaultValue?: Date | null
  onValueChange?: (value: Date | null) => void
  disabledDates?: (date: Date) => boolean
  /**
   * Today's date, used to highlight today in the calendar. Pass it explicitly
   * when rendering on the server (avoids reading the clock during render).
   */
  today?: Date
  /** e.g. "Eastern Time (ET)". */
  timeZoneLabel?: string
  /** date-fns pattern used for slot labels. */
  slotFormat?: string
  emptyMessage?: React.ReactNode
  className?: string
}

const PERIODS = [
  { id: "morning", label: "Morning", icon: SunriseIcon, test: (h: number) => h < 12 },
  { id: "afternoon", label: "Afternoon", icon: SunIcon, test: (h: number) => h >= 12 && h < 17 },
  { id: "evening", label: "Evening", icon: MoonIcon, test: (h: number) => h >= 17 },
] as const

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

export function AppointmentSlotPicker({
  slots,
  getSlots,
  date: dateProp,
  defaultDate,
  onDateChange,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  disabledDates,
  today,
  timeZoneLabel,
  slotFormat = "h:mm a",
  emptyMessage = "No times available on this day. Try another date.",
  className,
}: AppointmentSlotPickerProps) {
  const [value, setValue] = useControllable<Date | null>(
    valueProp,
    () => defaultValue,
    onValueChange
  )
  const [date, setDate] = useControllable<Date>(
    dateProp,
    () => defaultDate ?? valueProp ?? defaultValue ?? new Date(),
    onDateChange
  )

  // Keep the visible month in sync when the date changes externally.
  const [month, setMonth] = React.useState(date)
  const [prevDate, setPrevDate] = React.useState(date)
  if (!isSameDay(prevDate, date)) {
    setPrevDate(date)
    if (!isSameMonth(month, date)) setMonth(date)
  }

  const daySlots = React.useMemo(() => {
    const list = getSlots
      ? getSlots(date)
      : (slots ?? []).filter((s) => isSameDay(s.start, date))
    return [...list].sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [getSlots, slots, date])

  const availableDays = React.useMemo(() => {
    if (!slots) return undefined
    const set = new Set<number>()
    for (const s of slots)
      if (s.available !== false) set.add(startOfDay(s.start).getTime())
    return set
  }, [slots])

  const groups = PERIODS.map((p) => ({
    ...p,
    slots: daySlots.filter((s) => p.test(s.start.getHours())),
  })).filter((g) => g.slots.length > 0)

  const availableCount = daySlots.filter((s) => s.available !== false).length
  const groupId = React.useId()

  return (
    <div
      data-slot="appointment-slot-picker"
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground md:flex-row",
        className
      )}
    >
      <div className="flex justify-center border-b p-2 md:border-r md:border-b-0">
        <Calendar
          mode="single"
          required
          selected={date}
          onSelect={(d) => d && setDate(d)}
          month={month}
          // Always pass `today` so react-day-picker never reads the clock during
          // render; without an explicit value, don't highlight any day as today.
          today={today ?? date}
          classNames={today ? undefined : { today: "" }}
          onMonthChange={setMonth}
          disabled={disabledDates}
          modifiers={
            availableDays
              ? { available: (d) => availableDays.has(startOfDay(d).getTime()) }
              : undefined
          }
          modifiersClassNames={{
            available:
              "[&_button]:after:absolute [&_button]:after:bottom-1 [&_button]:after:left-1/2 [&_button]:after:size-1 [&_button]:after:-translate-x-1/2 [&_button]:after:rounded-full [&_button]:after:bg-primary [&_button[data-selected-single=true]]:after:bg-primary-foreground",
          }}
          className="bg-transparent [--cell-size:--spacing(9)]"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{format(date, "EEEE, MMMM d")}</p>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {availableCount === 0
                ? "No availability"
                : `${availableCount} time${availableCount === 1 ? "" : "s"} available`}
            </p>
          </div>
          {timeZoneLabel && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <GlobeIcon aria-hidden className="size-3.5" />
              {timeZoneLabel}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:max-h-[22rem]">
          {groups.length === 0 ? (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <CalendarXIcon aria-hidden className="size-6 opacity-60" />
              <div>{emptyMessage}</div>
            </div>
          ) : (
            <div
              role="radiogroup"
              aria-label={`Available times on ${format(date, "EEEE, MMMM d")}`}
              className="flex flex-col gap-5"
            >
              {groups.map((group) => {
                const Icon = group.icon
                const headingId = `${groupId}-${group.id}`
                return (
                  <section key={group.id} aria-labelledby={headingId}>
                    <h3
                      id={headingId}
                      className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                    >
                      <Icon aria-hidden className="size-3.5" />
                      {group.label}
                    </h3>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4">
                      {group.slots.map((slot) => {
                        const available = slot.available !== false
                        const selected =
                          !!value && value.getTime() === slot.start.getTime()
                        const label = format(slot.start, slotFormat)
                        return (
                          <button
                            key={slot.start.getTime()}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={!available}
                            aria-label={
                              available
                                ? `${label}${slot.end ? ` to ${format(slot.end, slotFormat)}` : ""}`
                                : `${label}, unavailable`
                            }
                            onClick={() => setValue(selected ? null : slot.start)}
                            className={cn(
                              "inline-flex h-9 items-center justify-center rounded-lg border px-2 text-sm font-medium tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background hover:border-primary/50 hover:bg-muted dark:bg-input/30 dark:hover:bg-input/50",
                              !available &&
                                "cursor-not-allowed border-dashed bg-transparent text-muted-foreground/60 line-through hover:border-border hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
                            )}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>

        {value && (
          <div
            className="border-t bg-muted/40 px-4 py-2.5 text-sm"
            aria-live="polite"
          >
            <span className="text-muted-foreground">Selected: </span>
            <span className="font-medium">
              {format(value, "EEE, MMM d")} at {format(value, slotFormat)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

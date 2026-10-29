"use client"

import * as React from "react"
import { format, isValid, parseISO, startOfDay, startOfMonth } from "date-fns"
import {
  CircleDot,
  File,
  FileText,
  FlaskConical,
  HeartPulse,
  History,
  type LucideIcon,
  MapPin,
  MessageSquare,
  Pill,
  ScanLine,
  Scissors,
  Search,
  Stethoscope,
  Syringe,
  User,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"

/**
 * Event type, loosely mapped to FHIR resources: encounter → Encounter, note → DocumentReference (clinical note),
 * lab → Observation/DiagnosticReport, imaging → ImagingStudy, medication → MedicationRequest,
 * procedure → Procedure, immunization → Immunization, vitals → Observation (vital-signs),
 * message → Communication, document → DocumentReference.
 */
export type TimelineEventType =
  | "encounter"
  | "note"
  | "lab"
  | "imaging"
  | "medication"
  | "procedure"
  | "immunization"
  | "vitals"
  | "message"
  | "document"
  | (string & Record<never, never>)

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  title: string
  /** ISO 8601 date or date-time. Date-only values ("2026-08-01") hide the time. */
  date: string
  description?: React.ReactNode
  author?: string
  location?: string
  status?: ClinicalStatus
  /** Overrides the default status badge text. */
  statusLabel?: string
  tags?: string[]
  href?: string
}

export type TimelineGroupBy = "day" | "month"

export const TIMELINE_EVENT_TYPES: Record<string, { label: string; icon: LucideIcon }> = {
  encounter: { label: "Visits", icon: Stethoscope },
  note: { label: "Notes", icon: FileText },
  lab: { label: "Labs", icon: FlaskConical },
  imaging: { label: "Imaging", icon: ScanLine },
  medication: { label: "Medications", icon: Pill },
  procedure: { label: "Procedures", icon: Scissors },
  immunization: { label: "Immunizations", icon: Syringe },
  vitals: { label: "Vitals", icon: HeartPulse },
  message: { label: "Messages", icon: MessageSquare },
  document: { label: "Documents", icon: File },
}

const typeLabel = (type: string) =>
  TIMELINE_EVENT_TYPES[type]?.label ?? (type ? type[0].toUpperCase() + type.slice(1) : type)
const typeIcon = (type: string) => TIMELINE_EVENT_TYPES[type]?.icon ?? CircleDot

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

const statusRing: Partial<Record<ClinicalStatus, string>> = {
  abnormal: "border-clinical-abnormal/40 bg-clinical-abnormal/10 text-clinical-abnormal-foreground",
  critical: "border-clinical-critical/40 bg-clinical-critical/10 text-clinical-critical-foreground",
  watch: "border-clinical-watch/40 bg-clinical-watch/10 text-clinical-watch-foreground",
}

function searchableText(event: TimelineEvent) {
  return [
    event.title,
    typeof event.description === "string" || typeof event.description === "number" ? String(event.description) : "",
    event.author,
    event.location,
    event.statusLabel,
    ...(event.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

export interface ClinicalTimelineProps extends React.ComponentProps<"div"> {
  events: TimelineEvent[]
  /** Filter chip options, in order. Defaults to the types present in `events`. */
  types?: string[]
  /** Controlled selected types. An empty array shows all types. */
  filter?: string[]
  defaultFilter?: string[]
  onFilterChange?: (types: string[]) => void
  /** Show the search input. */
  searchable?: boolean
  groupBy?: TimelineGroupBy
  /** Number of events shown initially and added by "Load more". */
  pageSize?: number
  /** Makes event titles buttons. */
  onEventSelect?: (event: TimelineEvent) => void
  /** Extra controls rendered at the end of each event. */
  renderActions?: (event: TimelineEvent) => React.ReactNode
  /** Custom link renderer for `href` (e.g. Next.js `Link`). Defaults to `<a>`. */
  renderLink?: (event: TimelineEvent, children: React.ReactNode) => React.ReactNode
  emptyMessage?: React.ReactNode
}

export function ClinicalTimeline({
  events,
  types,
  filter: filterProp,
  defaultFilter = [],
  onFilterChange,
  searchable = true,
  groupBy = "day",
  pageSize = 10,
  onEventSelect,
  renderActions,
  renderLink,
  emptyMessage = "No activity recorded.",
  className,
  ...props
}: ClinicalTimelineProps) {
  const id = React.useId()
  const [filterState, setFilterState] = React.useState<string[]>(defaultFilter)
  const filter = filterProp ?? filterState
  const [query, setQuery] = React.useState("")
  const [visible, setVisible] = React.useState(pageSize)
  const listRef = React.useRef<HTMLDivElement>(null)

  const setFilter = (next: string[]) => {
    if (filterProp === undefined) setFilterState(next)
    onFilterChange?.(next)
    setVisible(pageSize)
  }

  const parsed = React.useMemo(
    () =>
      events
        .map((event) => ({ event, date: parseISO(event.date) }))
        .filter((item) => isValid(item.date))
        .sort((a, b) => b.date.getTime() - a.date.getTime()),
    [events]
  )

  const typeOptions = React.useMemo(() => types ?? Array.from(new Set(parsed.map((p) => p.event.type))), [types, parsed])

  const counts = React.useMemo(() => {
    const result: Record<string, number> = {}
    for (const { event } of parsed) result[event.type] = (result[event.type] ?? 0) + 1
    return result
  }, [parsed])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return parsed.filter(
      ({ event }) => (filter.length === 0 || filter.includes(event.type)) && (!q || searchableText(event).includes(q))
    )
  }, [parsed, filter, query])

  const shown = filtered.slice(0, visible)
  const remaining = filtered.length - shown.length

  const groups = React.useMemo(() => {
    const result: { key: string; label: string; dateTime: string; items: typeof shown }[] = []
    for (const item of shown) {
      const start = groupBy === "month" ? startOfMonth(item.date) : startOfDay(item.date)
      const key = start.toISOString()
      let group = result[result.length - 1]
      if (!group || group.key !== key) {
        group = {
          key,
          label: format(start, groupBy === "month" ? "MMMM yyyy" : "EEEE, MMMM d, yyyy"),
          dateTime: format(start, groupBy === "month" ? "yyyy-MM" : "yyyy-MM-dd"),
          items: [],
        }
        result.push(group)
      }
      group.items.push(item)
    }
    return result
  }, [shown, groupBy])

  const loadMore = () => {
    const firstNew = shown.length
    setVisible((v) => v + pageSize)
    requestAnimationFrame(() => {
      listRef.current?.querySelectorAll<HTMLElement>("[data-slot=clinical-timeline-event]")[firstNew]?.focus()
    })
  }

  const filtering = filter.length > 0 || query.trim() !== ""

  return (
    <div data-slot="clinical-timeline" className={cn("flex flex-col gap-4", className)} {...props}>
      {(searchable || typeOptions.length > 1) && (
        <div className="flex flex-col gap-3">
          {searchable && (
            <div className="relative">
              <label htmlFor={`${id}-search`} className="sr-only">
                Search activity
              </label>
              <Search
                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id={`${id}-search`}
                type="search"
                placeholder="Search activity…"
                autoComplete="off"
                className="pl-8"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setVisible(pageSize)
                }}
              />
            </div>
          )}
          {typeOptions.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <ToggleGroup
                type="multiple"
                variant="outline"
                size="sm"
                value={filter}
                onValueChange={setFilter}
                aria-label="Filter by type"
                className="flex-wrap"
              >
                {typeOptions.map((type) => {
                  const Icon = typeIcon(type)
                  return (
                    <ToggleGroupItem key={type} value={type} className="gap-1.5">
                      <Icon aria-hidden />
                      {typeLabel(type)}
                      <span className="text-xs text-muted-foreground tabular-nums">{counts[type] ?? 0}</span>
                    </ToggleGroupItem>
                  )
                })}
              </ToggleGroup>
              {filter.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setFilter([])}>
                  Show all
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {filtered.length === 0
          ? "No matching events"
          : `Showing ${shown.length} of ${filtered.length} ${filtered.length === 1 ? "event" : "events"}`}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          <History className="size-5" aria-hidden />
          {parsed.length > 0 && filtering ? "No activity matches your filters." : emptyMessage}
          {parsed.length > 0 && filtering && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("")
                setFilter([])
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div ref={listRef} className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`${id}-${group.dateTime}`} className="flex flex-col gap-3">
              <h3 id={`${id}-${group.dateTime}`} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <time dateTime={group.dateTime}>{group.label}</time>
              </h3>
              <ol className="flex flex-col">
                {group.items.map(({ event, date }, index) => {
                  const Icon = typeIcon(event.type)
                  const last = index === group.items.length - 1
                  const dateOnly = DATE_ONLY.test(event.date)
                  const timeLabel = dateOnly
                    ? groupBy === "month"
                      ? format(date, "MMM d")
                      : undefined
                    : format(date, groupBy === "month" ? "MMM d, h:mm a" : "h:mm a")
                  const meta = [event.author, event.location].filter(Boolean)
                  return (
                    <li
                      key={event.id}
                      data-slot="clinical-timeline-event"
                      data-type={event.type}
                      tabIndex={-1}
                      className="relative flex gap-3 rounded-lg pb-5 outline-none last:pb-0 focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {!last && <span aria-hidden className="absolute top-9 bottom-1 left-4 w-px -translate-x-1/2 bg-border" />}
                      <span
                        aria-hidden
                        className={cn(
                          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground",
                          event.status && statusRing[event.status]
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="sr-only">{typeLabel(event.type)}:</span>
                            {onEventSelect ? (
                              <button
                                type="button"
                                onClick={() => onEventSelect(event)}
                                className="rounded-sm text-left text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                              >
                                {event.title}
                              </button>
                            ) : (
                              <span className="text-sm font-medium">{event.title}</span>
                            )}
                            {event.status && (
                              <ClinicalStatusBadge status={event.status}>{event.statusLabel}</ClinicalStatusBadge>
                            )}
                          </div>
                          {timeLabel && (
                            <time dateTime={event.date} className="shrink-0 text-xs text-muted-foreground tabular-nums">
                              {timeLabel}
                            </time>
                          )}
                          {!timeLabel && <time dateTime={event.date} className="sr-only">{format(date, "PPP")}</time>}
                        </div>
                        {meta.length > 0 && (
                          <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            {event.author && (
                              <span className="inline-flex items-center gap-1">
                                <User className="size-3" aria-hidden />
                                {event.author}
                              </span>
                            )}
                            {event.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3" aria-hidden />
                                {event.location}
                              </span>
                            )}
                          </p>
                        )}
                        {event.description && <div className="text-sm text-muted-foreground">{event.description}</div>}
                        {(event.tags?.length || event.href || renderActions) && (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {event.tags?.map((tag) => (
                              <span key={tag} className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                                {tag}
                              </span>
                            ))}
                            {event.href &&
                              (renderLink ? (
                                renderLink(event, "View")
                              ) : (
                                <a
                                  href={event.href}
                                  className="rounded-sm text-xs font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                                >
                                  View<span className="sr-only"> {event.title}</span>
                                </a>
                              ))}
                            {renderActions && <div className="ml-auto flex items-center gap-1">{renderActions(event)}</div>}
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </div>
      )}

      {remaining > 0 && (
        <Button type="button" variant="outline" className="self-center" onClick={loadMore}>
          Load more
          <span className="text-muted-foreground tabular-nums">({remaining} remaining)</span>
        </Button>
      )}
    </div>
  )
}

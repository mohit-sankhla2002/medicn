"use client"

import * as React from "react"
import { CalendarClock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WorkflowState } from "@/components/medicn/workflow-state"

export type WaitlistStatus = "waiting" | "offered" | "booked" | "expired" | "cancelled"

export interface WaitlistEntry {
  id: string
  patientName: string
  service: string
  provider?: string
  /** Display-ready preferences, e.g. "Weekdays · after 14:00 · Downtown". */
  preferences: string
  requestedAt?: string
  status: WaitlistStatus
  /** Display-ready offer and expiry. Eligibility and expiry are determined by the host. */
  offeredSlot?: string
  offerExpiresAt?: string
  note?: string
}

export interface AppointmentWaitlistProps extends Omit<React.ComponentProps<"section">, "title" | "children"> {
  entries: WaitlistEntry[]
  title?: React.ReactNode
  description?: React.ReactNode
  onOffer?: (entry: WaitlistEntry) => void
  onBook?: (entry: WaitlistEntry) => void
  onCancel?: (entry: WaitlistEntry) => void
  renderActions?: (entry: WaitlistEntry) => React.ReactNode
  pendingId?: string
  disabled?: boolean
  isLoading?: boolean
  error?: React.ReactNode
  onRetry?: () => void
  labels?: Partial<Record<WaitlistStatus | "offer" | "book" | "cancel" | "expires" | "empty" | "loading" | "error" | "retry", string>>
}

/** Shared patient/admin list. Pass only callbacks appropriate to the viewer's role. */
export function AppointmentWaitlist({ entries, title = "Appointment waitlist", description, onOffer, onBook, onCancel, renderActions, pendingId, disabled, isLoading, error, onRetry, labels, className, ...props }: AppointmentWaitlistProps) {
  const id = React.useId()
  const text = { waiting: "Waiting", offered: "Slot offered", booked: "Booked", expired: "Offer expired", cancelled: "Cancelled", offer: "Offer a slot", book: "Book offered slot", cancel: "Cancel request", expires: "Offer expires", empty: "No waitlist requests", loading: "Loading waitlist…", error: "Could not load waitlist", retry: "Try again", ...labels }
  return (
    <section data-slot="appointment-waitlist" aria-labelledby={`${id}-title`} aria-busy={isLoading || undefined} className={cn("w-full overflow-hidden rounded-xl border bg-card text-card-foreground", className)} {...props}>
      <div className="border-b px-5 py-4"><h3 id={`${id}-title`} className="flex items-center gap-2 font-semibold"><CalendarClock aria-hidden className="size-4 text-muted-foreground" />{title}</h3>{description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}</div>
      {isLoading ? <WorkflowState state="loading" title={text.loading} /> : error ? <WorkflowState state="error" title={text.error} description={error} onRetry={onRetry} retryLabel={text.retry} /> : entries.length === 0 ? <WorkflowState state="empty" title={text.empty} /> : (
        <ul className="divide-y">
          {entries.map((entry, index) => <li key={entry.id} aria-busy={pendingId === entry.id || undefined} className="space-y-3 px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><p id={`${id}-${index}`} className="text-sm font-medium">{entry.patientName}</p><p className="text-sm text-muted-foreground">{entry.service}{entry.provider ? ` · ${entry.provider}` : ""}</p></div><Badge variant={entry.status === "offered" ? "default" : "secondary"}>{text[entry.status]}</Badge></div>
            <div className="space-y-1 text-sm text-muted-foreground"><p>{entry.preferences}</p>{entry.requestedAt && <p className="text-xs">{entry.requestedAt}</p>}{entry.note && <p>{entry.note}</p>}</div>
            {entry.status === "offered" && entry.offeredSlot && <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm"><p className="font-medium">{entry.offeredSlot}</p>{entry.offerExpiresAt && <p className="mt-1 text-xs text-muted-foreground">{text.expires}: {entry.offerExpiresAt}</p>}</div>}
            {renderActions ? renderActions(entry) : <div className="flex flex-wrap gap-2">
              {entry.status === "waiting" && onOffer && <Button type="button" size="sm" variant="outline" disabled={disabled || pendingId === entry.id} aria-describedby={`${id}-${index}`} onClick={() => onOffer(entry)}>{text.offer}</Button>}
              {entry.status === "offered" && entry.offeredSlot && onBook && <Button type="button" size="sm" disabled={disabled || pendingId === entry.id} aria-describedby={`${id}-${index}`} onClick={() => onBook(entry)}>{text.book}</Button>}
              {(entry.status === "waiting" || entry.status === "offered") && onCancel && <Button type="button" size="sm" variant="ghost" disabled={disabled || pendingId === entry.id} aria-describedby={`${id}-${index}`} onClick={() => onCancel(entry)}>{text.cancel}</Button>}
            </div>}
          </li>)}
        </ul>
      )}
    </section>
  )
}

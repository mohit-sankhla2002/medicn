import * as React from "react"
import { Pill } from "lucide-react"

import { cn } from "@/lib/utils"

export type MedicationStatus = "active" | "held" | "discontinued" | "completed"

export interface Medication {
  id: string
  name: string
  /** e.g. "500 mg" */
  strength?: string
  /** e.g. "Oral", "IV", "Subcutaneous" */
  route?: string
  /** e.g. "Twice daily with meals" */
  frequency?: string
  /** Take only as needed. */
  prn?: boolean
  indication?: string
  prescriber?: string
  /** Pre-formatted start date. */
  startDate?: string
  status?: MedicationStatus
  /** Flag high-alert medications (anticoagulants, insulin, opioids…). */
  highAlert?: boolean
}

export const MEDICATION_STATUS_LABELS: Record<MedicationStatus, string> = {
  active: "Active",
  held: "On hold",
  discontinued: "Discontinued",
  completed: "Completed",
}

const statusClasses: Record<MedicationStatus, string> = {
  active: "bg-clinical-normal/10 text-clinical-normal-foreground",
  held: "bg-clinical-watch/10 text-clinical-watch-foreground",
  discontinued: "bg-muted text-muted-foreground",
  completed: "bg-clinical-info/10 text-clinical-info-foreground",
}

export interface MedicationListProps extends React.ComponentProps<"div"> {
  medications: Medication[]
  /** Render per-row actions, e.g. a dropdown menu. */
  renderActions?: (medication: Medication) => React.ReactNode
  emptyMessage?: React.ReactNode
}

export function MedicationList({
  medications,
  renderActions,
  emptyMessage = "No medications recorded.",
  className,
  ...props
}: MedicationListProps) {
  if (medications.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground",
          className
        )}
        {...props}
      >
        <Pill className="size-5" />
        {emptyMessage}
      </div>
    )
  }

  return (
    <div data-slot="medication-list" className={cn("overflow-hidden rounded-xl border bg-card", className)} {...props}>
      <ul role="list" className="divide-y">
        {medications.map((med) => {
          const status = med.status ?? "active"
          const inactive = status === "discontinued" || status === "completed"
          return (
            <li key={med.id} className="flex items-start gap-3 p-4">
              <div
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                  med.highAlert ? "bg-clinical-critical/10 text-clinical-critical-foreground" : "bg-primary/10 text-primary",
                  inactive && "bg-muted text-muted-foreground"
                )}
              >
                <Pill className="size-4" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={cn("font-medium", inactive && "text-muted-foreground line-through")}>{med.name}</span>
                  {med.strength && <span className="text-sm text-muted-foreground">{med.strength}</span>}
                  {med.prn && (
                    <span className="rounded border px-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                      PRN
                    </span>
                  )}
                  {med.highAlert && (
                    <span className="rounded bg-clinical-critical px-1 text-[10px] font-semibold tracking-wide text-white uppercase">
                      High alert
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {[med.route, med.frequency].filter(Boolean).join(" · ")}
                  {med.indication && <span> — for {med.indication}</span>}
                </p>
                {(med.prescriber || med.startDate) && (
                  <p className="text-xs text-muted-foreground">
                    {[med.prescriber, med.startDate && `since ${med.startDate}`].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusClasses[status])}>
                  {MEDICATION_STATUS_LABELS[status]}
                </span>
                {renderActions?.(med)}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

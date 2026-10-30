"use client"

import * as React from "react"
import { AlertCircle, Calendar, CheckCircle2, Clock, Plus, ShieldCheck, Syringe } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ClinicalStatusBadge } from "@/components/medicn/clinical-status-badge"

export type ImmunizationStatus = "completed" | "not-done" | "entered-in-error"

export interface Immunization {
  id: string
  vaccineName: string
  vaccineCode?: string
  status: ImmunizationStatus
  doseNumber?: number
  seriesDoses?: number
  date?: string
  site?: string
  route?: string
  lotNumber?: string
  expirationDate?: string
  manufacturer?: string
  performer?: string
  note?: string
}

export interface ImmunizationDue {
  vaccineName: string
  vaccineCode?: string
  dueDate: string
  overdue?: boolean
  seriesInfo?: string
}

export function sortImmunizations(records: Immunization[]): Immunization[] {
  return [...records].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0
    const dateB = b.date ? new Date(b.date).getTime() : 0
    return dateB - dateA
  })
}

export function getSeriesProgress(
  records: Immunization[],
  vaccineName: string
): { given: number; total?: number } {
  const matching = records.filter(
    (r) => r.vaccineName.toLowerCase() === vaccineName.toLowerCase() && r.status === "completed"
  )
  const maxSeries = matching.find((r) => r.seriesDoses != null)?.seriesDoses
  return {
    given: matching.length,
    total: maxSeries,
  }
}

export function isImmunizationOverdue(dueDate: string | Date, now?: string | Date): boolean {
  const due = new Date(dueDate).getTime()
  const current = now ? new Date(now).getTime() : Date.now()
  return due < current
}

export interface ImmunizationRecordProps extends Omit<React.ComponentProps<"div">, "title"> {
  immunizations: Immunization[]
  dueVaccines?: ImmunizationDue[]
  onRecord?: () => void
  readOnly?: boolean
  title?: React.ReactNode
  emptyMessage?: React.ReactNode
}

export function ImmunizationRecord({
  immunizations,
  dueVaccines,
  onRecord,
  readOnly = false,
  title = "Immunization Record",
  emptyMessage = "No immunization records found.",
  className,
  ...props
}: ImmunizationRecordProps) {
  const sorted = React.useMemo(() => sortImmunizations(immunizations), [immunizations])
  const completedCount = immunizations.filter((i) => i.status === "completed").length

  return (
    <div
      data-slot="immunization-record"
      className={cn("overflow-hidden rounded-xl border bg-card text-card-foreground", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Syringe className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">{title}</h3>
          {immunizations.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {completedCount} administered
            </span>
          )}
        </div>
        {!readOnly && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onRecord}>
            <Plus className="mr-1 size-3.5" />
            Record vaccine
          </Button>
        )}
      </div>

      {dueVaccines && dueVaccines.length > 0 && (
        <div className="border-b bg-muted/30 px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Clock className="size-3.5" />
            Upcoming & Due
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {dueVaccines.map((due, idx) => {
              const overdue = due.overdue ?? isImmunizationOverdue(due.dueDate)
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start justify-between rounded-lg border p-2.5 text-xs transition-colors",
                    overdue
                      ? "border-clinical-abnormal/30 bg-clinical-abnormal/5"
                      : "border-border bg-card"
                  )}
                >
                  <div className="space-y-0.5">
                    <span className="font-medium text-foreground">{due.vaccineName}</span>
                    {due.seriesInfo && (
                      <p className="text-[11px] text-muted-foreground">{due.seriesInfo}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">Due: {due.dueDate}</p>
                  </div>
                  <ClinicalStatusBadge
                    status={overdue ? "abnormal" : "watch"}
                    dot={overdue}
                    className="text-[10px]"
                  >
                    {overdue ? "Overdue" : "Due"}
                  </ClinicalStatusBadge>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
          <ShieldCheck className="mb-2 size-6 opacity-40" />
          {emptyMessage}
        </div>
      ) : (
        <ul role="list" className="divide-y divide-border">
          {sorted.map((item) => {
            const hasSeries = item.doseNumber != null
            return (
              <li key={item.id} className="flex items-start gap-3 p-4 hover:bg-muted/20">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Syringe className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-foreground">{item.vaccineName}</span>
                    {hasSeries && (
                      <span className="rounded border px-1.5 py-0.2 text-[10px] font-semibold text-muted-foreground uppercase">
                        Dose {item.doseNumber}
                        {item.seriesDoses ? ` of ${item.seriesDoses}` : ""}
                      </span>
                    )}
                    {item.vaccineCode && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        CVX {item.vaccineCode}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {item.date && (
                      <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                        <Calendar className="size-3" />
                        {item.date}
                      </span>
                    )}
                    {item.site && <span>Site: {item.site}</span>}
                    {item.lotNumber && (
                      <span>
                        Lot: <span className="font-mono">{item.lotNumber}</span>
                      </span>
                    )}
                    {item.performer && <span>Administered by: {item.performer}</span>}
                  </div>
                  {item.note && (
                    <p className="mt-0.5 text-xs text-muted-foreground italic">{item.note}</p>
                  )}
                </div>
                <div className="shrink-0">
                  <ClinicalStatusBadge
                    status={item.status === "completed" ? "normal" : "watch"}
                    dot={false}
                  >
                    {item.status === "completed" ? "Completed" : "Not Done"}
                  </ClinicalStatusBadge>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

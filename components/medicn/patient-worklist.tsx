"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { WorkflowState } from "@/components/medicn/workflow-state"

export type WorklistStatus = "scheduled" | "arrived" | "roomed" | "in-progress" | "completed" | "cancelled"

export interface WorklistPatient {
  /** Encounter/work item ID; the same patient can have multiple encounters. */
  id: string
  patientId: string
  name: string
  identifier?: string
  appointmentTime?: string
  reason?: string
  provider?: string
  location?: string
  status: WorklistStatus
  /** Host-supplied workflow priority, never inferred from symptoms. */
  priority?: string
  waitingTime?: string
}

export interface PatientWorklistProps extends Omit<React.ComponentProps<"section">, "title" | "children" | "onSelect"> {
  patients: WorklistPatient[]
  title?: React.ReactNode
  onPatientSelect?: (patient: WorklistPatient) => void
  renderActions?: (patient: WorklistPatient) => React.ReactNode
  /** Controlled filters allow URL persistence, saved views, and server-side searching. */
  search?: string
  defaultSearch?: string
  onSearchChange?: (search: string) => void
  status?: WorklistStatus | "all"
  defaultStatus?: WorklistStatus | "all"
  onStatusChange?: (status: WorklistStatus | "all") => void
  /** Disable local filtering when the supplied rows are already filtered by a server. */
  manualFiltering?: boolean
  isLoading?: boolean
  error?: React.ReactNode
  onRetry?: () => void
  labels?: Partial<Record<WorklistStatus | "all" | "search" | "filter" | "patient" | "time" | "visit" | "provider" | "location" | "state" | "actions" | "empty" | "noMatches" | "loading" | "error" | "retry" | "results", string>>
}

export function PatientWorklist({ patients, title = "Patient worklist", onPatientSelect, renderActions, search, defaultSearch = "", onSearchChange, status, defaultStatus = "all", onStatusChange, manualFiltering, isLoading, error, onRetry, labels, className, ...props }: PatientWorklistProps) {
  const id = React.useId()
  const [internalSearch, setInternalSearch] = React.useState(defaultSearch)
  const [internalStatus, setInternalStatus] = React.useState<WorklistStatus | "all">(defaultStatus)
  const query = search ?? internalSearch
  const filter = status ?? internalStatus
  const text = { scheduled: "Scheduled", arrived: "Arrived", roomed: "Roomed", "in-progress": "In progress", completed: "Completed", cancelled: "Cancelled", all: "All statuses", search: "Search patients, identifiers, providers…", filter: "Visit status", patient: "Patient", time: "Time", visit: "Visit", provider: "Provider", location: "Location", state: "Status", actions: "Actions", empty: "No patients on this worklist", noMatches: "No patients match these filters", loading: "Loading patient worklist…", error: "Could not load patient worklist", retry: "Try again", results: "Results", ...labels }
  const needle = query.trim().toLocaleLowerCase()
  const rows = manualFiltering ? patients : patients.filter((patient) => (filter === "all" || patient.status === filter) && (!needle || [patient.name, patient.identifier, patient.reason, patient.provider, patient.location].some((value) => value?.toLocaleLowerCase().includes(needle))))
  return (
    <section data-slot="patient-worklist" aria-labelledby={`${id}-title`} aria-busy={isLoading || undefined} className={cn("w-full overflow-hidden rounded-xl border bg-card text-card-foreground", className)} {...props}>
      <div className="space-y-4 border-b px-5 py-4">
        <h3 id={`${id}-title`} className="font-semibold">{title}</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1"><Label htmlFor={`${id}-search`} className="sr-only">{text.search}</Label><div className="relative"><Search aria-hidden className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" /><Input id={`${id}-search`} type="search" placeholder={text.search} value={query} className="pl-9" onChange={(event) => { if (search === undefined) setInternalSearch(event.target.value); onSearchChange?.(event.target.value) }} /></div></div>
          <div className="space-y-1"><Label htmlFor={`${id}-status`} className="text-xs text-muted-foreground">{text.filter}</Label><select id={`${id}-status`} value={filter} className="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => { const next = event.target.value as WorklistStatus | "all"; if (status === undefined) setInternalStatus(next); onStatusChange?.(next) }}>{(["all", "scheduled", "arrived", "roomed", "in-progress", "completed", "cancelled"] as const).map((key) => <option key={key} value={key}>{text[key]}</option>)}</select></div>
        </div>
      </div>
      {isLoading ? <WorkflowState state="loading" title={text.loading} /> : error ? <WorkflowState state="error" title={text.error} description={error} onRetry={onRetry} retryLabel={text.retry} /> : rows.length === 0 ? <WorkflowState state="empty" title={patients.length === 0 && !query && filter === "all" ? text.empty : text.noMatches} /> : (
        <div role="region" tabIndex={0} aria-labelledby={`${id}-title`} className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&>[data-slot=table-container]]:overflow-visible"><Table aria-labelledby={`${id}-title`}>
          <TableHeader><TableRow><TableHead className="pl-5" scope="col">{text.patient}</TableHead><TableHead scope="col">{text.time}</TableHead><TableHead scope="col">{text.visit}</TableHead><TableHead scope="col">{text.provider}</TableHead><TableHead scope="col">{text.location}</TableHead><TableHead scope="col">{text.state}</TableHead>{renderActions && <TableHead scope="col">{text.actions}</TableHead>}</TableRow></TableHeader>
          <TableBody>{rows.map((patient, index) => <TableRow key={patient.id}>
            <TableCell className="pl-5">{onPatientSelect ? <Button type="button" variant="link" className="h-auto p-0 font-medium" onClick={() => onPatientSelect(patient)} aria-describedby={patient.identifier ? `${id}-${index}-identifier` : undefined}>{patient.name}</Button> : <span className="font-medium">{patient.name}</span>}{patient.identifier && <p id={`${id}-${index}-identifier`} className="text-xs text-muted-foreground">{patient.identifier}</p>}</TableCell>
            <TableCell><p>{patient.appointmentTime ?? "—"}</p>{patient.waitingTime && <p className="text-xs text-muted-foreground">{patient.waitingTime}</p>}</TableCell>
            <TableCell className="max-w-64 whitespace-normal">{patient.reason ?? "—"}</TableCell><TableCell>{patient.provider ?? "—"}</TableCell><TableCell>{patient.location ?? "—"}</TableCell>
            <TableCell className="space-y-1"><Badge variant="secondary">{text[patient.status]}</Badge>{patient.priority && <p className="text-xs font-medium">{patient.priority}</p>}</TableCell>
            {renderActions && <TableCell>{renderActions(patient)}</TableCell>}
          </TableRow>)}</TableBody>
        </Table></div>
      )}
      {!isLoading && !error && <p role="status" className="border-t px-5 py-2 text-xs text-muted-foreground">{text.results}: {rows.length}</p>}
    </section>
  )
}

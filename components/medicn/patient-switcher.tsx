"use client"

import * as React from "react"
import { Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { WorkflowState } from "@/components/medicn/workflow-state"

export interface PatientProfile {
  id: string
  name: string
  /** Pre-formatted relationship, e.g. "You", "Child", "Parent". */
  relationship: string
  /** A disambiguator such as a masked identifier or date of birth. */
  detail?: string
  /** Host-supplied scope, e.g. "Appointments and messages only". */
  accessLabel?: string
  disabled?: boolean
}

export interface PatientSwitcherProps extends Omit<React.ComponentProps<"div">, "onChange" | "children"> {
  patients: PatientProfile[]
  value?: string
  defaultValue?: string
  onPatientChange?: (patient: PatientProfile) => void
  disabled?: boolean
  isLoading?: boolean
  error?: React.ReactNode
  onRetry?: () => void
  labels?: Partial<Record<"label" | "placeholder" | "viewing" | "empty" | "loading" | "error" | "retry", string>>
}

/** Identity selection only. Supply authorized profiles and enforce access on the server. */
export function PatientSwitcher({ patients, value, defaultValue = "", onPatientChange, disabled, isLoading, error, onRetry, labels, className, ...props }: PatientSwitcherProps) {
  const id = React.useId()
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const availablePatients = isLoading || error ? [] : patients
  const selected = availablePatients.find((patient) => patient.id === (value ?? internalValue) && !patient.disabled)
  const text = { label: "Care account", placeholder: "Choose a patient", viewing: "Viewing care for", empty: "No care accounts available", loading: "Loading care accounts…", error: "Could not load care accounts", retry: "Try again", ...labels }

  return (
    <div data-slot="patient-switcher" aria-busy={isLoading || undefined} className={cn("w-full rounded-xl border bg-card p-4 text-card-foreground", className)} {...props}>
      <Label htmlFor={id} className="mb-2 flex items-center gap-2"><Users aria-hidden className="size-4 text-muted-foreground" />{text.label}</Label>
      <select
        id={id}
        value={selected?.id ?? ""}
        disabled={disabled || isLoading || Boolean(error) || patients.length === 0}
        aria-describedby={selected ? `${id}-context` : undefined}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        onChange={(event) => {
          const patient = patients.find((item) => item.id === event.target.value && !item.disabled)
          if (!patient) return
          if (value === undefined) setInternalValue(patient.id)
          onPatientChange?.(patient)
        }}
      >
        <option value="" disabled>{text.placeholder}</option>
        {availablePatients.map((patient) => <option key={patient.id} value={patient.id} disabled={patient.disabled}>{patient.name} · {patient.relationship}{patient.detail ? ` · ${patient.detail}` : ""}</option>)}
      </select>
      {isLoading ? <WorkflowState state="loading" title={text.loading} className="py-4" /> : error ? <WorkflowState state="error" title={text.error} description={error} onRetry={onRetry} retryLabel={text.retry} className="py-4" /> : patients.length === 0 ? <WorkflowState state="empty" title={text.empty} className="py-4" /> : selected ? (
        <div id={`${id}-context`} role="status" className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <p><span className="text-muted-foreground">{text.viewing} </span><span className="font-medium">{selected.name}</span></p>
          {selected.accessLabel && <p className="mt-1 text-xs text-muted-foreground">{selected.accessLabel}</p>}
        </div>
      ) : null}
    </div>
  )
}

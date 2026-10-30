"use client"

import * as React from "react"
import {
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  Home,
  Hospital,
  Pill,
  Printer,
  ShieldCheck,
  Stethoscope,
  UserCheck,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"

export type DischargeCondition = "stable" | "improved" | "guarded" | "critical"
export type DischargeDisposition = "home" | "snf" | "rehab" | "hospice" | "ama" | "expired"

export interface DischargeMedication {
  name: string
  sig: string
  status: "continued" | "new" | "changed" | "discontinued"
}

export interface DischargeSummaryData {
  id?: string
  patientName: string
  mrn?: string
  dateOfBirth?: string
  admissionDate: string
  dischargeDate: string
  attendingPhysician: string
  primaryDiagnosis: string
  secondaryDiagnoses?: string[]
  hospitalCourse: string
  dischargeCondition: DischargeCondition
  dischargeDisposition: DischargeDisposition
  medications?: DischargeMedication[]
  followUpInstructions?: string
  followUpAppointments?: { provider: string; specialty: string; timeFrame: string }[]
  signedAt?: string
}

export const DISCHARGE_CONDITION_LABELS: Record<DischargeCondition, string> = {
  stable: "Stable",
  improved: "Improved",
  guarded: "Guarded",
  critical: "Critical",
}

export const DISCHARGE_DISPOSITION_LABELS: Record<DischargeDisposition, string> = {
  home: "Home / Self-care",
  snf: "Skilled Nursing Facility (SNF)",
  rehab: "Inpatient Rehabilitation Facility",
  hospice: "Hospice Care",
  ama: "Against Medical Advice (AMA)",
  expired: "Deceased",
}

export function getDischargeConditionStatus(cond: DischargeCondition): ClinicalStatus {
  switch (cond) {
    case "stable":
    case "improved":
      return "normal"
    case "guarded":
      return "watch"
    case "critical":
      return "critical"
  }
}

const medStatusClasses: Record<DischargeMedication["status"], { label: string; status: ClinicalStatus }> = {
  new: { label: "New", status: "info" },
  continued: { label: "Continued", status: "normal" },
  changed: { label: "Changed", status: "watch" },
  discontinued: { label: "Discontinued", status: "abnormal" },
}

export interface DischargeSummaryProps extends Omit<React.ComponentProps<"div">, "title"> {
  summary: DischargeSummaryData
  onSign?: (summary: DischargeSummaryData) => void
  onPrint?: () => void
  readOnly?: boolean
  title?: React.ReactNode
}

export function DischargeSummary({
  summary,
  onSign,
  onPrint,
  readOnly = false,
  title = "Hospital Discharge Summary",
  className,
  ...props
}: DischargeSummaryProps) {
  const conditionStatus = getDischargeConditionStatus(summary.dischargeCondition)

  return (
    <div
      data-slot="discharge-summary"
      className={cn("overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    >
      {/* Document Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Hospital className="size-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">Inpatient Transition of Care Record</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ClinicalStatusBadge status={conditionStatus}>
            {DISCHARGE_CONDITION_LABELS[summary.dischargeCondition]}
          </ClinicalStatusBadge>
          <span className="rounded-md border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
            {DISCHARGE_DISPOSITION_LABELS[summary.dischargeDisposition]}
          </span>
        </div>
      </div>

      {/* Patient & Stay Timeline */}
      <div className="grid gap-4 border-b bg-muted/20 p-5 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Patient
          </span>
          <p className="text-sm font-semibold text-foreground mt-0.5">{summary.patientName}</p>
          {summary.mrn && <p className="font-mono text-muted-foreground">MRN: {summary.mrn}</p>}
        </div>

        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Admission & Discharge
          </span>
          <p className="text-foreground mt-0.5 font-medium">Admitted: {summary.admissionDate}</p>
          <p className="text-foreground font-medium">Discharged: {summary.dischargeDate}</p>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Attending Physician
          </span>
          <p className="text-foreground mt-0.5 font-medium">{summary.attendingPhysician}</p>
          <p className="text-muted-foreground">Internal Medicine Service</p>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Disposition
          </span>
          <p className="text-foreground mt-0.5 font-medium">
            {DISCHARGE_DISPOSITION_LABELS[summary.dischargeDisposition]}
          </p>
          <p className="text-muted-foreground">Condition: {DISCHARGE_CONDITION_LABELS[summary.dischargeCondition]}</p>
        </div>
      </div>

      <div className="space-y-6 p-5 text-sm">
        {/* Diagnoses */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Discharge Diagnoses
          </span>
          <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary uppercase">
                Primary
              </span>
              <span className="font-semibold text-foreground">{summary.primaryDiagnosis}</span>
            </div>
            {summary.secondaryDiagnoses && summary.secondaryDiagnoses.length > 0 && (
              <div className="border-t pt-2 space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Secondary / Comorbid Diagnoses:</span>
                <ul className="list-disc list-inside text-xs text-foreground/80 space-y-0.5">
                  {summary.secondaryDiagnoses.map((diag, idx) => (
                    <li key={idx}>{diag}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Hospital Course */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Hospital Course Narrative
          </span>
          <div className="rounded-lg border bg-muted/10 p-3.5 text-xs text-foreground/90 leading-relaxed font-sans">
            {summary.hospitalCourse}
          </div>
        </div>

        {/* Discharge Medications */}
        {summary.medications && summary.medications.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Pill className="size-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Reconciled Discharge Medications
              </span>
            </div>
            <div className="overflow-hidden rounded-lg border divide-y divide-border">
              {summary.medications.map((med, idx) => {
                const config = medStatusClasses[med.status]
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 p-3 text-xs hover:bg-muted/20">
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-medium text-foreground">{med.name}</p>
                      <p className="text-muted-foreground font-mono text-[11px]">{med.sig}</p>
                    </div>
                    <ClinicalStatusBadge status={config.status} dot={med.status === "new"}>
                      {config.label}
                    </ClinicalStatusBadge>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Follow-up Care & Appointments */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Follow-up Care & Appointments
            </span>
          </div>

          {summary.followUpAppointments && summary.followUpAppointments.length > 0 && (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {summary.followUpAppointments.map((app, idx) => (
                <div key={idx} className="rounded-lg border bg-card p-3 text-xs space-y-0.5">
                  <span className="font-semibold text-foreground">{app.provider}</span>
                  <p className="text-muted-foreground">{app.specialty}</p>
                  <p className="text-[11px] font-medium text-primary mt-1">Timeline: {app.timeFrame}</p>
                </div>
              ))}
            </div>
          )}

          {summary.followUpInstructions && (
            <div className="rounded-lg border border-clinical-watch/20 bg-clinical-watch/5 p-3 text-xs text-foreground/90 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-clinical-watch-foreground uppercase tracking-wider text-[11px]">
                <AlertTriangle className="size-3.5" /> Return Precautions & Patient Instructions
              </div>
              <p className="leading-relaxed text-xs">{summary.followUpInstructions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-5 py-3">
        <div className="text-xs text-muted-foreground">
          {summary.signedAt ? (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <CheckCircle2 className="size-3.5 text-clinical-normal" /> Finalized on {summary.signedAt}
            </span>
          ) : (
            <span>Physician sign-off required for transition of care.</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onPrint && (
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onPrint}>
              <Printer className="mr-1.5 size-3.5" /> Print Summary
            </Button>
          )}

          {!readOnly && onSign && (
            <Button size="sm" className="h-8 text-xs" onClick={() => onSign(summary)}>
              <FileCheck2 className="mr-1.5 size-3.5" /> Sign & Finalize Discharge
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

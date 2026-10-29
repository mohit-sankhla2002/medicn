"use client"

import * as React from "react"
import { AlertTriangle, Check, Copy, ShieldAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type AllergySeverity = "mild" | "moderate" | "severe"

export interface PatientAllergy {
  substance: string
  reaction?: string
  severity?: AllergySeverity
}

export type PatientFlagTone = "default" | "warning" | "critical"

export interface PatientFlag {
  label: string
  tone?: PatientFlagTone
}

export interface Patient {
  name: string
  /** Medical record number. */
  mrn: string
  /** Pre-formatted, e.g. "Mar 14, 1986". */
  dateOfBirth?: string
  age?: number
  sex?: string
  pronouns?: string
  avatarUrl?: string
  allergies?: PatientAllergy[]
  flags?: PatientFlag[]
  /** Extra label/value pairs, e.g. Primary care, Insurance, Language. */
  details?: { label: string; value: React.ReactNode }[]
}

const allergyClasses: Record<AllergySeverity, string> = {
  mild: "border-clinical-watch/25 bg-clinical-watch/10 text-clinical-watch-foreground",
  moderate: "border-clinical-abnormal/25 bg-clinical-abnormal/10 text-clinical-abnormal-foreground",
  severe: "border-clinical-critical/25 bg-clinical-critical/10 text-clinical-critical-foreground",
}

const flagClasses: Record<PatientFlagTone, string> = {
  default: "border-border bg-muted text-foreground",
  warning: "border-clinical-watch/25 bg-clinical-watch/10 text-clinical-watch-foreground",
  critical: "border-clinical-critical bg-clinical-critical text-white",
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function CopyMrn({ mrn }: { mrn: string }) {
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timeout)
  }, [copied])
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={copied ? "MRN copied" : "Copy MRN"}
      onClick={() => {
        void navigator.clipboard?.writeText(mrn)
        setCopied(true)
      }}
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  )
}

export interface PatientHeaderProps extends React.ComponentProps<"header"> {
  patient: Patient
  /** Right-aligned slot for actions such as "Start visit". */
  actions?: React.ReactNode
  /** Compact single-line banner for sticky use in charts. */
  compact?: boolean
}

export function PatientHeader({ patient, actions, compact = false, className, ...props }: PatientHeaderProps) {
  const allergies = patient.allergies
  const demographics = [
    patient.age != null ? `${patient.age} y` : null,
    patient.sex,
    patient.pronouns,
    patient.dateOfBirth ? `DOB ${patient.dateOfBirth}` : null,
  ].filter(Boolean)

  return (
    <TooltipProvider>
      <header
        data-slot="patient-header"
        className={cn(
          "flex flex-col gap-4 rounded-xl border bg-card text-card-foreground",
          compact ? "p-3" : "p-4 sm:p-5",
          className,
        )}
        {...props}
      >
        <div className="flex flex-wrap items-start gap-4">
          <Avatar className={cn(compact ? "size-9" : "size-12")}>
            {patient.avatarUrl && <AvatarImage src={patient.avatarUrl} alt="" />}
            <AvatarFallback className="bg-primary/10 font-medium text-primary">{initials(patient.name)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className={cn("font-semibold tracking-tight", compact ? "text-base" : "text-lg")}>{patient.name}</h2>
              {patient.flags?.map((flag) => (
                <span
                  key={flag.label}
                  className={cn(
                    "inline-flex h-5 items-center rounded-md border px-1.5 text-[11px] font-semibold tracking-wide uppercase",
                    flagClasses[flag.tone ?? "default"],
                  )}
                >
                  {flag.label}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {demographics.length > 0 && <span>{demographics.join(" · ")}</span>}
              <span className="inline-flex items-center gap-1">
                <span>
                  MRN <span className="font-mono text-foreground">{patient.mrn}</span>
                </span>
                <CopyMrn mrn={patient.mrn} />
              </span>
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>

        {!compact && (
          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
              <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <ShieldAlert className="size-3.5" />
                Allergies
              </span>
              {allergies === undefined ? (
                <span className="text-xs text-muted-foreground">Not recorded</span>
              ) : allergies.length === 0 ? (
                <span className="inline-flex h-5 items-center rounded-full border border-clinical-normal/25 bg-clinical-normal/10 px-2 text-xs font-medium text-clinical-normal-foreground">
                  NKDA
                </span>
              ) : (
                allergies.map((allergy) => (
                  <Tooltip key={allergy.substance}>
                    <TooltipTrigger asChild>
                      <span
                        tabIndex={0}
                        className={cn(
                          "inline-flex h-5 items-center gap-1 rounded-full border px-2 text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                          allergyClasses[allergy.severity ?? "moderate"],
                        )}
                      >
                        {allergy.severity === "severe" && <AlertTriangle className="size-3" />}
                        {allergy.substance}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {allergy.reaction ?? "Reaction not recorded"}
                      {allergy.severity ? ` · ${allergy.severity}` : ""}
                    </TooltipContent>
                  </Tooltip>
                ))
              )}
            </div>
            {patient.details && patient.details.length > 0 && (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:flex sm:flex-wrap sm:justify-end">
                {patient.details.map((detail) => (
                  <div key={detail.label} className="flex flex-col">
                    <dt className="text-xs text-muted-foreground">{detail.label}</dt>
                    <dd className="font-medium">{detail.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
      </header>
    </TooltipProvider>
  )
}

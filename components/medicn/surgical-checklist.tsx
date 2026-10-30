"use client"

import * as React from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ClinicalStatusBadge } from "@/components/medicn/clinical-status-badge"

export interface ChecklistItem {
  id: string
  label: string
  description?: string
  checked: boolean
  critical?: boolean
}

export interface ChecklistPhase {
  id: string
  title: string
  subtitle: string
  items: ChecklistItem[]
  completed?: boolean
  completedAt?: string
  completedBy?: string
}

export const WHO_CHECKLIST_PHASES: Record<string, ChecklistPhase> = {
  signIn: {
    id: "signIn",
    title: "Sign In",
    subtitle: "Before induction of anesthesia (with nurse & anesthesia provider)",
    items: [
      {
        id: "si-1",
        label: "Patient identity, site, procedure & consent confirmed",
        description: "Patient verbally verifies name, DOB, operative site, procedure.",
        checked: false,
        critical: true,
      },
      {
        id: "si-2",
        label: "Surgical site marked by operating surgeon",
        description: "Not applicable if midline or non-lateralized.",
        checked: false,
      },
      {
        id: "si-3",
        label: "Anesthesia safety check complete",
        description: "Machine, medication, monitors, suction fully operational.",
        checked: false,
      },
      {
        id: "si-4",
        label: "Pulse oximeter functioning on patient",
        checked: false,
      },
      {
        id: "si-5",
        label: "Allergies reviewed & confirmed",
        description: "Confirm NKDA or active drug allergies with team.",
        checked: false,
        critical: true,
      },
      {
        id: "si-6",
        label: "Difficult airway / aspiration risk assessed",
        description: "Equipment & assistance available if indicated.",
        checked: false,
      },
      {
        id: "si-7",
        label: "Risk of > 500 mL blood loss (7 mL/kg in children) assessed",
        description: "IV access and blood products planned.",
        checked: false,
      },
    ],
  },
  timeOut: {
    id: "timeOut",
    title: "Time Out",
    subtitle: "Before skin incision (entire surgical team verbally participates)",
    items: [
      {
        id: "to-1",
        label: "All team members introduced by name and clinical role",
        checked: false,
      },
      {
        id: "to-2",
        label: "Surgeon, anesthesia & nurse verbally confirm patient, site & procedure",
        checked: false,
        critical: true,
      },
      {
        id: "to-3",
        label: "Prophylactic antibiotic administered within past 60 minutes",
        description: "Or confirmed not indicated.",
        checked: false,
      },
      {
        id: "to-4",
        label: "Surgeon reviews: critical steps, duration, expected blood loss",
        checked: false,
      },
      {
        id: "to-5",
        label: "Anesthesia reviews: patient-specific concerns, airway, hemodynamics",
        checked: false,
      },
      {
        id: "to-6",
        label: "Nursing team reviews: sterility indicators, equipment issues",
        checked: false,
      },
      {
        id: "to-7",
        label: "Essential imaging displayed in the operating room",
        checked: false,
      },
    ],
  },
  signOut: {
    id: "signOut",
    title: "Sign Out",
    subtitle: "Before patient leaves operating room (with nurse, surgeon & anesthesia)",
    items: [
      {
        id: "so-1",
        label: "Nurse verbally confirms: name of the procedure recorded",
        checked: false,
      },
      {
        id: "so-2",
        label: "Instrument, sponge and needle counts are correct",
        description: "Confirmed by scrub and circulating nurses.",
        checked: false,
        critical: true,
      },
      {
        id: "so-3",
        label: "Specimen labeled (including patient name and anatomic site)",
        checked: false,
      },
      {
        id: "so-4",
        label: "Equipment problems or malfunctions addressed",
        checked: false,
      },
      {
        id: "so-5",
        label: "Key concerns for recovery, PACU monitoring & post-op management reviewed",
        checked: false,
      },
    ],
  },
}

export function calculateChecklistProgress(phases: ChecklistPhase[]): {
  total: number
  checked: number
  percentage: number
} {
  let total = 0
  let checked = 0
  for (const phase of phases) {
    for (const item of phase.items) {
      total++
      if (item.checked) checked++
    }
  }
  const percentage = total > 0 ? Math.round((checked / total) * 100) : 0
  return { total, checked, percentage }
}

export interface SurgicalChecklistProps extends Omit<React.ComponentProps<"div">, "title"> {
  procedureName?: string
  patientName?: string
  orRoom?: string
  phases?: ChecklistPhase[]
  onPhaseComplete?: (phaseId: string) => void
  onComplete?: () => void
  readOnly?: boolean
  title?: React.ReactNode
}

export function SurgicalChecklist({
  procedureName = "Surgical Procedure",
  patientName = "Patient",
  orRoom = "OR 4",
  phases: initialPhases,
  onPhaseComplete,
  onComplete,
  readOnly = false,
  title = "Surgical Safety Checklist",
  className,
  ...props
}: SurgicalChecklistProps) {
  const [phases, setPhases] = React.useState<ChecklistPhase[]>(() => {
    if (initialPhases) return initialPhases
    return Object.values(WHO_CHECKLIST_PHASES)
  })

  const [activePhaseId, setActivePhaseId] = React.useState<string>(phases[0]?.id ?? "signIn")

  const progress = React.useMemo(() => calculateChecklistProgress(phases), [phases])

  const toggleItem = (phaseId: string, itemId: string) => {
    if (readOnly) return
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id !== phaseId) return p
        return {
          ...p,
          items: p.items.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
        }
      })
    )
  }

  const markPhaseComplete = (phaseId: string) => {
    setPhases((prev) => {
      const next = prev.map((p) => {
        if (p.id !== phaseId) return p
        return {
          ...p,
          completed: true,
          completedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
      })
      const allDone = next.every((p) => p.items.every((i) => i.checked))
      if (allDone) onComplete?.()
      return next
    })
    onPhaseComplete?.(phaseId)
  }

  return (
    <div
      data-slot="surgical-checklist"
      className={cn("overflow-hidden rounded-xl border bg-card text-card-foreground", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="size-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">WHO Safe Surgery Saves Lives Protocol</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-semibold text-foreground">{progress.percentage}%</span>
            <p className="text-[10px] text-muted-foreground">
              {progress.checked} / {progress.total} verified
            </p>
          </div>
          <ClinicalStatusBadge
            status={progress.percentage === 100 ? "normal" : progress.percentage > 0 ? "watch" : "unknown"}
          >
            {progress.percentage === 100 ? "Complete" : "In Progress"}
          </ClinicalStatusBadge>
        </div>
      </div>

      {/* Procedure summary strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-5 py-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-semibold text-foreground">{procedureName}</span>
          <span className="text-muted-foreground">Patient: {patientName}</span>
          <span className="text-muted-foreground font-mono">Location: {orRoom}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
          <Users className="size-3.5" /> Team Verification Required
        </div>
      </div>

      {/* Phase selection tabs */}
      <div className="grid grid-cols-3 border-b text-xs">
        {phases.map((phase, idx) => {
          const allItemsChecked = phase.items.every((i) => i.checked)
          const isSelected = activePhaseId === phase.id

          return (
            <button
              key={phase.id}
              type="button"
              onClick={() => setActivePhaseId(phase.id)}
              className={cn(
                "flex flex-col items-center justify-center border-r p-3 text-center transition-colors last:border-r-0",
                isSelected
                  ? "bg-background border-b-2 border-b-primary font-semibold text-foreground shadow-xs"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium">Phase {idx + 1}: {phase.title}</span>
                {phase.completed || allItemsChecked ? (
                  <CheckCircle2 className="size-3.5 text-clinical-normal" />
                ) : null}
              </div>
              <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                {phase.id === "signIn" ? "Pre-Induction" : phase.id === "timeOut" ? "Pre-Incision" : "Pre-PACU"}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active Phase Items */}
      {phases.map((phase) => {
        if (phase.id !== activePhaseId) return null
        const allChecked = phase.items.every((i) => i.checked)

        return (
          <div key={phase.id} className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-foreground">{phase.title}</h4>
                <p className="text-xs text-muted-foreground">{phase.subtitle}</p>
              </div>

              {!readOnly && (
                <Button
                  size="sm"
                  variant={allChecked ? "default" : "outline"}
                  className="h-8 text-xs"
                  disabled={!allChecked || phase.completed}
                  onClick={() => markPhaseComplete(phase.id)}
                >
                  <CheckCircle2 className="mr-1.5 size-3.5" />
                  {phase.completed ? `Completed at ${phase.completedAt}` : `Complete ${phase.title}`}
                </Button>
              )}
            </div>

            <div className="space-y-2.5">
              {phase.items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                    item.checked
                      ? "border-clinical-normal/30 bg-clinical-normal/5"
                      : "border-border bg-card"
                  )}
                >
                  <Checkbox
                    id={`chk-${item.id}`}
                    disabled={readOnly}
                    checked={item.checked}
                    onCheckedChange={() => toggleItem(phase.id, item.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 space-y-0.5">
                    <Label
                      htmlFor={`chk-${item.id}`}
                      className={cn(
                        "text-xs font-medium cursor-pointer leading-tight",
                        item.checked && "text-foreground line-through opacity-80"
                      )}
                    >
                      {item.label}
                    </Label>
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  {item.critical && (
                    <span className="shrink-0 rounded bg-clinical-critical/10 px-1.5 py-0.5 text-[10px] font-semibold text-clinical-critical uppercase">
                      Stop Point
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

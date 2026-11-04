"use client"

import * as React from "react"
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bed,
  CheckCircle2,
  Clock,
  Flame,
  Heart,
  HeartPulse,
  Siren,
  Stethoscope,
  Timer,
  User,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"

export type EsiLevel = 1 | 2 | 3 | 4 | 5

export interface EsiCriteria {
  immediateLifeThreat?: boolean
  highRisk?: boolean
  severePain?: boolean
  confusedLethargic?: boolean
  resourceCount?: number
}

export interface TriageVitals {
  hr?: number
  bp?: string
  rr?: number
  spo2?: number
  temp?: number
  pain?: number
}

export interface TriageData {
  patientName: string
  chiefComplaint: string
  esiLevel: EsiLevel
  vitals?: TriageVitals
  triageNotes?: string
  assignedBed?: string
  triagedAt?: string
  triageNurse?: string
}

export const ESI_LEVELS: Record<
  EsiLevel,
  {
    level: EsiLevel
    label: string
    description: string
    clinicalStatus: ClinicalStatus
    colorClass: string
    reassessmentInterval: string
  }
> = {
  1: {
    level: 1,
    label: "Resuscitation",
    description: "Immediate life-saving intervention needed without delay. Unresponsive, intubated, pulseless, or severe respiratory distress.",
    clinicalStatus: "critical",
    colorClass: "border-clinical-critical bg-clinical-critical text-white",
    reassessmentInterval: "Continuous nursing presence",
  },
  2: {
    level: 2,
    label: "Emergent",
    description: "High-risk situation, confused / lethargic / disoriented, or severe pain / distress (pain ≥ 7/10).",
    clinicalStatus: "critical",
    colorClass: "border-clinical-critical/40 bg-clinical-critical/10 text-clinical-critical",
    reassessmentInterval: "Every 15 minutes",
  },
  3: {
    level: 3,
    label: "Urgent",
    description: "Requires two or more projected resources (labs + imaging, IV meds, specialty consult). Vitals in danger zone require up-triage.",
    clinicalStatus: "abnormal",
    colorClass: "border-clinical-abnormal/40 bg-clinical-abnormal/10 text-clinical-abnormal",
    reassessmentInterval: "Every 30 minutes",
  },
  4: {
    level: 4,
    label: "Less Urgent",
    description: "Requires one projected diagnostic or therapeutic resource (e.g. single X-ray, simple suture, oral meds).",
    clinicalStatus: "normal",
    colorClass: "border-clinical-normal/40 bg-clinical-normal/10 text-clinical-normal",
    reassessmentInterval: "Every 60 minutes",
  },
  5: {
    level: 5,
    label: "Non-Urgent",
    description: "Requires no projected resources (e.g. routine prescription refill, suture removal, minor rash, normal exam).",
    clinicalStatus: "info",
    colorClass: "border-clinical-info/40 bg-clinical-info/10 text-clinical-info",
    reassessmentInterval: "Every 120 minutes",
  },
}

export function getEsiLevelInfo(level: number) {
  const safeLevel = (level >= 1 && level <= 5 ? level : 3) as EsiLevel
  return ESI_LEVELS[safeLevel]
}

export function recommendEsiLevel(criteria: EsiCriteria): EsiLevel {
  if (criteria.immediateLifeThreat) return 1
  if (criteria.highRisk || criteria.severePain || criteria.confusedLethargic) return 2
  if (criteria.resourceCount != null) {
    if (criteria.resourceCount >= 2) return 3
    if (criteria.resourceCount === 1) return 4
    return 5
  }
  return 3
}

export interface TriageAssessmentProps extends Omit<React.ComponentProps<"div">, "title"> {
  patientName?: string
  mrn?: string
  chiefComplaint?: string
  defaultLevel?: EsiLevel
  vitals?: TriageVitals
  triageNurse?: string
  onTriage?: (data: TriageData) => void
  readOnly?: boolean
  title?: React.ReactNode
}

export function TriageAssessment({
  patientName = "Patient Name",
  mrn = "MRN-39182",
  chiefComplaint: initialChiefComplaint = "",
  defaultLevel = 3,
  vitals = { hr: 88, bp: "128/82", rr: 16, spo2: 98, temp: 98.6, pain: 4 },
  triageNurse = "R. Davis, BSN, RN",
  onTriage,
  readOnly = false,
  title = "Emergency Triage Assessment",
  className,
  ...props
}: TriageAssessmentProps) {
  const [esiLevel, setEsiLevel] = React.useState<EsiLevel>(defaultLevel)
  const [chiefComplaint, setChiefComplaint] = React.useState(initialChiefComplaint)
  const [triageNotes, setTriageNotes] = React.useState("")
  const [assignedBed, setAssignedBed] = React.useState("Waiting Room 1")

  const levelInfo = getEsiLevelInfo(esiLevel)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onTriage?.({
      patientName,
      chiefComplaint,
      esiLevel,
      vitals,
      triageNotes,
      assignedBed,
      triageNurse,
      triagedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    })
  }

  return (
    <div
      data-slot="triage-assessment"
      className={cn("overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Siren className="size-5 text-destructive" />
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">Emergency Severity Index (ESI) 5-Level Algorithm</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={cn("rounded-md px-2.5 py-1 text-xs font-bold", levelInfo.colorClass)}>
            ESI {levelInfo.level}: {levelInfo.label}
          </span>
        </div>
      </div>

      {/* Patient & Triage Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-2.5 text-xs bg-muted/10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-semibold text-foreground">{patientName}</span>
          <span className="font-mono text-muted-foreground">{mrn}</span>
          <span className="text-muted-foreground">Nurse: {triageNurse}</span>
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
          <Timer className="size-3.5" /> Reassess: {levelInfo.reassessmentInterval}
        </div>
      </div>

      {/* Triage Vitals Quick Bar */}
      <div className="grid grid-cols-3 gap-2 border-b bg-muted/30 px-5 py-2.5 sm:grid-cols-6 text-xs">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">HR</span>
          <p className="font-mono font-medium">{vitals.hr ?? "--"} <span className="text-[10px] text-muted-foreground">bpm</span></p>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">BP</span>
          <p className="font-mono font-medium">{vitals.bp ?? "--"}</p>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">SpO2</span>
          <p className="font-mono font-medium">{vitals.spo2 ?? "--"}%</p>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">RR</span>
          <p className="font-mono font-medium">{vitals.rr ?? "--"} <span className="text-[10px] text-muted-foreground">/min</span></p>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Temp</span>
          <p className="font-mono font-medium">{vitals.temp ?? "--"}°F</p>
        </div>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Pain</span>
          <p className={cn("font-mono font-medium", (vitals.pain ?? 0) >= 7 ? "text-clinical-critical" : "")}>
            {vitals.pain ?? 0}/10
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Chief Complaint */}
        <div className="space-y-1">
          <Label htmlFor="triage-complaint" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Chief Complaint & Triage Presentation <span className="text-destructive">*</span>
          </Label>
          <Input
            id="triage-complaint"
            disabled={readOnly}
            placeholder="e.g. Acute severe substernal chest pressure with diaphoresis"
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            required
            className="text-xs font-medium"
          />
        </div>

        {/* ESI Acuity Selector */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Select ESI Acuity Level
          </span>
          <div className="grid gap-2 sm:grid-cols-5">
            {([1, 2, 3, 4, 5] as EsiLevel[]).map((level) => {
              const info = ESI_LEVELS[level]
              const isSelected = esiLevel === level

              return (
                <button
                  key={level}
                  type="button"
                  disabled={readOnly}
                  onClick={() => setEsiLevel(level)}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-lg border text-left transition-all",
                    isSelected
                      ? cn("ring-2 ring-primary shadow-xs font-semibold", info.colorClass)
                      : "border-border bg-card hover:bg-muted/30 text-foreground"
                  )}
                >
                  <span className="text-xs font-bold leading-none mb-1">
                    ESI {level}: {info.label}
                  </span>
                  <p className="text-[10px] opacity-80 line-clamp-3 leading-tight">
                    {info.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Bed Assignment & Nursing Notes */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="triage-bed" className="text-xs text-muted-foreground">
              Initial Bed / Zone Assignment
            </Label>
            <Input
              id="triage-bed"
              disabled={readOnly}
              placeholder="e.g. Trauma Bay 1, Bed 12, Fast Track 3"
              value={assignedBed}
              onChange={(e) => setAssignedBed(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="triage-notes" className="text-xs text-muted-foreground">
              Triage Assessment Notes
            </Label>
            <Input
              id="triage-notes"
              disabled={readOnly}
              placeholder="Focused appearance, airway/breathing, immediate interventions taken"
              value={triageNotes}
              onChange={(e) => setTriageNotes(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>Emergency Medical Treatment and Labor Act (EMTALA) protocol recorded.</span>
          </div>

          {!readOnly && (
            <Button type="submit" size="sm" className="h-8 text-xs">
              <CheckCircle2 className="mr-1.5 size-3.5" />
              Complete Triage & Assign Bed
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

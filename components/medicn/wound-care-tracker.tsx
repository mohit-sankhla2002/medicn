"use client"

import * as React from "react"
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Crosshair,
  Layers,
  Plus,
  Ruler,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ClinicalStatusBadge } from "@/components/medicn/clinical-status-badge"

export type WoundType = "pressure" | "surgical" | "diabetic" | "venous" | "arterial" | "trauma"
export type WoundStage = "stage1" | "stage2" | "stage3" | "stage4" | "unstageable" | "dti" | "na"

export interface WoundAssessment {
  id: string
  date: string
  lengthCm: number
  widthCm: number
  depthCm?: number
  areaCm2?: number
  stage?: WoundStage
  exudateAmount?: "none" | "scant" | "small" | "moderate" | "large"
  exudateType?: "serous" | "serosanguinous" | "sanguineous" | "purulent"
  granulationPercent?: number
  sloughPercent?: number
  escharPercent?: number
  periwound?: string
  painLevel?: number
  dressingApplied?: string
  assessor?: string
}

export interface Wound {
  id: string
  location: string
  type: WoundType
  acquiredDate: string
  assessments: WoundAssessment[]
}

export const WOUND_TYPE_LABELS: Record<WoundType, string> = {
  pressure: "Pressure Injury",
  surgical: "Surgical Wound / Dehiscence",
  diabetic: "Diabetic Neuropathic Ulcer",
  venous: "Venous Stasis Ulcer",
  arterial: "Arterial Ischemic Ulcer",
  trauma: "Traumatic Laceration / Tear",
}

export const WOUND_STAGE_LABELS: Record<WoundStage, string> = {
  stage1: "Stage 1 (Non-blanchable erythema)",
  stage2: "Stage 2 (Partial thickness skin loss)",
  stage3: "Stage 3 (Full thickness skin loss)",
  stage4: "Stage 4 (Full thickness tissue loss to bone/muscle)",
  unstageable: "Unstageable (Obscured by slough/eschar)",
  dti: "Deep Tissue Injury (DTI)",
  na: "Not Applicable",
}

export function calculateWoundArea(length: number, width: number): number {
  return Math.round(length * width * 10) / 10
}

export function calculateAreaReduction(initialArea: number, currentArea: number): number {
  if (initialArea <= 0) return 0
  const reduction = ((initialArea - currentArea) / initialArea) * 100
  return Math.round(reduction)
}

export interface WoundCareTrackerProps extends Omit<React.ComponentProps<"div">, "title"> {
  wound: Wound
  onAddAssessment?: (woundId: string) => void
  readOnly?: boolean
  title?: React.ReactNode
}

export function WoundCareTracker({
  wound,
  onAddAssessment,
  readOnly = false,
  title = "Wound Assessment & Healing Tracker",
  className,
  ...props
}: WoundCareTrackerProps) {
  const assessments = wound.assessments ?? []
  const initial = assessments[0]
  const latest = assessments[assessments.length - 1]

  const initialArea = initial ? (initial.areaCm2 ?? calculateWoundArea(initial.lengthCm, initial.widthCm)) : 0
  const currentArea = latest ? (latest.areaCm2 ?? calculateWoundArea(latest.lengthCm, latest.widthCm)) : 0

  const reduction = initial && latest && assessments.length > 1 ? calculateAreaReduction(initialArea, currentArea) : 0
  const isImproving = reduction > 0

  return (
    <div
      data-slot="wound-care-tracker"
      className={cn("overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Layers className="size-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">Longitudinal Tissue Healing & Dimensions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && onAddAssessment && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => onAddAssessment(wound.id)}
            >
              <Plus className="mr-1 size-3.5" /> Record Assessment
            </Button>
          )}
        </div>
      </div>

      {/* Wound Header Info */}
      <div className="grid gap-3 border-b bg-muted/20 p-5 sm:grid-cols-3 text-xs">
        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Anatomic Location
          </span>
          <p className="text-sm font-semibold text-foreground mt-0.5">{wound.location}</p>
          <p className="text-muted-foreground">{WOUND_TYPE_LABELS[wound.type]}</p>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Current Dimensions
          </span>
          {latest ? (
            <div className="mt-0.5 space-y-0.5">
              <p className="text-sm font-mono font-semibold text-foreground">
                {latest.lengthCm} × {latest.widthCm} {latest.depthCm != null ? `× ${latest.depthCm}` : ""} cm
              </p>
              <p className="text-muted-foreground font-mono text-[11px]">Area: {currentArea} cm²</p>
            </div>
          ) : (
            <p className="text-muted-foreground mt-0.5">No assessments recorded</p>
          )}
        </div>

        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Trajectory
          </span>
          <div className="mt-1 flex items-center gap-2">
            {assessments.length > 1 ? (
              <>
                <ClinicalStatusBadge status={isImproving ? "normal" : "watch"}>
                  {reduction}% Area Reduction
                </ClinicalStatusBadge>
                <span className="text-[11px] text-muted-foreground">
                  {isImproving ? "Healing" : "Stalled"}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Baseline established</span>
            )}
          </div>
        </div>
      </div>

      {/* Longitudinal Assessments Log */}
      <div className="p-5 space-y-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
          Assessment History ({assessments.length})
        </span>

        {assessments.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No clinical wound assessments logged.
          </div>
        ) : (
          <div className="space-y-2.5">
            {assessments.map((a, idx) => {
              const area = a.areaCm2 ?? calculateWoundArea(a.lengthCm, a.widthCm)

              return (
                <div
                  key={a.id || idx}
                  className="rounded-lg border bg-card p-3.5 text-xs shadow-xs space-y-2 hover:bg-muted/10 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{a.date}</span>
                      {a.stage && (
                        <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                          {WOUND_STAGE_LABELS[a.stage]?.split(" ")[0]} {WOUND_STAGE_LABELS[a.stage]?.split(" ")[1]}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 font-mono text-muted-foreground text-[11px]">
                      <span>{a.lengthCm} cm (L) × {a.widthCm} cm (W)</span>
                      <span className="font-semibold text-foreground">{area} cm²</span>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 pt-1 border-t text-[11px]">
                    <div>
                      <span className="text-muted-foreground">Exudate: </span>
                      <span className="font-medium text-foreground capitalize">
                        {a.exudateAmount ?? "None"} {a.exudateType ? `(${a.exudateType})` : ""}
                      </span>
                    </div>
                    {a.dressingApplied && (
                      <div>
                        <span className="text-muted-foreground">Dressing: </span>
                        <span className="font-medium text-foreground">{a.dressingApplied}</span>
                      </div>
                    )}
                  </div>

                  {a.assessor && (
                    <div className="text-[10px] text-muted-foreground pt-0.5">
                      Evaluated by: {a.assessor}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

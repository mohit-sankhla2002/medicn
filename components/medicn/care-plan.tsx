"use client"

import * as React from "react"
import {
  Apple,
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  HeartHandshake,
  ListOrdered,
  Plus,
  Stethoscope,
  Target,
  User,
  Users2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ClinicalStatusBadge, type ClinicalStatus } from "@/components/medicn/clinical-status-badge"

export type CareGoalStatus = "active" | "in-progress" | "achieved" | "cancelled"
export type CareDiscipline = "nursing" | "medical" | "dietary" | "physical-therapy" | "social-work"

export interface CareIntervention {
  id: string
  title: string
  discipline: CareDiscipline
  frequency?: string
  completed?: boolean
}

export interface CareGoal {
  id: string
  problem: string
  goalStatement: string
  targetDate?: string
  status: CareGoalStatus
  progressPercent?: number
  interventions: CareIntervention[]
  responsibleProvider?: string
}

export const CARE_GOAL_STATUS_LABELS: Record<CareGoalStatus, string> = {
  active: "Active",
  "in-progress": "In Progress",
  achieved: "Achieved",
  cancelled: "Discontinued",
}

export function getCareGoalStatus(status: CareGoalStatus): ClinicalStatus {
  switch (status) {
    case "achieved":
      return "normal"
    case "in-progress":
      return "watch"
    case "active":
      return "info"
    case "cancelled":
      return "unknown"
  }
}

export function calculatePlanProgress(goals: CareGoal[]): number {
  if (goals.length === 0) return 0
  const sum = goals.reduce((acc, g) => acc + (g.progressPercent ?? 0), 0)
  return Math.round(sum / goals.length)
}

const disciplineBadges: Record<CareDiscipline, { label: string; class: string }> = {
  nursing: { label: "Nursing", class: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  medical: { label: "Medical", class: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  dietary: { label: "Dietary", class: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  "physical-therapy": { label: "PT / Rehab", class: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  "social-work": { label: "Social Work", class: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20" },
}

export interface CarePlanProps extends Omit<React.ComponentProps<"div">, "title"> {
  goals: CareGoal[]
  onAddGoal?: () => void
  onToggleIntervention?: (goalId: string, interventionId: string, completed: boolean) => void
  readOnly?: boolean
  title?: React.ReactNode
}

export function CarePlan({
  goals: initialGoals,
  onAddGoal,
  onToggleIntervention,
  readOnly = false,
  title = "Interdisciplinary Care Plan",
  className,
  ...props
}: CarePlanProps) {
  const [goals, setGoals] = React.useState<CareGoal[]>(initialGoals)

  React.useEffect(() => {
    setGoals(initialGoals)
  }, [initialGoals])

  const overallProgress = React.useMemo(() => calculatePlanProgress(goals), [goals])

  const handleToggle = (goalId: string, interventionId: string, currentCompleted: boolean) => {
    if (readOnly) return
    const nextCompleted = !currentCompleted
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g
        return {
          ...g,
          interventions: g.interventions.map((i) =>
            i.id === interventionId ? { ...i, completed: nextCompleted } : i
          ),
        }
      })
    )
    onToggleIntervention?.(goalId, interventionId, nextCompleted)
  }

  return (
    <div
      data-slot="care-plan"
      className={cn("overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Target className="size-5 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">Measurable Outcomes & Interventions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-semibold text-foreground">{overallProgress}%</span>
            <p className="text-[10px] text-muted-foreground">Overall Goal Progress</p>
          </div>
          {!readOnly && onAddGoal && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onAddGoal}>
              <Plus className="mr-1 size-3.5" /> Add Goal
            </Button>
          )}
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
          <HeartHandshake className="mb-2 size-6 opacity-40" />
          No active care goals established.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {goals.map((goal) => {
            const statusConfig = getCareGoalStatus(goal.status)

            return (
              <div key={goal.id} className="p-5 space-y-3.5 hover:bg-muted/10 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 max-w-xl">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                      {goal.problem}
                    </span>
                    <h4 className="text-sm font-semibold text-foreground leading-snug">
                      {goal.goalStatement}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <ClinicalStatusBadge status={statusConfig}>
                      {CARE_GOAL_STATUS_LABELS[goal.status]}
                    </ClinicalStatusBadge>
                  </div>
                </div>

                {/* Progress bar and Target Date */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-[11px]">
                      {goal.responsibleProvider && (
                        <span>Lead: <strong className="text-foreground">{goal.responsibleProvider}</strong></span>
                      )}
                    </span>
                    {goal.targetDate && (
                      <span className="text-[11px] font-medium text-foreground">
                        Target: {goal.targetDate}
                      </span>
                    )}
                  </div>
                  {goal.progressPercent != null && (
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min(Math.max(goal.progressPercent, 0), 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Interventions checklist */}
                {goal.interventions && goal.interventions.length > 0 && (
                  <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Target Interventions & Orders
                    </span>
                    <ul className="space-y-2">
                      {goal.interventions.map((intervention) => {
                        const badge = disciplineBadges[intervention.discipline]

                        return (
                          <li
                            key={intervention.id}
                            className="flex items-start justify-between gap-2 text-xs"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <Checkbox
                                id={`int-${intervention.id}`}
                                disabled={readOnly}
                                checked={intervention.completed ?? false}
                                onCheckedChange={() =>
                                  handleToggle(goal.id, intervention.id, intervention.completed ?? false)
                                }
                                className="mt-0.5"
                              />
                              <Label
                                htmlFor={`int-${intervention.id}`}
                                className={cn(
                                  "cursor-pointer leading-tight text-foreground",
                                  intervention.completed && "line-through text-muted-foreground"
                                )}
                              >
                                {intervention.title}
                              </Label>
                            </div>

                            <span
                              className={cn(
                                "shrink-0 rounded border px-1.5 py-0.2 text-[10px] font-medium",
                                badge.class
                              )}
                            >
                              {badge.label}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

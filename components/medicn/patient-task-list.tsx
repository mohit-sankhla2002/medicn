"use client"

import * as React from "react"
import { CheckCircle2, Circle, Clock, LockKeyhole } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WorkflowState } from "@/components/medicn/workflow-state"

export type PatientTaskStatus = "not-started" | "in-progress" | "completed" | "blocked"

export interface PatientTask {
  id: string
  title: string
  description?: string
  status: PatientTaskStatus
  /** Display-ready deadline; no deadline is inferred from the browser clock. */
  due?: string
  required?: boolean
  blockedReason?: string
  actionLabel?: string
}

export interface PatientTaskListProps extends Omit<React.ComponentProps<"section">, "title" | "children"> {
  tasks: PatientTask[]
  title?: React.ReactNode
  description?: React.ReactNode
  onTaskAction?: (task: PatientTask) => void
  renderActions?: (task: PatientTask) => React.ReactNode
  disabled?: boolean
  isLoading?: boolean
  error?: React.ReactNode
  onRetry?: () => void
  labels?: Partial<Record<PatientTaskStatus | "start" | "continue" | "review" | "required" | "empty" | "loading" | "error" | "retry" | "progress", string>>
}

const icons = { "not-started": Circle, "in-progress": Clock, completed: CheckCircle2, blocked: LockKeyhole }

/** Tasks are authoritative props. Starting a task does not mark it completed. */
export function PatientTaskList({ tasks, title = "Your next steps", description, onTaskAction, renderActions, disabled, isLoading, error, onRetry, labels, className, ...props }: PatientTaskListProps) {
  const id = React.useId()
  const text = { "not-started": "Not started", "in-progress": "In progress", completed: "Completed", blocked: "Unavailable", start: "Start", continue: "Continue", review: "Review", required: "Required", empty: "You have no tasks right now", loading: "Loading your tasks…", error: "Could not load your tasks", retry: "Try again", progress: "Tasks completed", ...labels }
  const completed = tasks.filter((task) => task.status === "completed").length
  return (
    <section data-slot="patient-task-list" aria-labelledby={`${id}-title`} aria-busy={isLoading || undefined} className={cn("w-full overflow-hidden rounded-xl border bg-card text-card-foreground", className)} {...props}>
      <div className="space-y-2 border-b px-5 py-4">
        <h3 id={`${id}-title`} className="font-semibold">{title}</h3>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
        {!isLoading && !error && tasks.length > 0 && <div className="flex items-center gap-3"><progress aria-label={text.progress} value={completed} max={tasks.length} className="h-2 w-full appearance-none overflow-hidden rounded-full bg-muted [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary" /><span className="shrink-0 text-xs tabular-nums text-muted-foreground">{completed} / {tasks.length}</span></div>}
      </div>
      {isLoading ? <WorkflowState state="loading" title={text.loading} /> : error ? <WorkflowState state="error" title={text.error} description={error} onRetry={onRetry} retryLabel={text.retry} /> : tasks.length === 0 ? <WorkflowState state="empty" title={text.empty} /> : (
        <ul className="divide-y">
          {tasks.map((task, index) => {
            const Icon = icons[task.status]
            const taskId = `${id}-${index}`
            return <li key={task.id} className="flex flex-wrap items-start gap-3 px-5 py-4">
              <Icon aria-hidden className={cn("mt-0.5 size-5 shrink-0 text-muted-foreground", task.status === "completed" && "text-primary")} />
              <div className="min-w-40 flex-1 space-y-1">
                <p id={`${taskId}-title`} className="text-sm font-medium">{task.title}</p>
                {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                <div id={`${taskId}-status`} className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{text[task.status]}</span>{task.required && <Badge variant="outline">{text.required}</Badge>}{task.due && <span>{task.due}</span>}</div>
                {task.blockedReason && <p className="text-xs text-muted-foreground">{task.blockedReason}</p>}
              </div>
              {renderActions ? renderActions(task) : onTaskAction && <Button type="button" variant="outline" size="sm" disabled={disabled || task.status === "blocked"} aria-describedby={`${taskId}-title ${taskId}-status`} onClick={() => onTaskAction(task)}>{task.actionLabel ?? (task.status === "completed" ? text.review : task.status === "in-progress" ? text.continue : text.start)}</Button>}
            </li>
          })}
        </ul>
      )}
    </section>
  )
}

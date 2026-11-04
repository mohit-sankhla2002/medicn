"use client"

import * as React from "react"
import { CircleAlert, Inbox, LoaderCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface WorkflowStateProps extends Omit<React.ComponentProps<"div">, "title" | "children"> {
  state: "loading" | "empty" | "error"
  title: React.ReactNode
  description?: React.ReactNode
  onRetry?: () => void
  retryLabel?: string
}

/** Shared feedback for data-backed workflows. The host owns fetching and retries. */
export function WorkflowState({ state, title, description, onRetry, retryLabel = "Try again", className, ...props }: WorkflowStateProps) {
  const Icon = state === "loading" ? LoaderCircle : state === "error" ? CircleAlert : Inbox
  return (
    <div data-slot="workflow-state" role={state === "error" ? "alert" : "status"} className={cn("flex flex-col items-center gap-2 px-6 py-10 text-center", className)} {...props}>
      <Icon aria-hidden className={cn("mb-1 size-5 text-muted-foreground", state === "loading" && "animate-spin motion-reduce:animate-none")} />
      <p className="text-sm font-medium">{title}</p>
      {description && <div className="max-w-sm text-sm text-muted-foreground">{description}</div>}
      {state === "error" && onRetry && <Button type="button" variant="outline" size="sm" className="mt-2" onClick={onRetry}>{retryLabel}</Button>}
    </div>
  )
}

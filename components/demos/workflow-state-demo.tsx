"use client"

import * as React from "react"
import { WorkflowState } from "@/components/medicn/workflow-state"

export default function WorkflowStateDemo() {
  const [recovered, setRecovered] = React.useState(false)
  return <div className="w-full max-w-md rounded-xl border bg-card"><WorkflowState state={recovered ? "empty" : "error"} title={recovered ? "You're all caught up" : "Could not load your tasks"} description={recovered ? "There are no outstanding tasks." : "Check your connection and try again."} onRetry={() => setRecovered(true)} /></div>
}

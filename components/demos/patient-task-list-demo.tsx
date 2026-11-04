"use client"

import * as React from "react"
import { PatientTaskList, type PatientTask } from "@/components/medicn/patient-task-list"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialTasks: PatientTask[] = [
  { id: "contact", title: "Confirm your contact details", description: "Help your care team reach you about your visit.", status: "in-progress", required: true, due: "Before your appointment" },
  { id: "intake", title: "Complete your health history", description: "Your medical history has been received.", status: "completed", required: true },
  { id: "results", title: "Review your visit summary", status: "blocked", blockedReason: "Available after your appointment." },
]

export default function PatientTaskListDemo() {
  const id = React.useId()
  const [tasks, setTasks] = React.useState(initialTasks)
  const [active, setActive] = React.useState<PatientTask | null>(null)
  return <div className="w-full max-w-xl">
    <PatientTaskList tasks={tasks} description="Get ready for your visit with Dr. Chen." onTaskAction={setActive} />
    <Dialog open={Boolean(active)} onOpenChange={(open) => { if (!open) setActive(null) }}><DialogContent><DialogHeader><DialogTitle>{active?.title}</DialogTitle><DialogDescription>{active?.description ?? "Review this step before your visit."}</DialogDescription></DialogHeader>
      {active?.id === "contact" ? <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); setTasks((previous) => previous.map((task) => task.id === active.id ? { ...task, status: "completed" } : task)); setActive(null) }}><div className="space-y-2"><Label htmlFor={id}>Email address</Label><Input id={id} type="email" defaultValue="alex@example.com" required /></div><Button type="submit">Save and complete</Button></form> : <p className="text-sm">Your health history is complete. You can discuss any updates with your care team.</p>}
    </DialogContent></Dialog>
  </div>
}

"use client"

import * as React from "react"
import { PatientWorklist, type WorklistPatient } from "@/components/medicn/patient-worklist"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const initialPatients: WorklistPatient[] = [
  { id: "visit-1", patientId: "patient-1", name: "Alex Morgan", identifier: "MRN 1042", appointmentTime: "09:00 IST", reason: "Follow-up", provider: "Dr. Chen", location: "Waiting area", status: "arrived", waitingTime: "Waiting 12 min" },
  { id: "visit-2", patientId: "patient-2", name: "Jamie Patel", identifier: "MRN 2086", appointmentTime: "09:15 IST", reason: "Annual review", provider: "Dr. Chen", location: "Room 2", status: "roomed" },
  { id: "visit-3", patientId: "patient-3", name: "Taylor Reed", identifier: "MRN 3018", appointmentTime: "09:30 IST", reason: "New patient", provider: "Dr. Okafor", status: "scheduled" },
]

export default function PatientWorklistDemo() {
  const [patients, setPatients] = React.useState(initialPatients)
  const [selected, setSelected] = React.useState<WorklistPatient | null>(null)
  return <div className="w-full">
    <PatientWorklist patients={patients} onPatientSelect={setSelected} renderActions={(patient) => patient.status === "arrived" ? <Button type="button" variant="outline" size="sm" onClick={() => setPatients((previous) => previous.map((item) => item.id === patient.id ? { ...item, status: "roomed", location: "Room 3", waitingTime: undefined } : item))}>Assign Room 3<span className="sr-only"> to {patient.name}</span></Button> : null} />
    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null) }}><DialogContent><DialogHeader><DialogTitle>{selected?.name}</DialogTitle><DialogDescription>{selected?.identifier} · {selected?.reason}</DialogDescription></DialogHeader><dl className="space-y-2 text-sm"><div><dt className="text-muted-foreground">Provider</dt><dd>{selected?.provider}</dd></div><div><dt className="text-muted-foreground">Appointment</dt><dd>{selected?.appointmentTime}</dd></div></dl></DialogContent></Dialog>
  </div>
}

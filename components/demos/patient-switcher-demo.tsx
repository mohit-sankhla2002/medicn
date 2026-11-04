"use client"

import * as React from "react"
import { PatientSwitcher, type PatientProfile } from "@/components/medicn/patient-switcher"

const profiles: PatientProfile[] = [
  { id: "self", name: "Alex Morgan", relationship: "You", detail: "ID ••1042", accessLabel: "Your health record" },
  { id: "child", name: "Sam Morgan", relationship: "Child", detail: "ID ••2086", accessLabel: "Proxy access · appointments and messages" },
  { id: "parent", name: "Robin Morgan", relationship: "Parent", detail: "ID ••3018", accessLabel: "Read-only access" },
]

export default function PatientSwitcherDemo() {
  const [patientId, setPatientId] = React.useState("self")
  return <div className="w-full max-w-md"><PatientSwitcher patients={profiles} value={patientId} onPatientChange={(patient) => setPatientId(patient.id)} /></div>
}

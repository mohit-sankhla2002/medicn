"use client"

import * as React from "react"
import { TriageAssessment, type TriageData } from "@/components/medicn/triage-assessment"

export default function TriageAssessmentDemo() {
  const handleTriage = (data: TriageData) => {
    alert(
      `Triage Complete:\nPatient: ${data.patientName}\nESI Acuity: Level ${data.esiLevel}\nAssigned Bed: ${data.assignedBed}\nChief Complaint: ${data.chiefComplaint}`
    )
  }

  return (
    <div className="flex w-full justify-center p-4">
      <TriageAssessment
        className="w-full max-w-2xl"
        patientName="Arthur Dent (54yo M)"
        mrn="ED-2024-8901"
        chiefComplaint="Sudden onset substernal chest pressure radiating to left jaw, diaphoresis"
        defaultLevel={2}
        vitals={{
          hr: 104,
          bp: "158/96",
          rr: 22,
          spo2: 95,
          temp: 99.1,
          pain: 8,
        }}
        triageNurse="Sarah Jenkins, BSN, RN, CEN"
        onTriage={handleTriage}
      />
    </div>
  )
}

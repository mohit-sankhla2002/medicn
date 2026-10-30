"use client"

import * as React from "react"
import { SurgicalChecklist } from "@/components/medicn/surgical-checklist"

export default function SurgicalChecklistDemo() {
  const handleComplete = () => {
    alert("WHO Surgical Safety Checklist 100% complete. Case cleared for transfer to PACU.")
  }

  return (
    <div className="flex w-full justify-center p-4">
      <SurgicalChecklist
        className="w-full max-w-3xl"
        procedureName="Laparoscopic Cholecystectomy with Cholangiogram"
        patientName="Sarah Mitchell (DOB: 1982-04-18, MRN-48192)"
        orRoom="Operating Suite 3 (Main Hospital)"
        onComplete={handleComplete}
      />
    </div>
  )
}

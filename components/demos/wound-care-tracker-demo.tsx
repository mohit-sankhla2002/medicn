"use client"

import * as React from "react"
import { WoundCareTracker, type Wound } from "@/components/medicn/wound-care-tracker"

const demoWound: Wound = {
  id: "w-sacrum-1",
  location: "Sacral Promontory / Coccyx",
  type: "pressure",
  acquiredDate: "Sep 28, 2024",
  assessments: [
    {
      id: "wa-1",
      date: "Sep 28, 2024",
      lengthCm: 4.8,
      widthCm: 3.5,
      depthCm: 0.8,
      areaCm2: 16.8,
      stage: "stage3",
      exudateAmount: "moderate",
      exudateType: "serosanguinous",
      dressingApplied: "Calcium alginate with secondary foam border",
      assessor: "Sarah Jenkins, BSN, RN, CWOCN",
    },
    {
      id: "wa-2",
      date: "Oct 08, 2024",
      lengthCm: 3.8,
      widthCm: 2.8,
      depthCm: 0.4,
      areaCm2: 10.6,
      stage: "stage3",
      exudateAmount: "small",
      exudateType: "serous",
      dressingApplied: "Hydrocellular foam with silicone adhesive",
      assessor: "Sarah Jenkins, BSN, RN, CWOCN",
    },
    {
      id: "wa-3",
      date: "Oct 22, 2024",
      lengthCm: 2.5,
      widthCm: 1.8,
      depthCm: 0.1,
      areaCm2: 4.5,
      stage: "stage2",
      exudateAmount: "scant",
      exudateType: "serous",
      dressingApplied: "Hydrocolloid thin border dressing",
      assessor: "David Ross, MD",
    },
  ],
}

export default function WoundCareTrackerDemo() {
  const handleAdd = (woundId: string) => {
    alert(`Record new wound assessment modal triggered for wound ${woundId}.`)
  }

  return (
    <div className="flex w-full justify-center p-4">
      <WoundCareTracker
        className="w-full max-w-3xl"
        wound={demoWound}
        onAddAssessment={handleAdd}
      />
    </div>
  )
}

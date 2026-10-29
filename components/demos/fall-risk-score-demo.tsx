"use client"

import { FallRiskScore } from "@/components/medicn/fall-risk-score"

const interventions = {
  low: ["Orient to room and call bell", "Bed in low position, brakes on", "Non-slip footwear"],
  moderate: [
    "Orient to room and call bell",
    "Bed in low position, brakes on",
    "Non-slip footwear",
    "Assist with toileting on a schedule",
    "Fall risk sign at bedside",
  ],
  high: [
    "Bed/chair exit alarm on",
    "Supervised mobility and toileting",
    "Room close to the nursing station",
    "Review sedating medications with pharmacist",
    "Fall risk wristband and sign at bedside",
  ],
}

export default function FallRiskScoreDemo() {
  return (
    <div className="w-full max-w-3xl">
      <FallRiskScore
        defaultValue={{
          historyOfFalling: "yes",
          secondaryDiagnosis: "yes",
          ambulatoryAid: "aid",
          ivTherapy: "no",
          gait: "weak",
          mentalStatus: "oriented",
        }}
        interventions={interventions}
      />
    </div>
  )
}

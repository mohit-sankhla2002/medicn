"use client"

import { EarlyWarningScore } from "@/components/medicn/early-warning-score"

// Every parameter normal except new confusion (3): aggregate 3, but a single red score → low–medium risk.
export default function EarlyWarningScoreRedDemo() {
  return (
    <div className="w-full max-w-2xl">
      <EarlyWarningScore
        values={{
          respiratoryRate: 16,
          spo2: 97,
          spo2Scale: 1,
          supplementalOxygen: false,
          systolic: 128,
          pulse: 76,
          consciousness: "C",
          temperature: 36.8,
        }}
      />
    </div>
  )
}

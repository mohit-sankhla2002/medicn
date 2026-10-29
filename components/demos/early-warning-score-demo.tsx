"use client"

import { EarlyWarningScore } from "@/components/medicn/early-warning-score"

// RR 22 (2) · SpO₂ 95% Scale 1 (1) · air (0) · SBP 105 (1) · pulse 98 (1) · Alert (0) · 38.4 °C (1) = 6, medium risk.
export default function EarlyWarningScoreDemo() {
  return (
    <div className="w-full max-w-2xl">
      <EarlyWarningScore
        editable
        values={{
          respiratoryRate: 22,
          spo2: 95,
          spo2Scale: 1,
          supplementalOxygen: false,
          systolic: 105,
          pulse: 98,
          consciousness: "A",
          temperature: 38.4,
        }}
      />
    </div>
  )
}

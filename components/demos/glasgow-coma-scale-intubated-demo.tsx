"use client"

import { GlasgowComaScale } from "@/components/medicn/glasgow-coma-scale"

// Intubated patient: verbal is not testable, so the total is not computed (E3 VT M5).
export default function GlasgowComaScaleIntubatedDemo() {
  return (
    <div className="w-full max-w-4xl">
      <GlasgowComaScale defaultValue={{ eye: 3, verbal: "NT", motor: 5 }} showCriteria={false} />
    </div>
  )
}

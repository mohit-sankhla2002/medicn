"use client"

import * as React from "react"

import { BodyMap, getBodyMapHeatColor } from "@/components/medicn/body-map"

const INTENSITY: Record<string, number> = {
  "back-of-shoulder-left": 4,
  "back-of-upper-arm-left": 2,
  nape: 5,
  "upper-back-left": 3,
  "mid-back": 4,
  "lower-back-left": 9,
  "lower-back-right": 6,
  "buttock-left": 5,
  "back-of-thigh-left": 3,
  "calf-left": 2,
}

const LEGEND = [0, 2, 4, 6, 8, 10]

export default function BodyMapIntensityDemo() {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <BodyMap defaultView="back" intensity={INTENSITY} readOnly />
      <div className="flex w-full max-w-[280px] flex-col gap-1.5">
        <div
          className="h-2 w-full rounded-full"
          style={{
            background: `linear-gradient(to right, ${LEGEND.map((n) =>
              n === 0 ? "var(--muted)" : getBodyMapHeatColor(n)
            ).join(", ")})`,
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>None</span>
          <span>Moderate</span>
          <span>Severe</span>
        </div>
      </div>
    </div>
  )
}

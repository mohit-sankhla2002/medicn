"use client"

import * as React from "react"

import { BodyMap, getBodyMapHeatColor } from "@/components/medicn/body-map"

const INTENSITY: Record<string, number> = {
  "front-shoulder-left": 4,
  "front-upper-arm-left": 2,
  "front-knee-right": 7,
  "front-shin-right": 3,
  "back-neck": 5,
  "back-upper-back-left": 3,
  "back-lower-back-left": 9,
  "back-lower-back-right": 6,
  "back-buttock-left": 5,
  "back-thigh-left": 3,
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

"use client"

import * as React from "react"

import { formatGcs, GlasgowComaScale, type GcsValue } from "@/components/medicn/glasgow-coma-scale"

export default function GlasgowComaScaleDemo() {
  const [value, setValue] = React.useState<GcsValue>({ eye: 3, verbal: 4, motor: 6, pupils: "both" })
  return (
    <div className="flex w-full max-w-4xl flex-col gap-3">
      <GlasgowComaScale value={value} onValueChange={setValue} showPupils />
      <p className="text-sm text-muted-foreground">
        Charted as <span className="font-mono text-foreground">{formatGcs(value)}</span>
      </p>
    </div>
  )
}

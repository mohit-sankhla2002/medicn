"use client"

import * as React from "react"

import { PainScale } from "@/components/medicn/pain-scale"

export default function PainScaleDemo() {
  const [value, setValue] = React.useState<number | null>(6)
  return (
    <div className="w-full max-w-lg">
      <PainScale value={value} onValueChange={setValue} />
    </div>
  )
}

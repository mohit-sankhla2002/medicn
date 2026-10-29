"use client"

import * as React from "react"

import { FacesPainScale } from "@/components/medicn/faces-pain-scale"

export default function FacesPainScaleDemo() {
  const [value, setValue] = React.useState<number | null>(null)
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <p className="text-sm font-medium">Point to the face that shows how much you hurt right now.</p>
      <FacesPainScale value={value} onValueChange={setValue} />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {value == null ? "No score recorded yet." : `Recorded score: ${value}/10`}
      </p>
    </div>
  )
}

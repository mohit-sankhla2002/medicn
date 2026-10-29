"use client"

import { PainScale } from "@/components/medicn/pain-scale"

export default function PainScaleSizesDemo() {
  return (
    <div className="w-full max-w-sm">
      <PainScale size="sm" defaultValue={3} showAnchors={false} showDescriptor={false} label="Pain at rest" />
    </div>
  )
}

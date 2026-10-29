"use client"

import * as React from "react"

import { detectBodyRegion, LesionList, LesionMap, type Lesion } from "@/components/medicn/lesion-map"

const at = (view: Lesion["view"], x: number, y: number) => ({ view, x, y, region: detectBodyRegion(view, x, y) })

const LESIONS: Lesion[] = [
  { id: "m1", ...at("back", 0.4185, 0.2984), label: "Irregular naevus", type: "naevus", sizeMm: 7, status: "changed", date: "2026-10-12" },
  { id: "m2", ...at("back", 0.62, 0.42), type: "naevus", sizeMm: 3, status: "stable", date: "2026-04-03" },
  { id: "m3", ...at("front", 0.4185, 0.2681), type: "macule", sizeMm: 4, status: "stable", date: "2026-04-03" },
  { id: "m4", ...at("front", 0.5, 0.1), type: "papule", sizeMm: 2, status: "new", date: "2026-10-12" },
  { id: "m5", ...at("back", 0.38, 0.62), type: "scar", status: "resolved", date: "2025-11-20" },
]

export default function LesionMapReadonlyDemo() {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  return (
    <div className="grid w-full items-start gap-6 md:grid-cols-[1fr_280px]">
      <LesionList value={LESIONS} selectedId={selectedId} onSelectedIdChange={setSelectedId} />
      <LesionMap readOnly value={LESIONS} selectedId={selectedId} onSelectedIdChange={setSelectedId} className="justify-center" />
    </div>
  )
}

"use client"

import * as React from "react"

import { detectBodyRegion, LesionMap, type Lesion } from "@/components/medicn/lesion-map"

const at = (view: Lesion["view"], x: number, y: number) => ({ view, x, y, region: detectBodyRegion(view, x, y) })

const INITIAL: Lesion[] = [
  {
    id: "lesion-1",
    ...at("back", 0.4185, 0.2984),
    label: "Irregular pigmented naevus",
    type: "naevus",
    sizeMm: 7,
    colour: "Dark brown, variegated",
    notes: "Asymmetric border on dermoscopy. Refer for excision.",
    status: "changed",
    date: "2026-10-12",
  },
  { id: "lesion-2", ...at("front", 0.4185, 0.2681), type: "naevus", sizeMm: 4, colour: "Light brown", status: "stable", date: "2026-04-03" },
  { id: "lesion-3", ...at("back", 0.8424, 0.4698), type: "papule", sizeMm: 3, status: "new", date: "2026-10-12" },
  { id: "lesion-4", ...at("front", 0.6359, 0.631), label: "Healed laceration", type: "wound", status: "resolved", date: "2026-02-18" },
  {
    id: "lesion-5",
    ...at("front", 0.3641, 0.8226),
    label: "Venous leg ulcer",
    type: "ulcer",
    sizeMm: 22,
    notes: "Exudate increased since last dressing change.",
    status: "changed",
    date: "2026-10-12",
  },
]

export default function LesionMapDemo() {
  const [lesions, setLesions] = React.useState<Lesion[]>(INITIAL)
  const [selectedId, setSelectedId] = React.useState<string | null>("lesion-1")

  return (
    <LesionMap
      layout="side-by-side"
      value={lesions}
      onValueChange={setLesions}
      selectedId={selectedId}
      onSelectedIdChange={setSelectedId}
      newLesionDefaults={{ date: "2026-10-12" }}
      className="justify-center"
    />
  )
}

"use client"

import * as React from "react"

import { FluidBalance, type FluidEntry } from "@/components/medicn/fluid-balance"

/** Clock time for hour `offset` of a period starting Oct 28 07:00. */
function at(offset: number, minute = 0) {
  const hour = 7 + offset
  const day = hour < 24 ? 28 : 29
  const hh = String(hour % 24).padStart(2, "0")
  return `2026-10-${day}T${hh}:${String(minute).padStart(2, "0")}`
}

// Catheter urine, mL per hour. Hours 6–9 (13:00–17:00) fall below 35 mL/h (0.5 mL/kg/h at 70 kg).
const urine = [80, 75, 70, 65, 60, 50, 25, 20, 30, 28, 45, 60, 70, 85, 90, 80, 75, 70, 65, 60, 55, 60, 65, 70]

function buildEntries(): FluidEntry[] {
  const entries: FluidEntry[] = []
  let n = 0
  const add = (offset: number, minute: number, kind: FluidEntry["kind"], category: string, volumeMl: number, note?: string) =>
    entries.push({ id: `e${++n}`, time: at(offset, minute), kind, category, volumeMl, note })

  for (let h = 0; h < 24; h++) {
    add(h, 55, "intake", "iv", 100, h === 0 ? "0.9% sodium chloride at 100 mL/h" : undefined)
    add(h, 58, "output", "urine", urine[h], h === 6 ? "Catheter flushed, patent" : undefined)
  }
  add(1, 15, "intake", "oral", 200)
  add(3, 30, "intake", "oral", 150)
  add(5, 20, "intake", "oral", 250)
  add(8, 0, "intake", "oral", 120)
  add(11, 10, "intake", "oral", 300)
  add(14, 0, "intake", "oral", 150)
  add(2, 0, "intake", "iv", 100, "Ceftriaxone 1 g in 100 mL")
  add(7, 30, "intake", "blood", 310, "Packed red cells, 1 unit")
  add(1, 0, "output", "drain", 40, "JP drain, serosanguinous")
  add(9, 0, "output", "drain", 30)
  add(17, 0, "output", "drain", 25)
  add(4, 40, "output", "emesis", 150, "Bilious")
  add(12, 30, "output", "stool", 200)
  return entries
}

export default function FluidBalanceDemo() {
  const [entries, setEntries] = React.useState<FluidEntry[]>(buildEntries)
  const nextId = React.useRef(1)

  return (
    <FluidBalance
      className="w-full"
      entries={entries}
      periodStart="2026-10-28T07:00"
      now="2026-10-29T07:00"
      weightKg={70}
      onAddEntry={(entry) => setEntries((prev) => [...prev, { ...entry, id: `new-${nextId.current++}` }])}
    />
  )
}

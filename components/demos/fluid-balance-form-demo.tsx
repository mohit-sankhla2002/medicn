"use client"

import * as React from "react"

import { FluidEntryForm, formatMl, DEFAULT_FLUID_CATEGORIES, type NewFluidEntry } from "@/components/medicn/fluid-balance"

const labelFor = (id: string) => DEFAULT_FLUID_CATEGORIES.find((c) => c.id === id)?.label ?? id

export default function FluidBalanceFormDemo() {
  const [entries, setEntries] = React.useState<NewFluidEntry[]>([])

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <FluidEntryForm
        defaultValue={{ time: "2026-10-29T10:00", kind: "output", category: "urine" }}
        minTime="2026-10-29T07:00"
        maxTime="2026-10-30T06:59"
        onSubmit={(entry) => setEntries((prev) => [entry, ...prev])}
      />
      {entries.length > 0 && (
        <ul className="divide-y rounded-lg border text-sm">
          {entries.map((entry, i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
              <span>
                <span className="font-medium">{labelFor(entry.category)}</span>
                <span className="text-muted-foreground"> · {entry.kind} · {entry.time.replace("T", " ")}</span>
              </span>
              <span className="tabular-nums">{formatMl(entry.volumeMl)} mL</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

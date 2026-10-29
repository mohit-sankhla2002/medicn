"use client"

import * as React from "react"

import { BodyMap, BodyMapSelectionList, getParentRegion } from "@/components/medicn/body-map"

export default function BodyMapHeadDemo() {
  const [value, setValue] = React.useState<string[]>(["ear-left", "nostril-right"])

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <BodyMap defaultView="head" value={value} onValueChange={setValue} />
      <BodyMapSelectionList
        value={value}
        onRemove={(id) => setValue((prev) => prev.filter((v) => v !== id))}
        className="justify-center"
      />
      <p className="text-center text-xs text-muted-foreground">
        Rolls up to:{" "}
        <span className="font-mono">{value.map((id) => getParentRegion(id) ?? id).join(", ") || "—"}</span>
      </p>
    </div>
  )
}

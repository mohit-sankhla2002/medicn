"use client"

import * as React from "react"

import { BodyMap, type BodyView } from "@/components/medicn/body-map"
import { Button } from "@/components/ui/button"

export default function BodyMapControlledDemo() {
  const [view, setView] = React.useState<BodyView>("front")
  const [value, setValue] = React.useState<string[]>(["front-knee-right"])

  return (
    <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center sm:gap-8">
      <BodyMap
        view={view}
        onViewChange={setView}
        value={value}
        onValueChange={setValue}
        multiple={false}
        disabledRegions={["front-face"]}
      />
      <div className="flex w-full max-w-[240px] flex-col gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">View</span>
          <span className="font-mono">{view}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">Selected ids</span>
          <code className="rounded-md bg-muted px-2 py-1.5 font-mono text-xs break-all">
            {JSON.stringify(value)}
          </code>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView(view === "front" ? "back" : "front")}
          >
            Flip view
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setValue([])}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  )
}

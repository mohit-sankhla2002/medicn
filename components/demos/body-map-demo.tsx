"use client"

import * as React from "react"
import { ZoomInIcon } from "lucide-react"

import { BodyMap, BodyMapSelectionList, type BodySex } from "@/components/medicn/body-map"

export default function BodyMapDemo() {
  const [value, setValue] = React.useState<string[]>(["eyelid-left", "lower-back-right"])
  const [sex, setSex] = React.useState<BodySex>("male")

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ZoomInIcon className="size-3.5" />
        Click the head, a hand or a foot to zoom in
      </p>
      <BodyMap value={value} onValueChange={setValue} sex={sex} onSexChange={setSex} showSexToggle />
      <BodyMapSelectionList
        value={value}
        sex={sex}
        onRemove={(id) => setValue((prev) => prev.filter((v) => v !== id))}
        className="justify-center"
      />
    </div>
  )
}

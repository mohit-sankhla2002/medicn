"use client"

import * as React from "react"

import { BodyMap, BodyMapSelectionList } from "@/components/medicn/body-map"

export default function BodyMapSimpleDemo() {
  const [value, setValue] = React.useState<string[]>(["back-lower-back-left"])

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <BodyMap detail="simple" value={value} onValueChange={setValue} />
      <BodyMapSelectionList
        value={value}
        onRemove={(id) => setValue((prev) => prev.filter((v) => v !== id))}
        className="justify-center"
      />
    </div>
  )
}

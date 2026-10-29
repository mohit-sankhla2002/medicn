"use client"

import * as React from "react"

import { VitalsForm, type VitalsFormValues } from "@/components/medicn/vitals-form"

export default function VitalsFormDemo() {
  const [saved, setSaved] = React.useState<VitalsFormValues | null>(null)
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <VitalsForm onSubmit={setSaved} />
      {saved && (
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(saved, null, 2)}</pre>
      )}
    </div>
  )
}

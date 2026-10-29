"use client"

import * as React from "react"

import { DentalChart, DentalChartSummary, type DentalChartValue } from "@/components/medicn/dental-chart"

const INITIAL: DentalChartValue = {
  "54": { conditions: [], surfaces: { O: { type: "caries" }, D: { type: "caries" } } },
  "55": { conditions: [], surfaces: { O: { type: "sealant", status: "planned" } } },
  "64": { conditions: [{ type: "crown" }] },
  "74": { conditions: [], surfaces: { O: { type: "restoration", material: "composite" } } },
  "85": { conditions: [{ type: "extraction", status: "planned" }], note: "Abscess, refer to paediatric dentist" },
}

export default function DentalChartPrimaryDemo() {
  const [value, setValue] = React.useState<DentalChartValue>(INITIAL)

  return (
    <div className="flex w-full flex-col gap-4">
      <DentalChart
        dentition="primary"
        numbering="universal"
        value={value}
        onValueChange={setValue}
        tools={["select", "caries", "composite", "sealant", "crown", "extraction", "missing", "erase"]}
        defaultTool="caries"
      />
      <DentalChartSummary value={value} numbering="universal" className="mx-auto w-full max-w-md" />
    </div>
  )
}

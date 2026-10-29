"use client"

import * as React from "react"

import {
  DentalChart,
  DentalChartLegend,
  DentalChartSummary,
  type DentalChartValue,
} from "@/components/medicn/dental-chart"

const INITIAL: DentalChartValue = {
  "17": { conditions: [], surfaces: { O: { type: "restoration", material: "amalgam" }, D: { type: "restoration", material: "amalgam" } } },
  "16": { conditions: [{ type: "crown" }, { type: "root-canal" }] },
  "14": { conditions: [], surfaces: { M: { type: "caries" }, O: { type: "caries" } } },
  "21": { conditions: [], surfaces: { M: { type: "restoration", material: "composite", status: "planned" } } },
  "24": { conditions: [{ type: "watch" }], note: "Sensitive to cold" },
  "26": { conditions: [], surfaces: { O: { type: "sealant" } } },
  "28": { conditions: [{ type: "extraction", status: "planned" }] },
  "36": { conditions: [{ type: "missing" }] },
  "35": { conditions: [{ type: "crown", status: "planned" }] },
  "31": { conditions: [{ type: "fracture" }] },
  "46": { conditions: [{ type: "implant" }, { type: "crown" }] },
  "47": { conditions: [], surfaces: { B: { type: "caries" }, O: { type: "restoration", material: "composite" } } },
}

export default function DentalChartArchDemo() {
  const [value, setValue] = React.useState<DentalChartValue>(INITIAL)

  return (
    <div className="flex w-full flex-col gap-4">
      <DentalChart
        value={value}
        onValueChange={setValue}
        defaultLayout="arch"
        showLayoutToggle
        defaultTool="caries"
      />
      <DentalChartLegend className="justify-center" />
      <DentalChartSummary value={value} className="mx-auto w-full max-w-md" />
    </div>
  )
}

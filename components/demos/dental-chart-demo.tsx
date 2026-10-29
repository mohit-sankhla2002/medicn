"use client"

import * as React from "react"

import {
  DentalChart,
  DentalChartLegend,
  DentalChartSummary,
  type DentalChartValue,
} from "@/components/medicn/dental-chart"

const INITIAL: DentalChartValue = {
  "18": { conditions: [{ type: "extraction", status: "planned" }], note: "Partially erupted, pericoronitis" },
  "16": { conditions: [], surfaces: { M: { type: "restoration", material: "amalgam" }, O: { type: "restoration", material: "amalgam" } } },
  "14": { conditions: [{ type: "crown" }, { type: "root-canal" }] },
  "11": { conditions: [{ type: "fracture" }], surfaces: { O: { type: "restoration", material: "composite", status: "planned" } } },
  "24": { conditions: [{ type: "implant" }, { type: "crown" }] },
  "26": { conditions: [], surfaces: { D: { type: "caries" }, O: { type: "caries" } } },
  "36": { conditions: [{ type: "crown", status: "planned" }], surfaces: { O: { type: "caries" } } },
  "37": { conditions: [], surfaces: { O: { type: "sealant" } } },
  "46": { conditions: [{ type: "missing" }] },
  "45": { conditions: [{ type: "watch" }] },
  "47": { conditions: [], surfaces: { M: { type: "restoration", material: "composite" }, O: { type: "restoration", material: "composite" }, D: { type: "restoration", material: "composite" } } },
}

export default function DentalChartDemo() {
  const [value, setValue] = React.useState<DentalChartValue>(INITIAL)

  return (
    <div className="flex w-full flex-col gap-4">
      <DentalChart value={value} onValueChange={setValue} defaultTool="caries" />
      <DentalChartLegend className="justify-center" />
      <DentalChartSummary value={value} className="mx-auto w-full max-w-md" />
    </div>
  )
}

import { DentalChart, DentalChartSummary, type DentalChartValue } from "@/components/medicn/dental-chart"

const FINDINGS: DentalChartValue = {
  "17": { conditions: [{ type: "root-canal" }, { type: "crown" }] },
  "21": { conditions: [{ type: "crown", status: "planned" }], surfaces: { M: { type: "caries" }, B: { type: "caries" } } },
  "35": { conditions: [{ type: "pontic" }] },
  "36": { conditions: [{ type: "crown" }] },
  "34": { conditions: [{ type: "crown" }] },
  "38": { conditions: [{ type: "missing" }] },
  "44": { conditions: [], surfaces: { O: { type: "restoration", material: "amalgam" }, D: { type: "restoration", material: "amalgam" } } },
  "46": { conditions: [{ type: "implant", status: "planned" }, { type: "missing" }] },
}

export default function DentalChartReadonlyDemo() {
  return (
    <div className="flex w-full flex-col gap-6">
      <DentalChart value={FINDINGS} readOnly />
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium">Existing</h4>
          <DentalChartSummary value={FINDINGS} status="existing" />
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium">Treatment plan</h4>
          <DentalChartSummary value={FINDINGS} status="planned" emptyText="Nothing planned" />
        </div>
      </div>
    </div>
  )
}

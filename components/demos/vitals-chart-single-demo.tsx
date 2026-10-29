import { VitalsChart } from "@/components/medicn/vitals-chart"

const points = [
  { time: "2026-03-14T06:00:00", value: 96 },
  { time: "2026-03-14T07:00:00", value: 95 },
  { time: "2026-03-14T08:00:00", value: 93 },
  { time: "2026-03-14T09:00:00", value: 91 },
  { time: "2026-03-14T10:00:00", value: 89 },
  { time: "2026-03-14T11:00:00", value: 92 },
  { time: "2026-03-14T12:00:00", value: 94 },
  { time: "2026-03-14T13:00:00", value: 96 },
]

export default function VitalsChartSingleDemo() {
  return (
    <div className="w-full max-w-2xl rounded-xl border bg-card p-4">
      <VitalsChart series={[{ type: "oxygenSaturation", points }]} height={200} />
    </div>
  )
}

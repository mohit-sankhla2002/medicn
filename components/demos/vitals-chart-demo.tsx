import { VitalsChart, type VitalsChartSeries } from "@/components/medicn/vitals-chart"

const times = [
  "2026-03-13T08:00:00",
  "2026-03-13T12:00:00",
  "2026-03-13T16:00:00",
  "2026-03-13T20:00:00",
  "2026-03-14T00:00:00",
  "2026-03-14T04:00:00",
  "2026-03-14T08:00:00",
]

const at = (values: number[]) => values.map((value, i) => ({ time: times[i], value }))

const series: VitalsChartSeries[] = [
  { type: "temperature", points: at([36.8, 37.1, 37.6, 38.6, 39.2, 38.1, 37.3]) },
  { type: "heartRate", points: at([78, 82, 94, 112, 118, 101, 88]) },
  {
    type: "bloodPressure",
    points: [
      [124, 78],
      [122, 76],
      [118, 74],
      [106, 66],
      [98, 58],
      [110, 68],
      [118, 72],
    ].map(([value, value2], i) => ({ time: times[i], value, value2 })),
  },
  { type: "respiratoryRate", points: at([16, 16, 18, 22, 24, 20, 18]) },
  { type: "oxygenSaturation", points: at([97, 97, 96, 94, 93, 95, 96]) },
]

export default function VitalsChartDemo() {
  return (
    <div className="w-full max-w-3xl rounded-xl border bg-card p-4">
      <VitalsChart series={series} />
    </div>
  )
}

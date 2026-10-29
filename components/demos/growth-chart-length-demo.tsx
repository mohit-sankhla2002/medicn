import { GrowthChart, type GrowthMeasurement } from "@/components/medicn/growth-chart"

const measurements: GrowthMeasurement[] = [
  { ageMonths: 0, value: 50.5, label: "Birth" },
  { ageMonths: 2, value: 59.2 },
  { ageMonths: 4, value: 64.5 },
  { ageMonths: 6, value: 68.4 },
  { ageMonths: 9, value: 72.6 },
  { ageMonths: 12, value: 76.3 },
  { ageMonths: 18, value: 82.8 },
  { ageMonths: 24, value: 88.4 },
]

export default function GrowthChartLengthDemo() {
  return (
    <div className="w-full max-w-3xl rounded-xl border bg-card p-4">
      <GrowthChart sex="male" measure="length" measurements={measurements} height={280} />
    </div>
  )
}

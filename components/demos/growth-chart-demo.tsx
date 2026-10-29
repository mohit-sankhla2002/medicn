import { GrowthChart, type GrowthMeasurement } from "@/components/medicn/growth-chart"

// Girl whose weight gain slows after 9 months, drifting below the 3rd percentile by 18 months.
const measurements: GrowthMeasurement[] = [
  { ageMonths: 0, value: 3.3, label: "Birth" },
  { ageMonths: 1, value: 4.2 },
  { ageMonths: 2, value: 5.1 },
  { ageMonths: 4, value: 6.3 },
  { ageMonths: 6, value: 7.1 },
  { ageMonths: 9, value: 7.6 },
  { ageMonths: 12, value: 7.9 },
  { ageMonths: 15, value: 8.0 },
  { ageMonths: 18, value: 8.0 },
]

export default function GrowthChartDemo() {
  return (
    <div className="w-full max-w-3xl rounded-xl border bg-card p-4">
      <GrowthChart sex="female" measure="weight" measurements={measurements} />
    </div>
  )
}

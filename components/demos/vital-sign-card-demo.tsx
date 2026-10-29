import { VitalSignCard } from "@/components/medicn/vital-signs"

export default function VitalSignCardDemo() {
  return (
    <div className="grid w-full max-w-xl gap-3 sm:grid-cols-2">
      <VitalSignCard reading={{ type: "spo2", value: 86, history: [95, 93, 91, 89, 86], recordedAt: "2 min ago" }} />
      <VitalSignCard reading={{ type: "glucose", value: 92, history: [104, 99, 95, 92], recordedAt: "Fasting" }} />
    </div>
  )
}

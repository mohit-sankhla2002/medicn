import { VitalSignsPanel } from "@/components/medicn/vital-signs"

export default function VitalSignsDemo() {
  return (
    <VitalSignsPanel
      className="w-full"
      readings={[
        { type: "bloodPressure", systolic: 142, diastolic: 91, history: [126, 131, 129, 138, 142], recordedAt: "09:42" },
        { type: "heartRate", value: 78, history: [82, 80, 76, 79, 78], recordedAt: "09:42" },
        { type: "spo2", value: 97, history: [96, 97, 97, 98, 97], recordedAt: "09:42" },
        { type: "temperature", value: 37.8, history: [36.9, 37.1, 37.4, 37.6, 37.8], recordedAt: "09:40" },
        { type: "respiratoryRate", value: 18, history: [16, 17, 18, 18, 18], recordedAt: "09:40" },
        { type: "bmi", value: 27.4, recordedAt: "Mar 2" },
      ]}
    />
  )
}

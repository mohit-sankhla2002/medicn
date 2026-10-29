"use client"

import * as React from "react"

import { MedicationForm, toMedication, type MedicationOption, type MedicationPreset } from "@/components/medicn/medication-form"
import { MedicationList, type Medication } from "@/components/medicn/medication-list"

const medicationOptions: MedicationOption[] = [
  { name: "Metformin", strength: "500 mg", form: "tablet", code: "861007" },
  { name: "Lisinopril", strength: "10 mg", form: "tablet", code: "314076" },
  { name: "Atorvastatin", strength: "20 mg", form: "tablet", code: "617310" },
  { name: "Amoxicillin", strength: "500 mg", form: "capsule", code: "308191" },
  { name: "Sertraline", strength: "50 mg", form: "tablet", code: "312940" },
  { name: "Albuterol HFA", strength: "90 mcg/actuation", form: "inhaler", code: "745679" },
  { name: "Insulin glargine", strength: "100 units/mL", form: "injection", code: "261551", highAlert: true },
  { name: "Warfarin", strength: "5 mg", form: "tablet", code: "855332", highAlert: true },
]

const presets: MedicationPreset[] = [
  { label: "1 tab PO BID", order: { dose: { value: 1, unit: "tablet" }, route: "oral", frequency: "BID" } },
  { label: "1 tab PO daily", order: { dose: { value: 1, unit: "tablet" }, route: "oral", frequency: "QD" } },
  { label: "1 tab PO at bedtime", order: { dose: { value: 1, unit: "tablet" }, route: "oral", frequency: "BED" } },
  {
    label: "2 puffs q4h PRN",
    order: { dose: { value: 2, unit: "puff" }, route: "inhaled", frequency: "Q4H", asNeeded: true },
  },
]

export default function MedicationFormDemo() {
  const [medications, setMedications] = React.useState<Medication[]>([
    {
      id: "existing-1",
      name: "Lisinopril",
      strength: "10 mg",
      route: "Oral",
      frequency: "Once daily",
      indication: "hypertension",
      startDate: "Mar 2025",
    },
  ])
  const nextId = React.useRef(1)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <MedicationForm
        medicationOptions={medicationOptions}
        presets={presets}
        resetOnSubmit
        onSubmit={(order) => {
          const id = `new-${nextId.current++}`
          setMedications((prev) => [...prev, toMedication(order, id)])
        }}
      />
      <MedicationList medications={medications} />
    </div>
  )
}

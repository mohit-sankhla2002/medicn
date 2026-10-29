"use client"

import { MedicationForm } from "@/components/medicn/medication-form"

export default function MedicationFormPrnDemo() {
  return (
    <MedicationForm
      className="w-full max-w-2xl"
      submitLabel="Update order"
      defaultValue={{
        medication: "Albuterol HFA",
        code: "745679",
        strength: "90 mcg/actuation",
        form: "inhaler",
        dose: { value: 2, unit: "puff" },
        route: "inhaled",
        frequency: "Q4H",
        asNeeded: true,
        asNeededFor: "wheezing",
        quantity: 1,
        refills: 2,
        indication: "asthma",
        instructions: "Shake well before each use",
      }}
      onSubmit={(order) => console.log(order)}
      onCancel={() => console.log("cancelled")}
    />
  )
}

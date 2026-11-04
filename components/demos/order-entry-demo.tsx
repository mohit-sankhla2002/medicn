"use client"

import * as React from "react"
import { OrderEntry, type OrderCatalogItem, type OrderItem } from "@/components/medicn/order-entry"

const demoCatalog: OrderCatalogItem[] = [
  { name: "Comprehensive Metabolic Panel (CMP)", code: "LOINC 24323-8", category: "lab", description: "14 core biochemical markers" },
  { name: "Complete Blood Count with Diff (CBC)", code: "LOINC 58410-2", category: "lab", description: "WBC, RBC, Platelets, Differential" },
  { name: "Lipid Panel with Reflex", code: "LOINC 57698-3", category: "lab", description: "Cholesterol, Triglycerides, HDL, calculated LDL" },
  { name: "Hemoglobin A1c (HbA1c)", code: "LOINC 4548-4", category: "lab", description: "Estimated average glucose (eAG)" },
  { name: "Chest X-Ray (2 Views, PA & Lat)", code: "CPT 71046", category: "imaging", description: "Routine pulmonary and cardiac evaluation" },
  { name: "CT Abdomen & Pelvis with Contrast", code: "CPT 74177", category: "imaging", description: "Evaluation of acute abdominal pain" },
  { name: "Echocardiogram Complete (TTE)", code: "CPT 93306", category: "imaging", description: "Transthoracic cardiac structure and Doppler" },
  { name: "Cardiology Consultation", category: "referral", description: "Outpatient evaluation for atypical chest discomfort" },
  { name: "Endocrinology Consultation", category: "referral", description: "Subspecialty evaluation for uncontrolled DM2" },
  { name: "Wound Care Dressing Change", category: "nursing", description: "Daily clean dressing with hydrogel" },
  { name: "Strict Intake & Output Monitoring", category: "nursing", description: "Every shift fluid balance protocol" },
]

export default function OrderEntryDemo() {
  const handleSubmit = (orders: OrderItem[]) => {
    alert(`Submitted ${orders.length} orders: ${orders.map((o) => o.name).join(", ")}`)
  }

  return (
    <div className="flex w-full justify-center p-4">
      <OrderEntry
        className="w-full max-w-3xl"
        catalog={demoCatalog}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

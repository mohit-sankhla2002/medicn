"use client"

import * as React from "react"
import { ImmunizationRecord, type Immunization, type ImmunizationDue } from "@/components/medicn/immunization-record"

const demoImmunizations: Immunization[] = [
  {
    id: "imm-1",
    vaccineName: "COVID-19 mRNA (Comirnaty)",
    vaccineCode: "208",
    status: "completed",
    doseNumber: 1,
    seriesDoses: 2,
    date: "Jan 12, 2024",
    site: "Left deltoid",
    lotNumber: "FL8912",
    performer: "Emily Clark, RN",
    note: "Tolerated well without acute adverse reaction.",
  },
  {
    id: "imm-2",
    vaccineName: "COVID-19 mRNA (Comirnaty)",
    vaccineCode: "208",
    status: "completed",
    doseNumber: 2,
    seriesDoses: 2,
    date: "Feb 09, 2024",
    site: "Left deltoid",
    lotNumber: "FM3401",
    performer: "Emily Clark, RN",
  },
  {
    id: "imm-3",
    vaccineName: "Influenza, quadrivalent (Fluarix)",
    vaccineCode: "150",
    status: "completed",
    doseNumber: 1,
    seriesDoses: 1,
    date: "Sep 28, 2024",
    site: "Right deltoid",
    lotNumber: "IN2024-X",
    performer: "Dr. Marcus Vance",
  },
  {
    id: "imm-4",
    vaccineName: "Hepatitis B (Recombivax HB)",
    vaccineCode: "43",
    status: "completed",
    doseNumber: 3,
    seriesDoses: 3,
    date: "Jun 14, 2022",
    site: "Right deltoid",
    lotNumber: "HB9981",
    performer: "Clinical Staff",
  },
]

const demoDue: ImmunizationDue[] = [
  {
    vaccineName: "Tdap (Adacel)",
    vaccineCode: "115",
    dueDate: "2024-10-15",
    overdue: true,
    seriesInfo: "10-year routine adult booster",
  },
  {
    vaccineName: "Shingrix (Herpes Zoster)",
    vaccineCode: "187",
    dueDate: "2025-02-15",
    overdue: false,
    seriesInfo: "Dose 1 of 2 series (Age ≥ 50)",
  },
]

export default function ImmunizationRecordDemo() {
  const [immunizations, setImmunizations] = React.useState<Immunization[]>(demoImmunizations)

  const handleRecord = () => {
    alert("Record immunization modal or workflow triggered.")
  }

  return (
    <div className="flex w-full justify-center p-4">
      <ImmunizationRecord
        className="w-full max-w-2xl"
        immunizations={immunizations}
        dueVaccines={demoDue}
        onRecord={handleRecord}
      />
    </div>
  )
}

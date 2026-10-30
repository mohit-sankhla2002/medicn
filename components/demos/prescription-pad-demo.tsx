"use client"

import * as React from "react"
import { PrescriptionPad, type Prescription, type Pharmacy } from "@/components/medicn/prescription-pad"

const demoPharmacies: Pharmacy[] = [
  { id: "cvs-1", name: "CVS Pharmacy #4821", address: "742 Evergreen Terrace, Springfield" },
  { id: "wal-1", name: "Walgreens Community #1204", address: "550 Elm Street, Springfield" },
  { id: "mail-1", name: "Caremark Mail Order Pharmacy", address: "National Delivery" },
]

export default function PrescriptionPadDemo() {
  const handlePrescribe = (rx: Prescription) => {
    alert(
      `Prescription generated for ${rx.medication}:\n${rx.dose} ${rx.route} ${rx.frequency} (Qty: ${rx.quantity}, Refills: ${rx.refills})`
    )
  }

  return (
    <div className="flex w-full justify-center p-4">
      <PrescriptionPad
        className="w-full max-w-2xl"
        patient={{
          name: "Marcus A. Vance",
          dateOfBirth: "Mar 14, 1986",
          mrn: "MRN-847291",
          allergies: ["Penicillin (Anaphylaxis)"],
        }}
        prescriber={{
          name: "Dr. Gregory House, MD",
          title: "Attending Physician, Internal Medicine",
          clinic: "Princeton-Plainsboro Teaching Hospital",
          npi: "1942084712",
          dea: "BH4829104",
        }}
        pharmacies={demoPharmacies}
        defaultPrescription={{
          medication: "Metformin HCl 500 mg Tablet",
          dose: "1 tablet",
          route: "oral",
          frequency: "twice daily",
          duration: "90 days",
          quantity: "180",
          refills: 3,
          instructions: "Take with morning and evening meals.",
        }}
        onPrescribe={handlePrescribe}
      />
    </div>
  )
}

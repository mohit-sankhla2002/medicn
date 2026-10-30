"use client"

import * as React from "react"
import { DischargeSummary, type DischargeSummaryData } from "@/components/medicn/discharge-summary"

const demoSummary: DischargeSummaryData = {
  patientName: "Robert Davis (DOB: 1968-05-22)",
  mrn: "MRN-902814",
  admissionDate: "Oct 18, 2024",
  dischargeDate: "Oct 22, 2024",
  attendingPhysician: "Dr. Gregory House, MD",
  primaryDiagnosis: "Acute Uncomplicated Diverticulitis (ICD-10 K57.32)",
  secondaryDiagnoses: [
    "Essential Hypertension (ICD-10 I10)",
    "Type 2 Diabetes Mellitus without complications (ICD-10 E11.9)",
  ],
  hospitalCourse:
    "56-year-old male admitted with 3 days of progressive left lower quadrant abdominal pain, fever (101.4°F), and leukocytosis (WBC 14.8). CT abdomen/pelvis demonstrated localized sigmoid colonic wall thickening and pericolonic fat stranding consistent with uncomplicated diverticulitis. Patient was initiated on bowel rest and IV piperacillin-tazobactam. Within 48 hours, patient defervesced with complete normalization of WBC and resolution of abdominal tenderness. Diet was successfully advanced to low-residue oral intake. Tolerating regular medications without recurrence of symptoms.",
  dischargeCondition: "improved",
  dischargeDisposition: "home",
  medications: [
    {
      name: "Amoxicillin-Potassium Clavulanate 875-125 mg Tablet",
      sig: "Take 1 tablet PO twice daily with meals to complete a 7-day course",
      status: "new",
    },
    {
      name: "Lisinopril 10 mg Tablet",
      sig: "Take 1 tablet PO daily in the morning for blood pressure",
      status: "continued",
    },
    {
      name: "Metformin HCl 500 mg Tablet",
      sig: "Take 1 tablet PO twice daily with meals for diabetes",
      status: "continued",
    },
    {
      name: "Ibuprofen 600 mg Tablet",
      sig: "Discontinue — avoid NSAIDs to reduce colonic mucosal irritation",
      status: "discontinued",
    },
  ],
  followUpAppointments: [
    {
      provider: "Dr. Sarah Jenkins, MD",
      specialty: "Primary Care Outpatient Clinic",
      timeFrame: "1 to 2 weeks post-discharge",
    },
    {
      provider: "Dr. Marcus Vance, MD",
      specialty: "Digestive Disease & Endoscopy Center",
      timeFrame: "Elective screening colonoscopy in 6 to 8 weeks",
    },
  ],
  followUpInstructions:
    "Maintain a low-residue, low-fiber diet for the next 10–14 days. Drink at least 64 oz of water daily. Return to the Emergency Department immediately if you develop: fever > 101.5°F, severe or worsening abdominal pain, persistent vomiting, or inability to tolerate oral liquids.",
  signedAt: "Oct 22, 2024 at 11:30 AM",
}

export default function DischargeSummaryDemo() {
  const handleSign = (summary: DischargeSummaryData) => {
    alert(`Discharge summary for ${summary.patientName} signed and finalized.`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex w-full justify-center p-4">
      <DischargeSummary
        className="w-full max-w-3xl"
        summary={demoSummary}
        onSign={handleSign}
        onPrint={handlePrint}
      />
    </div>
  )
}

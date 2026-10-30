"use client"

import * as React from "react"
import { ClinicalNote, type NoteSection, type ClinicalNoteData } from "@/components/medicn/clinical-note"

const sampleSoapSections: NoteSection[] = [
  {
    key: "subjective",
    label: "Subjective",
    content:
      "48yo male presents for routine follow-up of Type 2 Diabetes and Essential Hypertension. Reports compliance with metformin and lisinopril. No dizziness, polyuria, polydipsia, or blurred vision. Self-monitored fasting blood glucose ranges 115–130 mg/dL.",
  },
  {
    key: "objective",
    label: "Objective",
    content:
      "Vitals: BP 128/82 mmHg, HR 72 bpm, SpO2 98% room air, BMI 27.4 kg/m².\nExam: Alert and oriented x3. Cardiac: Regular rate and rhythm, no murmurs. Pulmonary: Clear to auscultation bilaterally. Extremities: No peripheral edema, bilateral monofilament foot sensation intact.",
  },
  {
    key: "assessment",
    label: "Assessment",
    content:
      "1. Type 2 Diabetes Mellitus without complications — well controlled on oral monotherapy.\n2. Essential Hypertension — controlled to goal (< 130/80 mmHg).",
  },
  {
    key: "plan",
    label: "Plan",
    content:
      "1. Continue Metformin 500mg PO BID with meals.\n2. Continue Lisinopril 10mg PO daily in AM.\n3. Ordered: HbA1c, comprehensive metabolic panel, spot urine albumin/creatinine.\n4. Recommended annual diabetic eye exam.\n5. Return to clinic in 3 months with lab results.",
  },
]

export default function ClinicalNoteDemo() {
  const [sections, setSections] = React.useState<NoteSection[]>(sampleSoapSections)

  const handleSave = (note: ClinicalNoteData) => {
    alert(`Draft saved with ${note.sections.length} sections.`)
  }

  const handleSign = (note: ClinicalNoteData) => {
    alert(`Note signed by ${note.author ?? "Attending Physician"}.`)
  }

  return (
    <div className="flex w-full justify-center p-4">
      <ClinicalNote
        className="w-full max-w-2xl"
        template="soap"
        author="Dr. Sarah Jenkins, MD"
        sections={sections}
        onSectionsChange={setSections}
        onSave={handleSave}
        onSign={handleSign}
      />
    </div>
  )
}

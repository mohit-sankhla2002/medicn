"use client"

import * as React from "react"
import { FamilyHistory, type FamilyMember } from "@/components/medicn/family-history"

const demoMembers: FamilyMember[] = [
  {
    id: "fm-1",
    relationship: "father",
    label: "Father",
    sex: "male",
    deceased: true,
    ageAtDeath: 64,
    causeOfDeath: "Acute Myocardial Infarction",
    conditions: [
      { condition: "Coronary Artery Disease", ageOfOnset: 50, note: "CABG x 3 at age 52" },
      { condition: "Type 2 Diabetes Mellitus", ageOfOnset: 46 },
      { condition: "Hyperlipidemia", ageOfOnset: 40 },
    ],
  },
  {
    id: "fm-2",
    relationship: "mother",
    label: "Mother",
    sex: "female",
    deceased: false,
    conditions: [
      { condition: "Essential Hypertension", ageOfOnset: 58 },
      { condition: "Osteoarthritis", ageOfOnset: 62 },
    ],
  },
  {
    id: "fm-3",
    relationship: "brother",
    label: "Brother",
    sex: "male",
    deceased: false,
    conditions: [
      { condition: "Hypertension", ageOfOnset: 48 },
      { condition: "Hyperlipidemia", ageOfOnset: 45 },
    ],
  },
  {
    id: "fm-4",
    relationship: "sister",
    label: "Sister",
    sex: "female",
    deceased: false,
    conditions: [
      { condition: "Invasive Ductal Breast Carcinoma", ageOfOnset: 41, note: "BRCA1 pathogenic variant" },
    ],
  },
  {
    id: "fm-5",
    relationship: "maternalGrandmother",
    label: "Maternal Grandmother",
    sex: "female",
    deceased: true,
    ageAtDeath: 82,
    causeOfDeath: "Congestive Heart Failure",
    conditions: [
      { condition: "Atrial Fibrillation", ageOfOnset: 74 },
      { condition: "Type 2 Diabetes Mellitus", ageOfOnset: 60 },
    ],
  },
  {
    id: "fm-6",
    relationship: "paternalGrandfather",
    label: "Paternal Grandfather",
    sex: "male",
    deceased: true,
    ageAtDeath: 59,
    causeOfDeath: "Stroke / CVA",
    conditions: [
      { condition: "Cerebrovascular Disease", ageOfOnset: 55 },
      { condition: "Severe Hypertension", ageOfOnset: 45 },
    ],
  },
]

export default function FamilyHistoryDemo() {
  const handleAdd = () => {
    alert("Add family pedigree member modal triggered.")
  }

  return (
    <div className="flex w-full justify-center p-4">
      <FamilyHistory
        className="w-full max-w-4xl"
        members={demoMembers}
        onAddMember={handleAdd}
      />
    </div>
  )
}

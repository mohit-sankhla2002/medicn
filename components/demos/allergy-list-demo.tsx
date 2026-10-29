"use client"

import * as React from "react"

import { AllergyList, type Allergy } from "@/components/medicn/allergy-list"

const SUBSTANCES = [
  "Amoxicillin",
  "Aspirin",
  "Cephalexin",
  "Codeine",
  "Egg",
  "Ibuprofen",
  "Iodinated contrast",
  "Latex",
  "Morphine",
  "Peanut",
  "Penicillin",
  "Shellfish",
  "Sulfamethoxazole",
  "Tree nuts",
]

const initialAllergies: Allergy[] = [
  {
    id: "1",
    substance: "Latex",
    type: "allergy",
    category: "environment",
    criticality: "low",
    clinicalStatus: "active",
    verificationStatus: "confirmed",
    reactions: [{ manifestation: "Contact dermatitis", severity: "mild" }],
    onset: "2016",
  },
  {
    id: "2",
    substance: "Penicillin",
    code: "RxNorm 7980",
    type: "allergy",
    category: "medication",
    criticality: "high",
    clinicalStatus: "active",
    verificationStatus: "confirmed",
    reactions: [
      { manifestation: "Anaphylaxis", severity: "severe" },
      { manifestation: "Hives", severity: "moderate" },
    ],
    onset: "Childhood",
    recordedDate: "Mar 4, 2021",
  },
  {
    id: "3",
    substance: "Peanut",
    type: "allergy",
    category: "food",
    criticality: "high",
    clinicalStatus: "active",
    verificationStatus: "unconfirmed",
    reactions: [{ manifestation: "Angioedema", severity: "moderate" }],
    note: "Patient-reported; allergy referral pending.",
  },
  {
    id: "4",
    substance: "Codeine",
    type: "intolerance",
    category: "medication",
    criticality: "low",
    clinicalStatus: "active",
    verificationStatus: "confirmed",
    reactions: [{ manifestation: "Nausea", severity: "moderate" }],
  },
  {
    id: "5",
    substance: "Sulfamethoxazole",
    type: "allergy",
    category: "medication",
    criticality: "low",
    clinicalStatus: "resolved",
    verificationStatus: "confirmed",
    reactions: [{ manifestation: "Rash", severity: "mild" }],
    onset: "2009",
    note: "Tolerated rechallenge in 2022.",
  },
]

export default function AllergyListDemo() {
  const [allergies, setAllergies] = React.useState(initialAllergies)
  return (
    <AllergyList
      className="w-full max-w-2xl"
      allergies={allergies}
      onAllergiesChange={setAllergies}
      suggestions={SUBSTANCES}
    />
  )
}
